---
type: obligation
obl_id: OBL-LB-04
title: s.7(c)-(e) legal source identified
regime: DPDP
domain: "[[D04 Lawful Basis & Purpose]]"
act_ref: s.7(c),(d),(e)
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
  - s7c
  - s7d
  - s7e
controls:
- "[[CTL-LB-01]]"
- "[[CTL-REG-01]]"
evidence_expected:
- Legal mapping of statute/order to activity
tags:
- dpdp/obligation
- dpdp/D04
---

# OBL-LB-04 - s.7(c)-(e) legal source identified

> **Requirement:** For State function, legal disclosure or court order bases, identify the specific law/order and limit processing to it.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.7(c),(d),(e) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D04 Lawful Basis & Purpose]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | lawful basis is s7c or s7d or s7e |

## Evidence expected
- Legal mapping of statute/order to activity

## Satisfied by controls
- [[CTL-LB-01]]
- [[CTL-REG-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-LB-04]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-LB-04]])
```
