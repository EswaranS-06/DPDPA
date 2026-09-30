---
type: obligation
obl_id: OBL-RGT-08
title: Handle requests considering Data Principal duties
regime: DPDP
domain: "[[D12 Rights & Grievance]]"
act_ref: s.15
rule_ref: ''
schedule_ref: SCH-ACT-5
actor: data_principal
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P5
penalty_text: s.15 Data Principal duties - up to Rs 10,000
sec: 15
trigger:
  always: true
controls:
- "[[CTL-RGT-02]]"
evidence_expected:
- Rejection reasons log
tags:
- dpdp/obligation
- dpdp/D12
---

# OBL-RGT-08 - Handle requests considering Data Principal duties

> **Requirement:** Handle requests in light of DP duties (no false/frivolous grievances, authentic info for correction).

| Attribute | Value |
|---|---|
| Source (Act/law) | s.15 |
| Rule / instrument | - |
| Schedule | SCH-ACT-5 |
| Actor | data_principal |
| Domain | [[D12 Rights & Grievance]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.15 Data Principal duties - up to Rs 10,000 |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Rejection reasons log

## Satisfied by controls
- [[CTL-RGT-02]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-RGT-08]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-RGT-08]])
```
