---
type: obligation
obl_id: OBL-CHD-06
title: Fourth Schedule exemption conditions
regime: DPDP
domain: "[[D07 Children & Persons with Disability]]"
act_ref: s.9(4)
rule_ref: R12
schedule_ref: SCH4
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
- "[[CTL-SCP-03]]"
- "[[CTL-CHD-04]]"
evidence_expected:
- Exemption register entry mapped to Sch4 item
tags:
- dpdp/obligation
- dpdp/D07
---

# OBL-CHD-06 - Fourth Schedule exemption conditions

> **Requirement:** Where relying on Fourth Schedule class/purpose, restrict processing strictly to the stated condition (e.g. health services, educational safety, transport location).

| Attribute | Value |
|---|---|
| Source (Act/law) | s.9(4) |
| Rule / instrument | R12 |
| Schedule | SCH4 |
| Actor | data_fiduciary |
| Domain | [[D07 Children & Persons with Disability]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.9 children - up to Rs 200 crore |
| Applies when | flags set: children |

## Evidence expected
- Exemption register entry mapped to Sch4 item

## Satisfied by controls
- [[CTL-SCP-03]]
- [[CTL-CHD-04]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-CHD-06]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-CHD-06]])
```
