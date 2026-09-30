#!/usr/bin/env python3
"""
DPDP Applicability Engine (L4) - DUATF
=====================================
Reads the Obsidian vault, finds every note with `type: processing_activity`, combines it with its
Entity Profile (`type: entity_profile`, linked via `entity_profile:`), evaluates every obligation
note (`type: obligation`) trigger, and writes one "Applicability - <activity>.md" note per activity
into `11 Assessments/Engine Output/` plus a CSV matrix.

Usage:
    python3 engine/dpdp_engine.py            # run from vault root
    python3 engine/dpdp_engine.py --vault /path/to/vault --today 2027-05-13

Requires: PyYAML  (pip install pyyaml)
Nothing is deleted except previously generated engine output files.
"""
import argparse, csv, datetime as dt, os, re, sys
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover
    sys.exit("PyYAML missing: pip install pyyaml")

DF_LIKE = {"data_fiduciary", "significant_data_fiduciary", "sdf", "joint_data_fiduciary", "state_instrumentality", "state"}
EXEMPT_17_1 = {"ex17_1a", "ex17_1b", "ex17_1c", "ex17_1d", "ex17_1e", "ex17_1f"}
EXEMPT_17_2 = {"ex17_2a", "ex17_2b"}
ENTITY_FLAGS = {"third_schedule", "online_presence", "consent_manager_used"}
LINK_RE = re.compile(r"\[\[([^\]|#]+)")


def strip_link(v):
    if isinstance(v, str):
        m = LINK_RE.search(v)
        return m.group(1).strip() if m else v.strip()
    return v


def as_list(v):
    if v is None:
        return []
    if isinstance(v, (list, tuple, set)):
        return [strip_link(x) for x in v if x not in (None, "")]
    return [strip_link(v)]


def read_frontmatter(path):
    text = Path(path).read_text(encoding="utf-8")
    if not text.startswith("---"):
        return None, text
    end = text.find("\n---", 3)
    if end == -1:
        return None, text
    try:
        fm = yaml.safe_load(text[3:end]) or {}
    except yaml.YAMLError as e:
        print(f"[warn] YAML error in {path}: {e}")
        return None, text
    return fm, text[end + 4:]


def evaluate(obl, basis, flags, roles, sdf=False, today=None):
    """Return (applies: bool, reason: str) for one obligation dict against an activity context."""
    trig = obl.get("trigger") or {}
    basis = set(basis or [])
    flags = set(flags or [])
    roles = set(roles or [])
    if sdf:
        roles |= {"sdf", "data_fiduciary"}
    if roles & {"significant_data_fiduciary", "state_instrumentality", "state", "joint_data_fiduciary"}:
        roles |= {"data_fiduciary"}
    if "significant_data_fiduciary" in roles:
        roles.add("sdf")
    if "state_instrumentality" in roles:
        roles.add("state")
    actor = obl.get("actor", "data_fiduciary")
    sec = obl.get("sec", 0) or 0
    oid = obl.get("obl_id", "")
    regime = obl.get("regime", "DPDP")

    # --- actor / role gate
    if actor in ("data_fiduciary", "data_principal") and not (roles & DF_LIKE):
        return False, "Entity acts as Data Processor for this activity - DF duties sit with the client (flow down via contract)"
    if actor == "sdf" and "sdf" not in roles:
        return False, "Entity not notified as Significant Data Fiduciary"
    if actor == "consent_manager" and "consent_manager" not in roles:
        return False, "Entity is not a Consent Manager"
    if actor == "state" and "state" not in roles and "s7b" not in basis:
        return False, "Not State processing"

    # --- exemptions (DPDP only)
    if regime == "DPDP" and basis:
        if basis <= EXEMPT_17_2 and oid not in ("OBL-SCP-03", "OBL-RES-01"):
            return False, "s.17(2) exemption - Act does not apply (subject to conditions)"
        if basis <= (EXEMPT_17_1 | EXEMPT_17_2) and basis & EXEMPT_17_1:
            if (4 <= sec < 17) and sec not in (8.1, 8.5) and oid != "OBL-SCP-03":
                return False, "s.17(1) exemption - Ch II (except s.8(1),(5)), Ch III and s.16 disapplied"
        if basis == {"ex17_3"} and (sec in (5, 8.3, 8.7, 10, 11)):
            return False, "s.17(3) notified exemption (verify notification)"
    if "state" in roles and oid in ("OBL-RET-01", "OBL-RET-06", "OBL-RGT-04"):
        return False, "s.17(4) - State processing: s.8(7) and s.12(3) do not apply"

    # --- trigger evaluation
    if trig.get("always"):
        return True, "Applies to every in-scope processing activity"
    if "role" in trig:
        need = set(trig["role"])
        if "sdf" in need and "sdf" not in roles:
            return False, "Entity not SDF"
        if "consent_manager" in need and "consent_manager" not in roles:
            return False, "Entity not Consent Manager"
    if "basis" in trig and not (set(trig["basis"]) & basis):
        return False, f"Lawful basis not in {trig['basis']}"
    if "flags" in trig:
        missing = [f for f in trig["flags"] if f not in flags]
        if missing:
            return False, f"Flag(s) not set: {', '.join(missing)}"
    parts = []
    if "basis" in trig:
        parts.append("basis " + "/".join(sorted(set(trig["basis"]) & basis)))
    if "flags" in trig:
        parts.append("flags " + ", ".join(trig["flags"]))
    if "role" in trig:
        parts.append("role " + "/".join(trig["role"]))
    return True, "Triggered by " + "; ".join(parts)


