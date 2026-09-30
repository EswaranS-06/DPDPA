# CLAUDE.md - DUATF Obsidian Vault

This is the Obsidian vault for **DUATF (DPDP Unified Assessment & Tracking Framework)**. It is a universal, process-first assessment framework for India's DPDP Act 2023 + DPDP Rules 2025. It is built by ComplyX Cybersecurity Services for real client assessments across all sectors.

**Read `_context/DUATF-Knowledge-Handoff.md` first.** It holds the verified legal knowledge, the v1 design, the validation gaps (G1-G10), the agreed v0.2 direction and the open questions.

## Working rules
- The focus is the **framework logic** (validate, find gaps, fix), not generating more registry content.
- Obsidian conventions:
  - YAML properties are the source of truth.
  - Links are `[[ID Title]]`.
  - IDs: ORG-, DEP-, PRC-, ACT-, EVT-, PUR-, SYS-, TP-, FLW-, NTC-, RET-, OBL-, CTL-, TST-, EVD-, FND-, REM-.
  - Dataview queries exclude `90 Templates` (`FROM -"90 Templates"`).
- Framework-owned notes: `02 Legal KB`, `10 Control Library`, `05 Processes/Catalogue`, `16 Sector Overlays`, `99 Vocabularies`. Client work goes in `20 Client/<ORG>/`. `_framework-source/` generators overwrite framework notes if re-run, so prefer direct note edits unless you are regenerating on purpose.
- Engine: `python engine/dpdp_engine.py` from the vault root (needs PyYAML). It writes to `11 Assessments/Engine Output/`.
- Keep legal statements accurate:
  - Phase 2 = 13 Nov 2026 and Phase 3 = 13 May 2027 (computed; possibly +1 day).
  - Sector items flagged `verify` must be checked before being cited.
  - Nothing here is legal advice.
- Validate after bulk edits: every note's YAML parses, there are no new broken links, and the engine runs.

## Next planned changes (v0.2)
1. Add `anchor_level` and `tier` to obligations.
2. Add acceptance criteria.
3. Add an Interpretation Decisions Log.
4. Add a Legal Entity/Group layer and Fiduciary/Processor/CM tracks.
5. Put lawful basis on Purpose.
6. Engine: per-anchor evaluation + roll-up + readiness/compliance modes.
7. Record compliance status and maturity as separate results.
8. Pilot on a real client.

Details are in the handoff file, section 6.
