#!/usr/bin/env python3
"""Generate the DUATF Obsidian vault from the structured data modules."""
import datetime as dt, shutil, sys
from pathlib import Path
import yaml

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent / "engine"))
from data_legal import *
from data_obligations import DOMAINS, OBLIGATIONS
from data_controls import C as CONTROLS
from data_processes_common import COMMON
from data_sectors import SECTORS
from data_vocab import *
import data_playbook as PB
from dpdp_engine import evaluate

VAULT = Path("/home/claude/out/DPDP-DUATF-Vault")
TODAY = dt.date(2026, 9, 24)
VERSION = "1.0 (2026-09-24)"

if VAULT.exists():
    shutil.rmtree(VAULT)

class Q(str):
    pass
def _q(dumper, data):
    return dumper.represent_scalar("tag:yaml.org,2002:str", data, style='"')
yaml.SafeDumper.add_representer(Q, _q)

def L(x):
    return Q(f"[[{x}]]")

def write(rel, fm, body):
    p = VAULT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    head = ""
    if fm is not None:
        head = "---\n" + yaml.safe_dump(fm, sort_keys=False, allow_unicode=True, width=1000) + "---\n\n"
    p.write_text(head + body.strip() + "\n", encoding="utf-8")

def table(headers, rows):
    out = ["| " + " | ".join(headers) + " |", "|" + "---|" * len(headers)]
    for r in rows:
        out.append("| " + " | ".join(str(c).replace("|", "/").replace("\n", " ") for c in r) + " |")
    return "\n".join(out)

DOMAIN_NAME = {d[0]: d[1] for d in DOMAINS}
def dom_note(did):
    return f"{did} {DOMAIN_NAME[did]}"

phase_date = {p: v["date"] for p, v in PHASES.items()}
def status_for(phase):
    if not phase:
        return "in force (other law)"
    return "in force" if dt.date.fromisoformat(phase_date[phase]) <= TODAY else f"not yet in force - {phase_date[phase]}"

# ------------------------------------------------------------------ obligations index
OBL = []
for (oid, dom, title, req, act, rule, sch, actor, phase, pen, trig, ev, sec) in OBLIGATIONS:
    OBL.append(dict(obl_id=oid, domain=dom, title=title, requirement=req, act=act, rule=rule, schedule=sch,
                    actor=actor, phase=phase, penalty=pen, trigger=trig, evidence=ev, sec=sec,
                    regime="DPDP" if not oid.startswith("LNK") else "Other Indian law"))
OBL_BY = {o["obl_id"]: o for o in OBL}
CTL_FOR = {}
for c in CONTROLS:
    for o in c["obligations"]:
        assert o in OBL_BY, f"{c['id']} -> unknown {o}"
        CTL_FOR.setdefault(o, []).append(c["id"])
PEN_TXT = {k: (f"{v[0]} - up to Rs {v[1]} crore" if v[1] and v[1] >= 1 else (f"{v[0]} - up to Rs 10,000" if k == "P5" else v[0])) for k, v in PENALTIES.items()}

def sec_note(n):
    return f"S{int(n):02d} {[s for s in SECTIONS if s[0] == int(n)][0][1]}"
def rule_note(r):
    return f"{r} {[x for x in RULES if x[0] == r][0][1]}"

SEC_OBL, RULE_OBL = {}, {}
for o in OBL:
    if o["regime"] == "DPDP" and o["sec"]:
        SEC_OBL.setdefault(int(o["sec"]), []).append(o["obl_id"])
    for r in RULES:
        rr = r[0].replace("R0", "R") if r[0].startswith("R0") else r[0]
        tokens = [t.strip() for t in o["rule"].replace(",", " ").split()]
        if any(t.split("(")[0] in (r[0], rr) for t in tokens):
            RULE_OBL.setdefault(r[0], []).append(o["obl_id"])

# ------------------------------------------------------------------ 02 Legal KB: Act
for (n, title, ch, ph, summ, rules) in SECTIONS:
    fm = dict(type="act_section", section=n, title=title, chapter=ch, chapter_title=CHAPTERS[ch], phase=ph,
              in_force_date=phase_date[ph], status=status_for(ph),
              phase_note=SECTION_PHASE_NOTES.get(n, ""), rules=[L(rule_note(r)) for r in rules],
              obligations=[L(o) for o in SEC_OBL.get(n, [])], tags=["dpdp/act", f"dpdp/chapter-{ch}"])
    body = f"# Section {n} - {title}\n\nChapter {ch}: {CHAPTERS[ch]} | **Phase {ph}** ({status_for(ph)})\n\n## Summary\n{summ}\n"
    if n in SECTION_PHASE_NOTES:
        body += f"\n> Commencement split: {SECTION_PHASE_NOTES[n]}\n"
    if rules:
        body += "\n## Rules made under / linked\n" + "\n".join(f"- [[{rule_note(r)}]]" for r in rules) + "\n"
    if SEC_OBL.get(n):
        body += "\n## Atomic obligations\n" + "\n".join(f"- [[{o}]] {OBL_BY[o]['title']}" for o in SEC_OBL[n]) + "\n"
    body += "\n## Official text\n[dpdprules.org/act/%d](https://dpdprules.org/act/%d) - verify against Gazette (Act No. 22 of 2023).\n" % (n, n)
    write(f"02 Legal KB/Act/{sec_note(n)}.md", fm, body)

