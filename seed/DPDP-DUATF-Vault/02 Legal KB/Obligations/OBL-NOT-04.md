---
type: obligation
obl_id: OBL-NOT-04
title: Means to withdraw, exercise rights, complain
regime: DPDP
domain: "[[D05 Notice]]"
act_ref: s.5(1)(ii),(iii)
rule_ref: R3(c)
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
- "[[CTL-CON-03]]"
evidence_expected:
- Notice text
- Working link test
tags:
- dpdp/obligation
- dpdp/D05
---

# OBL-NOT-04 - Means to withdraw, exercise rights, complain

> **Requirement:** Notice gives the particular communication link/means to withdraw consent (comparable ease), exercise rights and make a complaint to the Board.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.5(1)(ii),(iii) |
| Rule / instrument | R3(c) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D05 Notice]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | lawful basis is consent |

## Evidence expected
- Notice text
- Working link test

## Satisfied by controls
- [[CTL-NOT-01]]
- [[CTL-CON-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-NOT-04]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-NOT-04]])
```
