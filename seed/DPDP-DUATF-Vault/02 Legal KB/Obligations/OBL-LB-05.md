---
type: obligation
obl_id: OBL-LB-05
title: s.7(f)-(h) emergency use bounded
regime: DPDP
domain: "[[D04 Lawful Basis & Purpose]]"
act_ref: s.7(f),(g),(h)
rule_ref: ''
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 7
trigger:
  basis:
  - s7f
  - s7g
  - s7h
controls:
- "[[CTL-LB-01]]"
evidence_expected:
- Emergency processing log
tags:
- dpdp/obligation
- dpdp/D04
---

# OBL-LB-05 - s.7(f)-(h) emergency use bounded

> **Requirement:** Processing for medical emergency, epidemic, disaster or public order is limited to the emergency and documented.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.7(f),(g),(h) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D04 Lawful Basis & Purpose]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | lawful basis is s7f or s7g or s7h |

## Evidence expected
- Emergency processing log

## Satisfied by controls
- [[CTL-LB-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-LB-05]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-LB-05]])
```
