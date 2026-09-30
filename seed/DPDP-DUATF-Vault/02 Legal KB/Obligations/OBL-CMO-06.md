---
type: obligation
obl_id: OBL-CMO-06
title: Audit & change of control
regime: DPDP
domain: "[[D18 Consent Manager Operations]]"
act_ref: s.6(8)
rule_ref: R4(2)
schedule_ref: SCH1-B12,B13
actor: consent_manager
phase: 2
in_force: '2026-11-13'
status: not yet in force - 2026-11-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 6
trigger:
  role:
  - consent_manager
controls:
- "[[CTL-CMO-01]]"
evidence_expected:
- Audit reports
- Approval letters
tags:
- dpdp/obligation
- dpdp/D18
---

# OBL-CMO-06 - Audit & change of control

> **Requirement:** Effective audit mechanism reporting to Board; prior Board approval for transfer of control.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.6(8) |
| Rule / instrument | R4(2) |
| Schedule | SCH1-B12,B13 |
| Actor | consent_manager |
| Domain | [[D18 Consent Manager Operations]] |
| Commencement | not yet in force - 2026-11-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | entity role is consent_manager |

## Evidence expected
- Audit reports
- Approval letters

## Satisfied by controls
- [[CTL-CMO-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-CMO-06]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-CMO-06]])
```
