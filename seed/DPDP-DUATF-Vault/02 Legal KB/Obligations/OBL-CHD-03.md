---
type: obligation
obl_id: OBL-CHD-03
title: Age-gating / child identification
regime: DPDP
domain: "[[D07 Children & Persons with Disability]]"
act_ref: s.9
rule_ref: R10
schedule_ref: SCH4-B6
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
- "[[CTL-CHD-01]]"
evidence_expected:
- Age-gate design
- Risk assessment
tags:
- dpdp/obligation
- dpdp/D07
---

# OBL-CHD-03 - Age-gating / child identification

> **Requirement:** Have a mechanism to determine whether a DP is a child (risk-based age assurance).

| Attribute | Value |
|---|---|
| Source (Act/law) | s.9 |
| Rule / instrument | R10 |
| Schedule | SCH4-B6 |
| Actor | data_fiduciary |
| Domain | [[D07 Children & Persons with Disability]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.9 children - up to Rs 200 crore |
| Applies when | flags set: children |

## Evidence expected
- Age-gate design
- Risk assessment

## Satisfied by controls
- [[CTL-CHD-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-CHD-03]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-CHD-03]])
```