def in_force(obl, today):
    d = obl.get("in_force")
    if not d:
        return True
    try:
        return dt.date.fromisoformat(str(d)) <= today
    except ValueError:
        return False


def load_vault(vault):
    notes = {}
    for p in Path(vault).rglob("*.md"):
        if ".obsidian" in p.parts or ".trash" in p.parts or "90 Templates" in p.parts:
            continue
        fm, _ = read_frontmatter(p)
        if fm and isinstance(fm, dict) and fm.get("type"):
            notes[p.stem] = (p, fm)
    return notes


def run(vault, today, out_rel="11 Assessments/Engine Output"):
    vault = Path(vault)
    notes = load_vault(vault)
    obligations = {k: fm for k, (p, fm) in notes.items() if fm.get("type") == "obligation"}
    controls_for = {}
    for k, (p, fm) in notes.items():
        if fm.get("type") == "control":
            for o in as_list(fm.get("obligations")):
                controls_for.setdefault(o, []).append(k)
    profiles = {k: fm for k, (p, fm) in notes.items() if fm.get("type") == "entity_profile"}
    activities = {k: (p, fm) for k, (p, fm) in notes.items() if fm.get("type") == "processing_activity"}
    if not activities:
        print("No processing_activity notes found.")
        return
    out = vault / out_rel
    out.mkdir(parents=True, exist_ok=True)
    for f in out.glob("Applicability - *.md"):
        f.unlink()
    matrix = []
    for aid, (path, act) in sorted(activities.items()):
        prof = {}
        for ref in as_list(act.get("entity_profile")):
            prof = profiles.get(ref, prof)
        roles = set(as_list(act.get("processing_role")) or as_list(prof.get("entity_role")) or ["data_fiduciary"])
        sdf = bool(prof.get("sdf_status") in (True, "notified", "yes"))
        flags = set(as_list(act.get("flags")))
        for ef in ENTITY_FLAGS:
            if prof.get(ef) in (True, "yes"):
                flags.add(ef)
        basis = as_list(act.get("lawful_basis"))
        rows = []
        for oid, obl in sorted(obligations.items()):
            ok, why = evaluate(obl, basis, flags, roles, sdf, today)
            rows.append(dict(obl=oid, title=obl.get("title", ""), domain=strip_link(obl.get("domain", "")),
                             penalty=obl.get("penalty_tier", ""), phase=obl.get("phase", ""),
                             live=in_force(obl, today), applies=ok, reason=why,
                             controls=controls_for.get(oid, [])))
            matrix.append([aid, oid, "Y" if ok else "N", why])
        app = [r for r in rows if r["applies"]]
        na = [r for r in rows if not r["applies"]]
        lines = ["---", "type: engine_output", f"activity: \"[[{aid}]]\"", f"generated: {dt.date.today().isoformat()}",
                 f"as_of: {today.isoformat()}", f"applicable_count: {len(app)}", f"not_applicable_count: {len(na)}",
                 "applicable_obligations:"] + [f"  - \"[[{r['obl']}]]\"" for r in app] + ["---", "",
                 f"# Applicability - [[{aid}]]", "",
                 f"> Generated by the DPDP engine. Basis: `{', '.join(basis) or 'NOT SET'}` | Flags: `{', '.join(sorted(flags)) or 'none'}` | Roles: `{', '.join(sorted(roles))}` | As of {today.isoformat()}",
                 "", "Do not edit by hand. Change the activity's properties and re-run the engine. To override a result, add `overrides:` to the activity note.", "",
                 f"## Applicable obligations ({len(app)})", "",
                 "| Obligation | Title | Domain | Penalty | In force? | Why | Controls |", "|---|---|---|---|---|---|---|"]
        overrides = act.get("overrides") or {}
        for r in app:
            ov = f" **OVERRIDE:** {overrides[r['obl']]}" if r["obl"] in overrides else ""
            ctl = ", ".join(f"[[{c}]]" for c in r["controls"]) or "-"
            lines.append(f"| [[{r['obl']}]] | {r['title']} | [[{r['domain']}]] | {r['penalty'] or '-'} | {'Yes' if r['live'] else 'Phase ' + str(r['phase'])} | {r['reason']}{ov} | {ctl} |")
        lines += ["", f"## Not applicable ({len(na)})", "", "| Obligation | Title | Reason |", "|---|---|---|"]
        for r in na:
            lines.append(f"| [[{r['obl']}]] | {r['title']} | {r['reason']} |")
        (out / f"Applicability - {aid}.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    with open(out / "applicability_matrix.csv", "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(["activity", "obligation", "applies", "reason"])
        w.writerows(matrix)
    print(f"Engine: {len(activities)} activities x {len(obligations)} obligations -> {out}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--vault", default=".")
    ap.add_argument("--today", default=dt.date.today().isoformat())
    a = ap.parse_args()
    run(a.vault, dt.date.fromisoformat(a.today))
