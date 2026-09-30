---
type: obligation
obl_id: OBL-LB-06
title: s.7(i) employment use bounded
regime: DPDP
domain: "[[D04 Lawful Basis & Purpose]]"
act_ref: s.7(i)
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
  - s7i
controls:
- "[[CTL-LB-03]]"
evidence_expected:
- Employee purpose register
- HR privacy notice
tags:
- dpdp/obligation
- dpdp/D04
---

# OBL-LB-06 - s.7(i) employment use bounded

> **Requirement:** Employee data processed without consent only for purposes of employment or safeguarding employer from loss/liability (e.g. espionage, trade secrets, benefits); other uses need consent.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.7(i) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D04 Lawful Basis & Purpose]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | lawful basis is s7i |

## Evidence expected
- Employee purpose register
- HR privacy notice

## Satisfied by controls
- [[CTL-LB-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-LB-06]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-LB-06]])
```
