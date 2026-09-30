---
type: obligation
obl_id: OBL-REG-04
title: Honour voluntary undertakings
regime: DPDP
domain: "[[D16 Regulatory Interface]]"
act_ref: s.32
rule_ref: ''
schedule_ref: SCH-ACT-6
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P6
penalty_text: s.32 voluntary undertaking
sec: 32
trigger:
  always: true
controls:
- "[[CTL-REG-02]]"
evidence_expected:
- Undertaking tracker
tags:
- dpdp/obligation
- dpdp/D16
---

# OBL-REG-04 - Honour voluntary undertakings

> **Requirement:** Comply with any voluntary undertaking accepted by the Board.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.32 |
| Rule / instrument | - |
| Schedule | SCH-ACT-6 |
| Actor | data_fiduciary |
| Domain | [[D16 Regulatory Interface]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.32 voluntary undertaking |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Undertaking tracker

## Satisfied by controls
- [[CTL-REG-02]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-REG-04]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-REG-04]])
```