for (r, title, ph, secs, summ) in RULES:
    fm = dict(type="rule", rule=r, title=title, phase=ph, in_force_date=phase_date[ph], status=status_for(ph),
              sections=[L(sec_note(s)) for s in secs], obligations=[L(o) for o in RULE_OBL.get(r, [])], tags=["dpdp/rules"])
    body = f"# Rule {int(r[1:])} - {title}\n\n**Phase {ph}** ({status_for(ph)}) | G.S.R. 846(E)\n\n## Summary\n{summ}\n\n## Parent sections\n" + "\n".join(f"- [[{sec_note(s)}]]" for s in secs)
    if RULE_OBL.get(r):
        body += "\n\n## Atomic obligations\n" + "\n".join(f"- [[{o}]] {OBL_BY[o]['title']}" for o in RULE_OBL[r])
    body += f"\n\n## Official text\n[dpdprules.org/rules/{int(r[1:])}](https://dpdprules.org/rules/{int(r[1:])})\n"
    write(f"02 Legal KB/Rules/{rule_note(r)}.md", fm, body)

for (code, title, ph, summ) in SCHEDULES:
    fm = dict(type="schedule", schedule=code, title=title, phase=ph, status=status_for(ph), tags=["dpdp/schedule"])
    body = f"# {title}\n\n**Phase {ph}** ({status_for(ph)})\n\n{summ}\n"
    if code == "SCH-ACT":
        body += "\n" + table(["Item", "Breach", "Maximum penalty"], [(k, v[0], PEN_TXT[k]) for k, v in PENALTIES.items()])
        body += "\n\n## Obligations by penalty tier\n```dataview\nTABLE title, domain FROM \"02 Legal KB/Obligations\" WHERE penalty_tier SORT penalty_tier, obl_id\n```\n"
    write(f"02 Legal KB/Schedules/{code} {title.split(' - ')[0]}.md", fm, body)

for (code, name, ref) in LAWFUL_BASES:
    fm = dict(type="lawful_basis", code=code, name=name, reference=ref, tags=["dpdp/lawful-basis"])
    body = f"# {code} - {name}\n\nReference: {ref}\n\n## Activities using this basis\n```dataview\nTABLE department, process FROM -\"90 Templates\" WHERE type = \"processing_activity\" AND contains(lawful_basis, \"{code}\")\n```\n"
    if code.startswith("ex17_1"):
        body += "\n> s.17(1) exemption: Chapter II (except s.8(1) accountability and s.8(5) security), Chapter III and s.16 do not apply. **Security and accountability still apply.**\n"
    write(f"02 Legal KB/Lawful Bases/{code}.md", fm, body)

write("02 Legal KB/Commencement & Phases.md", dict(type="reference", tags=["dpdp/phases"]),
      "# Commencement & Phases\n\n" + table(["Phase", "Date", "What"], [(p, v["date"], v["label"]) for p, v in PHASES.items()]) +
      f"\n\n> {DATE_NOTE}\n\n## Act sections by phase\n```dataview\nTABLE title, chapter, status FROM \"02 Legal KB/Act\" SORT phase, section\n```\n\n## Rules by phase\n```dataview\nTABLE title, status FROM \"02 Legal KB/Rules\" SORT phase, rule\n```\n")

write("02 Legal KB/Notifications Log.md", dict(type="regulatory_log", tags=["dpdp/notifications"]), """
# Notifications & Regulatory Change Log

Track every notification that changes applicability. Each entry should trigger an impact assessment ([[CTL-SCP-04]]).

| Date | Instrument | Summary | Impact on framework | Owner | Status |
|---|---|---|---|---|---|
| 2023-08-11 | DPDP Act 2023 (Act 22 of 2023) | Assent | Baseline | - | Done |
| 2025-11-13 | G.S.R. 843(E) | Commencement in 3 phases | Phase dates set | - | Done |
| 2025-11-13 | G.S.R. 846(E) | DPDP Rules 2025 | Rules R1-R23, Sch 1-7 | - | Done |
| 2025-11-13 | Board notification | Data Protection Board established | D16 | - | Done |
| - | G.S.R. 892(E) | Corrigenda to Rules (wording) | No change to dates | - | Done |
| _watch_ | s.10(1) | SDF notifications (entity/class) | Triggers D15 | | Open |
| _watch_ | s.16(1) | Restricted countries list | CTL-XB-01 | | Open |
| _watch_ | s.17(3), 17(5) | Startup / class exemptions | Exemption register | | Open |
| _watch_ | R13(4) | Localisation of specified data (SDF) | CTL-XB-02 | | Open |
| _watch_ | R15 | Orders on foreign-State access | OBL-XB-02 | | Open |
| _watch_ | Board | Consent Manager registrations (from Phase 2) | CTL-CON-05 | | Open |
""")

# ------------------------------------------------------------------ obligations
def trig_text(t):
    if t.get("always"):
        return "Always (every in-scope activity)"
    parts = []
    if "role" in t: parts.append("entity role is " + " or ".join(t["role"]))
    if "basis" in t: parts.append("lawful basis is " + " or ".join(t["basis"]))
    if "flags" in t: parts.append("flags set: " + " AND ".join(t["flags"]))
    return "; ".join(parts)

