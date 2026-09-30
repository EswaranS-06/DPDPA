---
type: obligation
obl_id: OBL-CHD-02
title: Verify parent is identifiable adult
regime: DPDP
domain: "[[D07 Children & Persons with Disability]]"
act_ref: s.9(1)
rule_ref: R10(1)
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
- "[[CTL-CHD-02]]"
evidence_expected:
- Age/identity verification method & logs
tags:
- dpdp/obligation
- dpdp/D07
---

# OBL-CHD-02 - Verify parent is identifiable adult

> **Requirement:** Due diligence that the person claiming to be parent is an identifiable adult using reliable details held, voluntarily provided details, or virtual token from authorised entity (e.g. DigiLocker).

| Attribute | Value |
|---|---|
| Source (Act/law) | s.9(1) |
| Rule / instrument | R10(1) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D07 Children & Persons with Disability]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.9 children - up to Rs 200 crore |
| Applies when | flags set: children |

## Evidence expected
- Age/identity verification method & logs

## Satisfied by controls
- [[CTL-CHD-02]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-CHD-02]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-CHD-02]])
```
