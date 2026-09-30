---
type: obligation
obl_id: OBL-REG-03
title: Cooperate with Board inquiry & directions
regime: DPDP
domain: "[[D16 Regulatory Interface]]"
act_ref: s.27, s.28
rule_ref: R20
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 27
trigger:
  always: true
controls:
- "[[CTL-REG-01]]"
evidence_expected:
- Regulator correspondence log
tags:
- dpdp/obligation
- dpdp/D16
---

# OBL-REG-03 - Cooperate with Board inquiry & directions

> **Requirement:** Respond to Board inquiries (digital office), comply with directions/urgent measures and interim orders.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.27, s.28 |
| Rule / instrument | R20 |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D16 Regulatory Interface]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Regulator correspondence log

## Satisfied by controls
- [[CTL-REG-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-REG-03]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-REG-03]])
```
