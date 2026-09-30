---
type: obligation
obl_id: OBL-CHD-04
title: No detrimental processing
regime: DPDP
domain: "[[D07 Children & Persons with Disability]]"
act_ref: s.9(2)
rule_ref: ''
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P3
penalty_text: s.9 children - up to Rs 200 crore
sec: 9
trigger:
  flags:
  - children
controls:
- "[[CTL-CHD-03]]"
evidence_expected:
- Child impact assessment
tags:
- dpdp/obligation
- dpdp/D07
---

# OBL-CHD-04 - No detrimental processing

> **Requirement:** Do not process children's data in a manner likely to cause detrimental effect on well-being.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.9(2) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D07 Children & Persons with Disability]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.9 children - up to Rs 200 crore |
| Applies when | flags set: children |

## Evidence expected
- Child impact assessment

## Satisfied by controls
- [[CTL-CHD-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-CHD-04]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-CHD-04]])
```