for o in OBL:
    oid = o["obl_id"]
    fm = dict(type="obligation", obl_id=oid, title=o["title"], regime=o["regime"], domain=L(dom_note(o["domain"])),
              act_ref=o["act"], rule_ref=o["rule"], schedule_ref=o["schedule"], actor=o["actor"],
              phase=o["phase"], in_force=phase_date.get(o["phase"], "in force"), status=status_for(o["phase"]),
              penalty_tier=o["penalty"], penalty_text=PEN_TXT.get(o["penalty"], ""), sec=o["sec"],
              trigger=o["trigger"], controls=[L(c) for c in CTL_FOR.get(oid, [])],
              evidence_expected=o["evidence"], tags=["dpdp/obligation", f"dpdp/{o['domain']}"])
    if o["regime"] != "DPDP":
        fm["in_force"] = "2022-06-28" if "CERT" in oid else ""
    body = f"# {oid} - {o['title']}\n\n> **Requirement:** {o['requirement']}\n\n"
    body += table(["Attribute", "Value"], [("Source (Act/law)", o["act"]), ("Rule / instrument", o["rule"] or "-"), ("Schedule", o["schedule"] or "-"),
                   ("Actor", o["actor"]), ("Domain", f"[[{dom_note(o['domain'])}]]"), ("Commencement", status_for(o["phase"])),
                   ("Penalty exposure", PEN_TXT.get(o["penalty"], "-") or "-"), ("Applies when", trig_text(o["trigger"]))])
    body += "\n\n## Evidence expected\n" + "\n".join(f"- {e}" for e in o["evidence"])
    body += "\n\n## Satisfied by controls\n" + ("\n".join(f"- [[{c}]]" for c in CTL_FOR.get(oid, [])) or "- _No control mapped - gap in library_")
    body += f"\n\n## Activities where this applies (engine output)\n```dataview\nLIST FROM \"11 Assessments/Engine Output\" WHERE contains(applicable_obligations, [[{oid}]])\n```\n"
    body += f"\n## Findings against this obligation\n```dataview\nTABLE severity, status, owner FROM -\"90 Templates\" WHERE type = \"finding\" AND contains(obligations, [[{oid}]])\n```\n"
    write(f"02 Legal KB/Obligations/{oid}.md", fm, body)

# ------------------------------------------------------------------ 10 Control library
for (did, name, desc) in DOMAINS:
    obls = [o for o in OBL if o["domain"] == did]
    ctls = [c for c in CONTROLS if c["domain"] == did]
    fm = dict(type="domain", domain_id=did, title=name, obligation_count=len(obls), control_count=len(ctls), tags=["dpdp/domain"])
    body = f"# {did} - {name}\n\n{desc}\n\n## Obligations\n" + table(["ID", "Title", "Source", "Penalty", "Phase"],
            [(f"[[{o['obl_id']}]]", o["title"], f"{o['act']} {o['rule']}".strip(), o["penalty"] or "-", o["phase"] or "now") for o in obls])
    body += "\n\n## Controls\n" + table(["ID", "Title", "Type", "Owner"], [(f"[[{c['id']}]]", c["title"], c["type"], c["owner_role"]) for c in ctls])
    body += f"\n\n## Test results in current cycle\n```dataview\nTABLE control, rating, tester, test_date FROM -\"90 Templates\" WHERE type = \"control_test\" AND contains(domain, [[{did} {name}]])\n```\n"
    write(f"10 Control Library/Domains/{did} {name}.md", fm, body)

for c in CONTROLS:
    fm = dict(type="control", control_id=c["id"], title=c["title"], domain=L(dom_note(c["domain"])), control_type=c["type"],
              nature=c["nature"], frequency=c["frequency"], owner_role=c["owner_role"],
              obligations=[L(o) for o in c["obligations"]], iso27001_2022=c["iso27001"], iso27701_2019=c["iso27701"],
              nist_csf_2=c["nist_csf"], tags=["dpdp/control", f"dpdp/{c['domain']}"])
    body = f"# {c['id']} - {c['title']}\n\n{c['description']}\n\n"
    body += table(["Attribute", "Value"], [("Domain", f"[[{dom_note(c['domain'])}]]"), ("Type", c["type"]), ("Nature", c["nature"]), ("Frequency", c["frequency"]), ("Owner role", c["owner_role"])])
    body += "\n\n## Obligations satisfied\n" + "\n".join(f"- [[{o}]] {OBL_BY[o]['title']}" for o in c["obligations"])
    body += f"\n\n## Test procedure\n{c['test']}\n\n## Evidence\n" + "\n".join(f"- {e}" for e in c["evidence"])
    body += "\n\n## Crosswalk\n" + table(["Framework", "Reference"], [("ISO/IEC 27001:2022 Annex A", ", ".join(c["iso27001"]) or "-"), ("ISO/IEC 27701:2019 (remap if on 2025 edition)", ", ".join(c["iso27701"]) or "-"), ("NIST CSF 2.0", ", ".join(c["nist_csf"]) or "-")])
    body += f"\n\n## Tests\n```dataview\nTABLE rating, test_type, tester, test_date, cycle FROM -\"90 Templates\" WHERE type = \"control_test\" AND control = [[{c['id']}]]\n```\n"
    write(f"10 Control Library/Controls/{c['id']}.md", fm, body)

# ------------------------------------------------------------------ Process catalogue
DEFAULT_ROLES = {"data_fiduciary"}
def likely_obls(basis, flags):
    res = []
    for o in OBL:
        o2 = dict(o, obl_id=o["obl_id"])
        ok, _ = evaluate(o2, basis, set(flags) | {"online_presence"}, DEFAULT_ROLES)
        if ok and o["regime"] == "DPDP" and not o["trigger"].get("always"):
            res.append(o["obl_id"])
    return res

