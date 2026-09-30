---
type: obligation
obl_id: OBL-REG-05
title: Appeal within 60 days
regime: DPDP
domain: "[[D16 Regulatory Interface]]"
act_ref: s.29
rule_ref: R22
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: ''
penalty_text: ''
sec: 29
trigger:
  always: true
controls:
- "[[CTL-REG-02]]"
evidence_expected:
- Litigation calendar
tags:
- dpdp/obligation
- dpdp/D16
---

# OBL-REG-05 - Appeal within 60 days

> **Requirement:** Appeal Board orders to TDSAT within 60 days (digital filing).

| Attribute | Value |
|---|---|
| Source (Act/law) | s.29 |
| Rule / instrument | R22 |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D16 Regulatory Interface]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | - |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Litigation calendar

## Satisfied by controls
- [[CTL-REG-02]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-REG-05]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-REG-05]])
```
