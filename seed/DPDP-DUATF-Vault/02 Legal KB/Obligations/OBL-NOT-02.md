---
type: obligation
obl_id: OBL-NOT-02
title: Notice standalone & plain
regime: DPDP
domain: "[[D05 Notice]]"
act_ref: s.5(1)
rule_ref: R3(a),(b)
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 5
trigger:
  basis:
  - consent
controls:
- "[[CTL-NOT-01]]"
evidence_expected:
- Notice readability review
tags:
- dpdp/obligation
- dpdp/D05
---

# OBL-NOT-02 - Notice standalone & plain

> **Requirement:** Notice presented and understandable independently of other information; clear and plain language.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.5(1) |
| Rule / instrument | R3(a),(b) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D05 Notice]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | lawful basis is consent |

## Evidence expected
- Notice readability review

## Satisfied by controls
- [[CTL-NOT-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-NOT-02]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-NOT-02]])
```