CTX = {t[0] for t in CONTEXT_TAGS}
ENGINE_FLAGS = {f[0] for f in FLAGS}
def proc_note(p, sector_code, sector_name, folder):
    (pid, dept, proc, acts, princ, cats, systems, tps, basis, flags, notes) = p
    eflags = [f for f in flags if f in ENGINE_FLAGS]
    ctx = [f for f in flags if f in CTX]
    specific = likely_obls(basis, eflags)
    fm = dict(type="process_template", process_id=pid, title=proc, sector=sector_name, department=dept,
              activities=acts, data_principals=princ, data_categories=cats, typical_systems=systems,
              typical_third_parties=tps, typical_lawful_basis=basis, flags=eflags, context_tags=ctx,
              specific_obligations=[L(o) for o in specific],
              sector_overlay=L(f"SEC-{sector_code} {sector_name}") if sector_code != "CMN" else "",
              tags=["dpdp/process-catalogue", f"sector/{sector_code.lower()}"])
    body = f"# {pid} - {proc}\n\n**Sector:** {sector_name} | **Department:** {dept}\n\n"
    if notes:
        body += f"> **Assessor note:** {notes}\n\n"
    body += "## Typical activities (create one `processing_activity` per row that exists at the client)\n" + "\n".join(f"{i+1}. {a}" for i, a in enumerate(acts))
    body += "\n\n" + table(["Dimension", "Typical values"], [("Data principals", ", ".join(princ)), ("Data categories", ", ".join(cats)),
            ("Systems", ", ".join(systems)), ("Third parties", ", ".join(tps) or "-"),
            ("Lawful basis (typical)", ", ".join(f"[[{b}]]" for b in basis)), ("Engine flags", ", ".join(eflags) or "-"), ("Risk context", ", ".join(ctx) or "-")])
    body += "\n\n## Obligations likely triggered (beyond the always-on baseline)\n"
    body += "Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.\n\n"
    body += "\n".join(f"- [[{o}]] {OBL_BY[o]['title']}" for o in specific) or "- Baseline only"
    body += "\n\n## Discovery prompts\n- Which of the activities above exist here, and are there others?\n- Confirm the data fields against real forms and screens.\n- Confirm every system (incl. Excel/WhatsApp) and every recipient.\n- Check whether the lawful basis per purpose is really as typical.\n- Check whether the flags hold, especially children, cross-border and processors.\n"
    write(f"{folder}/{pid} {proc.replace('/', '-')}.md", fm, body)

for p in COMMON:
    proc_note(p, "CMN", "All sectors (common functions)", "05 Processes/Catalogue/00 Common Functions")
for s in SECTORS:
    for p in s["processes"]:
        proc_note(p, s["code"], s["name"], f"05 Processes/Catalogue/{s['code']} {s['name'].replace('/', '-')}")

# ------------------------------------------------------------------ Sector overlays
for s in SECTORS:
    fm = dict(type="sector_overlay", sector_code=s["code"], title=s["name"], covers=s["covers"], regulators=s["regulators"],
              key_principals=s["principals"], process_templates=[L(f"{p[0]} {p[2].replace('/', '-')}") for p in s["processes"]],
              tags=["dpdp/sector", f"sector/{s['code'].lower()}"])
    body = f"# SEC-{s['code']} - {s['name']}\n\n**Covers:** {s['covers']}\n\n**Regulators:** {', '.join(s['regulators'])}\n\n"
    body += "## Sector laws that run alongside DPDP (s.38: DPDP is in addition; s.16(2): stricter transfer rules survive)\n" + table(["Law / instrument", "Why it matters for personal data"], s["laws"])
    body += f"\n\n## Localisation / cross-border\n{s['localisation']}\n\n## Retention anchors (use in Retention Rules; reconciles s.8(7) 'retention required by law')\n"
    body += table(["Record", "Period", "Source", "Confidence"], s["retention"])
    body += "\n\n> Confidence `verify` means you must confirm the current text before citing it in a client deliverable.\n\n## DPDP hotspots in this sector\n" + "\n".join(f"- {h}" for h in s["hotspots"])
    body += "\n\n## Where assessments get stuck here\n" + "\n".join(f"- {h}" for h in s["stuck"]) + "\n\nSee also [[Stuck-Point Playbook]]."
    body += "\n\n## Typical data principals\n" + ", ".join(s["principals"])
    body += "\n\n## Sector process templates\n" + "\n".join(f"- [[{p[0]} {p[2].replace('/', '-')}]] ({p[1]})" for p in s["processes"])
    body += "\n\n## Plus common functions\nAll [[Process Catalogue Index|common-function templates]] (HR, finance, marketing, IT, admin, legal) also apply.\n"
    write(f"16 Sector Overlays/SEC-{s['code']} {s['name']}.md", fm, body)

rows = [(f"[[{p[0]} {p[2].replace('/', '-')}]]", "Common", p[1], ", ".join(p[8])) for p in COMMON]
for s in SECTORS:
    rows += [(f"[[{p[0]} {p[2].replace('/', '-')}]]", s["name"], p[1], ", ".join(p[8])) for p in s["processes"]]
write("05 Processes/Process Catalogue Index.md", dict(type="index", tags=["dpdp/index"]),
      f"# Process Catalogue Index\n\n{len(rows)} process templates: {len(COMMON)} common-function templates plus {len(rows)-len(COMMON)} templates across {len(SECTORS)} sectors.\n\n"
      "**How to use:** pick the client's sector overlay and the common functions, copy the relevant templates into `20 Client/<org>/Processes`, and create one `processing_activity` note per real activity using the template in `90 Templates`.\n\n" +
      table(["Template", "Sector", "Department", "Typical basis"], rows) +
      "\n\n## By flag\n```dataview\nTABLE sector, department, flags FROM \"05 Processes/Catalogue\" WHERE contains(flags, \"children\") SORT sector\n```\n")

write("16 Sector Overlays/Sector Index.md", dict(type="index"), "# Sector Overlays\n\n" + table(["Sector", "Covers", "Regulators", "Templates"],
      [(f"[[SEC-{s['code']} {s['name']}]]", s["covers"], ", ".join(s["regulators"][:4]), len(s["processes"])) for s in SECTORS]))

# ------------------------------------------------------------------ Data elements & vocabularies
for (eid, name, cat, tags, note) in ELEMENTS:
    fm = dict(type="data_element", element_id=eid, title=name, category=cat, personal_data=True,
              context_tags=[t for t in tags.split(",") if t], note=note, tags=["dpdp/data-element"])
    body = f"# {eid} - {name}\n\nCategory: `{cat}` | Context: {tags or '-'}\n\n{note}\n\n## Used in activities\n```dataview\nTABLE department, process FROM -\"90 Templates\" WHERE type = \"processing_activity\" AND contains(data_elements, [[{eid} {name.replace('/', '-')}]])\n```\n"
    write(f"07 Data/Data Elements/{eid} {name.replace('/', '-')}.md", fm, body)

