---
type: obligation
obl_id: OBL-PWD-02
title: Verify guardian appointment
regime: DPDP
domain: "[[D07 Children & Persons with Disability]]"
act_ref: s.9(1)
rule_ref: R11
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
  - pwd
controls:
- "[[CTL-PWD-01]]"
evidence_expected:
- Copy of appointment order
- Verification checklist
tags:
- dpdp/obligation
- dpdp/D07
---

# OBL-PWD-02 - Verify guardian appointment

> **Requirement:** Verify guardian appointed by court, designated authority (RPwD Act s.15) or local level committee (National Trust Act s.13).

| Attribute | Value |
|---|---|
| Source (Act/law) | s.9(1) |
| Rule / instrument | R11 |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D07 Children & Persons with Disability]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.9 children - up to Rs 200 crore |
| Applies when | flags set: pwd |

## Evidence expected
- Copy of appointment order
- Verification checklist

## Satisfied by controls
- [[CTL-PWD-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-PWD-02]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-PWD-02]])
```