def vocab(name, headers, rows, intro=""):
    write(f"99 Vocabularies/{name}.md", dict(type="vocabulary", tags=["dpdp/vocabulary"]), f"# {name}\n\n{intro}\n\n" + table(headers, rows))

vocab("Engine Flags", ["Flag", "Meaning", "Domain"], [(f"`{a}`", b, f"[[{dom_note(c)}]]") for a, b, c in FLAGS], "Set these on `processing_activity.flags`. They are what the engine reads.")
vocab("Context Tags", ["Tag", "Meaning", "Impact weight"], [(f"`{a}`", b, c) for a, b, c in CONTEXT_TAGS], "Set on `processing_activity.context_tags`. They drive risk scoring, not applicability.")
vocab("Lawful Basis Codes", ["Code", "Meaning", "Reference"], [(f"[[{a}]]", b, c) for a, b, c in LAWFUL_BASES])
vocab("Entity Roles", ["Role"], [(f"`{r}`",) for r in ENTITY_ROLES])
vocab("Data Principal Types", ["Type"], [(x,) for x in DATA_PRINCIPAL_TYPES])
vocab("Channels", ["Channel"], [(x,) for x in CHANNELS])
vocab("Collection Methods", ["Method"], [(x,) for x in COLLECTION_METHODS])
vocab("Data Event Types", ["Event type"], [(f"`{x}`",) for x in EVENT_TYPES])
vocab("Digital States", ["State", "Meaning"], DIGITAL_STATES)
vocab("Transfer Types", ["Transfer type"], [(x,) for x in TRANSFER_TYPES])
vocab("System Types", ["System type"], [(x,) for x in SYSTEM_TYPES])
vocab("Hosting Locations", ["Hosting"], [(x,) for x in HOSTING])
vocab("Third Party Types", ["Type"], [(x,) for x in THIRD_PARTY_TYPES])
vocab("Test Types", ["Test", "Use"], TEST_TYPES)
vocab("Rating Scale", ["Score", "Label", "Meaning"], RATINGS, "Control rating scale (0-4, NA).")
vocab("Risk Scales", ["Score", "Label", "Meaning"], [("L" + str(a), b, c) for a, b, c in LIKELIHOOD] + [("I" + str(a), b, c) for a, b, c in IMPACT] + [(f"{a}-{b}", c, "band") for a, b, c in RISK_BANDS])
vocab("Finding Status", ["Status"], [(x,) for x in FINDING_STATUS])

# ------------------------------------------------------------------ Playbook notes
write("01 Governance/Engagement Methodology.md", dict(type="guide"), PB.METHODOLOGY)
write("01 Governance/Readiness Roadmap 2026-2027.md", dict(type="guide"), PB.ROADMAP)
write("03 Scoping/Entity Scoping Questionnaire.md", dict(type="guide"), PB.SCOPING_Q)
write("03 Scoping/Role Determination Decision Tree.md", dict(type="guide"), PB.ROLE_TREE)
write("11 Assessments/Discovery Question Bank.md", dict(type="guide"), PB.QUESTION_BANK)
write("12 Evidence/Evidence Request List (PBC).md", dict(type="guide"), PB.PBC_LIST)
write("00 Home/Stuck-Point Playbook.md", dict(type="guide"), PB.STUCK)
write("00 Home/Graph Modelling Guide.md", dict(type="guide"), PB.GRAPH_GUIDE)
write("13 Findings & Risks/Risk Methodology.md", dict(type="guide"), PB.RISK_METHOD)

# ------------------------------------------------------------------ Templates
T = {}
T["Entity Profile"] = dict(type="entity_profile", org_id="ORG-XXX", legal_name="", cin="", sectors=[], entity_role=["data_fiduciary"], sdf_status="not_notified", consent_manager=False, third_schedule=False, children_exposure=False, pwd_exposure=False, online_presence=True, cross_border=False, exemptions_claimed=[], regulators=[], dpo_or_contact="", assessment_cycle="", tags=["dpdp/entity"])
T["Department"] = dict(type="department", dept_id="DEP-XXX-", organisation="[[ORG-XXX]]", head="", privacy_spoc="", tags=["dpdp/department"])
T["Process"] = dict(type="process", process_id="PRC-XXX-", organisation="[[ORG-XXX]]", department="[[DEP-XXX-]]", catalogue_template="", owner="", activities=[], tags=["dpdp/process"])
T["Processing Activity"] = dict(type="processing_activity", activity_id="ACT-XXX-", title="", organisation="[[ORG-XXX]]", entity_profile="[[ORG-XXX Entity Profile]]", department="[[DEP-XXX-]]", process="[[PRC-XXX-]]", owner="", processing_role=["data_fiduciary"], purposes=[], lawful_basis=[], data_principals=[], data_elements=[], digital_state="digital", channels=[], collection_methods=[], systems=[], internal_access_roles=[], data_flows=[], third_parties=[], notice="", consent_record_type="", retention_rule="", volume_principals="", flags=[], context_tags=[], overrides={}, confidence="medium", status="draft", last_reviewed="", tags=["dpdp/activity"])
T["Data Event"] = dict(type="data_event", event_id="EVT-", activity="[[ACT-XXX-]]", sequence=1, event_type="collect", who="", what_data=[], why="[[PUR-]]", how="", where="[[SYS-]]", when="", to_whom="", how_long="[[RET-]]", digital_state="digital", tags=["dpdp/data-event"])
T["Purpose"] = dict(type="purpose", purpose_id="PUR-XXX-", title="", lawful_basis="consent", basis_justification="", necessary_elements=[], retention_rule="[[RET-]]", notice="[[NTC-]]", purpose_served_trigger="", tags=["dpdp/purpose"])
T["Notice"] = dict(type="notice", notice_id="NTC-XXX--v1", channel="", version="v1", effective_from="", languages=["English"], r3_standalone=False, r3_itemised_data=False, r3_purposes=False, r3_withdraw_link=False, r3_rights_link=False, r3_board_complaint=False, purposes=[], url_or_location="", tags=["dpdp/notice"])
T["Consent Record Type"] = dict(type="consent_record_type", consent_id="CRT-XXX-", capture_method="checkbox", granular_per_purpose=True, pre_ticked=False, ledger_system="[[SYS-]]", stores_notice_version=True, withdrawal_path="", withdrawal_steps_vs_giving="", consent_manager_integrated=False, tags=["dpdp/consent"])
T["Retention Rule"] = dict(type="retention_rule", retention_id="RET-XXX-", record_type="", purposes=[], dpdp_trigger="purpose end / withdrawal", minimum_period="1 year (R8(3))", maximum_period="", legal_basis_for_retention="", third_schedule=False, pre_deletion_notice_48h=False, deletion_method="", systems=[], tags=["dpdp/retention"])
T["System"] = dict(type="system", system_id="SYS-XXX-", title="", system_type="", sanctioned=True, owner="", vendor="[[TP-]]", hosting="", country="India", encryption_at_rest="unknown", access_logging="unknown", mfa="unknown", backup="unknown", rights_lookup_key="", purpose_tags=[], tags=["dpdp/system"])
T["Third Party"] = dict(type="third_party", tp_id="TP-XXX-", name="", third_party_type="", processing_role=["data_processor"], role_rationale="", services="", data_received=[], purposes=[], country="India", sub_processors=[], contract_status="", dpa_status="none", dpa_r6_security=False, breach_notify_sla_hours="", erasure_on_termination=False, audit_rights=False, certifications=[], risk_tier="", last_review="", tags=["dpdp/third-party"])
T["Data Flow"] = dict(type="data_flow", flow_id="FLW-XXX-", from_system="[[SYS-]]", to="[[TP-]]", activity="[[ACT-XXX-]]", transfer_type="to processor", data_elements=[], frequency="", mechanism="API / SFTP / email / portal", encryption_in_transit="unknown", cross_border=False, country="India", confidence="medium", tags=["dpdp/flow"])
T["Assessment Cycle"] = dict(type="assessment_cycle", cycle_id="CYC-2026Q4", organisation="[[ORG-XXX]]", scope="", start="", end="", lead="", status="planned", tags=["dpdp/cycle"])
T["Control Test"] = dict(type="control_test", test_id="TST-", cycle="[[CYC-2026Q4]]", control="[[CTL-]]", domain="[[D09 Security Safeguards]]", activities=[], systems=[], test_type="Inspection", population="", sample_size="", tester="", test_date="", evidence=[], rating=None, result_summary="", findings=[], tags=["dpdp/test"])
T["Evidence"] = dict(type="evidence", evidence_id="EVD-XXX-", title="", pbc_ref="", source="", collected_on="", valid_until="", status="requested", sufficiency="", file_link="", controls=[], tags=["dpdp/evidence"])
T["Finding"] = dict(type="finding", finding_id="FND-XXX-", title="", cycle="[[CYC-2026Q4]]", organisation="[[ORG-XXX]]", department="[[DEP-XXX-]]", process="[[PRC-XXX-]]", activity="[[ACT-XXX-]]", data_flow="", system="", obligations=[], controls=[], expected_state="", observed_state="", evidence=[], gap="", penalty_tier="", context_tags=[], likelihood=3, impact=3, risk_score=9, severity="Medium", owner="", remediation="[[REM-XXX-]]", target_date="", status="Draft", tags=["dpdp/finding"])
T["Remediation"] = dict(type="remediation", rem_id="REM-XXX-", findings=[], workstream="", action="", owner="", start="", target_date="", status="Not started", retest="", tags=["dpdp/remediation"])
T["Rights Request"] = dict(type="rights_request", request_id="DSR-", received_on="", channel="", right="access|correction|completion|updating|erasure|nomination|grievance|withdrawal", identifier_used="", verified=False, systems_searched=[], processors_notified=[], legal_retention_applied="", due_by="(received + 90 days max; set internal SLA e.g. 30)", closed_on="", outcome="", tags=["dpdp/rights"])
T["Breach Record"] = dict(type="breach", breach_id="BRE-", aware_at="", detected_by="", description="", personal_data_affected=True, principals_affected="", data_elements=[], systems=[], processor_involved="", certin_due="(aware + 6h)", certin_reported_at="", board_initial_at="", board_72h_due="(aware + 72h)", board_72h_reported_at="", sector_regulator="", sector_reported_at="", dp_notified_at="", root_cause="", status="open", tags=["dpdp/breach"])
T["DPIA"] = dict(type="dpia", dpia_id="DPIA-", scope_activities=[], trigger="new processing / SDF annual / high risk", assessor="", date="", risks=[], measures=[], residual_risk="", approved_by="", tags=["dpdp/dpia"])
T["Regulatory Change"] = dict(type="regulatory_change", change_id="REGCHG-", date="", instrument="", summary="", affected_obligations=[], affected_controls=[], impact="", owner="", status="open", tags=["dpdp/reg-change"])
T["Govt or LEA Request"] = dict(type="authority_request", req_id="AUTH-", received_on="", authority="", legal_basis="", data_requested="", confidentiality_direction=False, responded_on="", approved_by="", tags=["dpdp/authority-request"])

TEMPLATE_BODY = {
    "Processing Activity": "# {{title}}\n\n## Description\nWhat happens, step by step, in plain words.\n\n## Data events\n| # | Event | Who | Data | System | To whom |\n|---|---|---|---|---|---|\n| 1 | collect | | | | |\n\n## Open questions\n- \n\n## Engine output\n![[Applicability - {{activity_id}}]]\n",
    "Finding": "# Finding\n\n## Expected (requirement)\n\n## Observed (condition)\n\n## Evidence\n\n## Impact / risk\n\n## Recommendation\n\n## Management response\n",
    "Breach Record": "# Breach\n\n## Timeline (single awareness timestamp drives all clocks)\n| Clock | Due | Done |\n|---|---|---|\n| CERT-In (6h) | | |\n| Board - initial (without delay) | | |\n| Board - detailed (72h) | | |\n| Sector regulator | | |\n| Affected DPs (without delay) | | |\n\n## Rule 7(1) DP notice content\n- Description (nature, extent, timing)\n- Likely consequences\n- Mitigation taken\n- Safety measures for the DP\n- Contact person\n",
}
for name, fm in T.items():
    write(f"90 Templates/TPL - {name}.md", fm, TEMPLATE_BODY.get(name, f"# {name}\n\n## Notes\n"))

# ------------------------------------------------------------------ Operations trackers
ops = {
 "Rights Request Log": ("rights_request", "TABLE right, received_on, due_by, closed_on, outcome", "Target: internal SLA 30 days; statutory maximum 90 days (R14(3))."),
 "Breach Register": ("breach", "TABLE aware_at, principals_affected, certin_reported_at, board_initial_at, board_72h_reported_at, dp_notified_at, status", "Clocks: CERT-In 6h; Board without delay + 72h; affected DPs without delay; sector regulator per its rules."),
 "DPIA Register": ("dpia", "TABLE scope_activities, date, residual_risk, approved_by", "Mandatory annually for SDFs (R13(1)); good practice for high-risk activities."),
 "Regulatory Change Register": ("regulatory_change", "TABLE date, instrument, impact, status", "Also see [[Notifications Log]]."),
 "Authority Request Register": ("authority_request", "TABLE received_on, authority, legal_basis, confidentiality_direction, responded_on", "R23 & law-enforcement requests; restricted confidentiality."),
 "Vendor Review Calendar": ("third_party", "TABLE third_party_type, processing_role, country, dpa_status, risk_tier, last_review", "Annual for critical/high tier."),
 "Evidence Tracker": ("evidence", "TABLE status, collected_on, valid_until, controls", "Evidence expiring within 60 days needs refresh."),
}
for name, (typ, q, note) in ops.items():
    write(f"15 Operations/{name}.md", dict(type="tracker"), f"# {name}\n\n{note}\n\nCreate entries from the matching template in `90 Templates`.\n\n```dataview\n{q}\nFROM -\"90 Templates\" WHERE type = \"{typ}\"\nSORT file.name DESC\n```\n")

# ------------------------------------------------------------------ Home / README
n_obl_dpdp = sum(1 for o in OBL if o["regime"] == "DPDP")
counts = dict(sections=len(SECTIONS), rules=len(RULES), schedules=len(SCHEDULES), obligations=len(OBL), dpdp_obl=n_obl_dpdp,
              controls=len(CONTROLS), domains=len(DOMAINS), sectors=len(SECTORS), processes=len(COMMON) + sum(len(s["processes"]) for s in SECTORS),
              elements=len(ELEMENTS), templates=len(T))

HOME = f"""
# DPDP Unified Assessment & Tracking Framework (DUATF)

Version {VERSION} | Legal baseline: DPDP Act 2023 + DPDP Rules 2025 (G.S.R. 846(E)) as verified Sept 2026

> **Countdown:** Phase 2 (Consent Managers) `$= Math.ceil((dv.date("2026-11-13") - dv.date("today"))/86400000)` days | Phase 3 (all obligations) `$= Math.ceil((dv.date("2027-05-13") - dv.date("today"))/86400000)` days

## What's inside
{table(["Layer", "Contents", "Where"], [
 ("L0 Governance", "Methodology, roadmap, RACI", "[[Engagement Methodology]], [[Readiness Roadmap 2026-2027]]"),
 ("L1 Legal KB", f"{counts['sections']} sections, {counts['rules']} rules, {counts['schedules']} schedules, {counts['obligations']} atomic obligations ({counts['dpdp_obl']} DPDP + {counts['obligations']-counts['dpdp_obl']} linked Indian-law duties)", "`02 Legal KB`"),
 ("L2 Scoping", "Entity questionnaire, role decision tree, exemptions", "[[Entity Scoping Questionnaire]], [[Role Determination Decision Tree]]"),
 ("L3 Org data graph", f"{counts['processes']} process templates ({len(COMMON)} common + {counts['sectors']} sectors), {counts['elements']} data elements, vocabularies", "[[Process Catalogue Index]], [[Sector Index]]"),
 ("L4 Engine", "Python applicability engine: activity flags x obligation triggers", "`engine/dpdp_engine.py`"),
 ("L5 Controls", f"{counts['controls']} controls in {counts['domains']} domains with ISO 27001/27701 and NIST CSF crosswalk", "`10 Control Library`"),
 ("L6 Assessment", "Question bank, PBC list, test types, rating scale", "[[Discovery Question Bank]], [[Evidence Request List (PBC)]]"),
 ("L7 Risk", "L x I with penalty-tier impact", "[[Risk Methodology]]"),
 ("L8 Operations", "Rights, breach, DPIA, vendor, change, authority registers", "`15 Operations`"),
 ("L9 Reporting", "This dashboard (Dataview)", "below"),
])}

**Start here:** [[README - Start Here]] | **When stuck:** [[Stuck-Point Playbook]] | **How the graph works:** [[Graph Modelling Guide]]

---
## Live dashboard (needs Dataview plugin; enable JavaScript queries for the countdown)

### Activities mapped
```dataview
TABLE department, lawful_basis, flags, confidence, status
FROM -"90 Templates" WHERE type = "processing_activity"
SORT department
```

### Findings by severity
```dataview
TABLE rows.file.link AS Findings, length(rows) AS Count
FROM -"90 Templates" WHERE type = "finding" AND status != "Closed"
GROUP BY severity
```

### Open findings by owner
```dataview
TABLE severity, risk_score, target_date, status
FROM -"90 Templates" WHERE type = "finding" AND status != "Closed"
SORT risk_score DESC
```

### Control ratings (current cycle)
```dataview
TABLE control, rating, test_type, test_date
FROM -"90 Templates" WHERE type = "control_test"
SORT rating ASC
```

### Low-confidence mapping (open discovery)
```dataview
LIST FROM -"90 Templates" WHERE (type = "data_flow" OR type = "processing_activity") AND confidence = "low"
```

### Shadow / unsanctioned systems
```dataview
TABLE system_type, owner, hosting FROM -"90 Templates" WHERE type = "system" AND sanctioned = false
```

### Cross-border recipients
```dataview
TABLE third_party_type, processing_role, country, dpa_status FROM -"90 Templates" WHERE type = "third_party" AND country != "India"
```

### Processors without DPA
```dataview
TABLE third_party_type, country FROM -"90 Templates" WHERE type = "third_party" AND contains(processing_role, "data_processor") AND dpa_status = "none"
```

### Evidence expiring in 60 days
```dataview
TABLE valid_until, controls FROM -"90 Templates" WHERE type = "evidence" AND valid_until AND date(valid_until) <= date(today) + dur(60 days)
```
"""
write("00 Home/Home.md", dict(type="dashboard", cssclasses=["wide"]), HOME)

README = f"""
# README - Start Here

## 1. Set up (10 minutes)
1. Open this folder as a vault in Obsidian.
2. Install community plugins: **Dataview** (required; enable "JavaScript queries" for the countdown). Optional: **Templater**, **Excalidraw/Canvas** for flow diagrams, **Obsidian Git** for team versioning.
3. Settings > Core plugins > **Templates**: set the template folder to `90 Templates`.
4. Install Python 3 + `pip install pyyaml` to run the engine.

## 2. The framework in one picture
```mermaid
flowchart TB
  subgraph L1[L1 Legal KB]
    S[Sections] --> O[Atomic Obligations]
    R[Rules] --> O
    SC[Schedules] --> O
  end
  subgraph L3[L3 Organisation Graph]
    A[Processing Activity] --- P[Purpose & Basis]
    A --- SY[Systems]
    A --- TP[Third Parties / Flows]
    A --- DE[Data Elements & Principals]
  end
  EP[L2 Entity Profile] --> ENG
  A -->|flags + basis| ENG[L4 Engine]
  O -->|triggers| ENG
  ENG --> AR[Applicable Requirements]
  AR --> CT[L5 Controls]
  CT --> TS[L6 Tests & Evidence]
  TS --> F[L7 Findings & Risk]
  F --> RM[Remediation]
  RM --> OPS[L8 Operations]
  OPS --> DB[L9 Dashboard]
```

## 3. How to run a client assessment
1. **Copy** `20 Example - DemoPay` as a pattern, or create `20 Client/<ORG>/`.
2. **Profile the entity** using [[Entity Scoping Questionnaire]]. Create the Entity Profile from `TPL - Entity Profile`.
3. **Pick templates** from the [[Sector Index]] and [[Process Catalogue Index]] (common functions + the client's sector).
4. **Run workshops** with the [[Discovery Question Bank]]. For each real activity create a note from `TPL - Processing Activity`. Link systems, third parties, flows, purposes, notices and retention rules. Create shared objects once and link them many times.
5. **Set** `lawful_basis` and `flags` on every activity. Set `entity_profile` to link the profile.
6. **Run the engine** from the vault root: `python3 engine/dpdp_engine.py`. Each activity gets `11 Assessments/Engine Output/Applicability - <ACT>.md` plus a CSV matrix.
7. **Test controls.** From each applicable obligation, follow its linked controls and create `Control Test` notes with evidence. Rate 0-4.
8. **Raise findings** (one per activity/control gap) and score them with [[Risk Methodology]]. Link a remediation.
9. **Report** with [[Home]]. Export tables or use the Excel master register for client-facing packs.

## 4. Conventions
- **IDs** are in [[Graph Modelling Guide]]. Note file names start with the ID so links stay stable.
- **Properties** are the source of truth for queries. The body is for narrative.
- **Obligations and controls are framework-owned.** Don't edit them per client. Add client-specific controls as `CTL-<ORG>-xx`.
- **Dates:** Phase 2 = 13 Nov 2026, Phase 3 = 13 May 2027 (computed; see [[Commencement & Phases]]).
- **Confidence `verify`** in sector retention anchors means check the current legal text before citing it.

## 5. Keeping it current
- Log each notification in [[Notifications Log]] and re-run impact on obligations and controls.
- When a law changes an obligation, edit the obligation note once. Every activity picks up the change on the next engine run.

## 6. Disclaimer
This is a working compliance framework, not legal advice. Obligation wording is summarised from the Gazette text (verified Sept 2026 against dpdprules.org and the official PDFs). Confirm against the official text for client deliverables.
"""
write("00 Home/README - Start Here.md", dict(type="guide"), README)

# engine
(VAULT / "engine").mkdir(parents=True, exist_ok=True)
shutil.copy(Path(__file__).parent / "engine" / "dpdp_engine.py", VAULT / "engine" / "dpdp_engine.py")

# placeholder folders
for d in ["04 Organisation", "06 Purposes & Notices", "08 Technology", "09 Third Parties", "14 Remediation", "20 Client"]:
    write(f"{d}/_About this folder.md", dict(type="folder_note"), f"# {d}\n\nClient instance objects go here (or under `20 Client/<ORG>/`). Use templates from `90 Templates`. See [[Graph Modelling Guide]].")

print(counts)
