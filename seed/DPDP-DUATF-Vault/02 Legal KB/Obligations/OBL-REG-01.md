---
type: obligation
obl_id: OBL-REG-01
title: Furnish information to Central Govt
regime: DPDP
domain: "[[D16 Regulatory Interface]]"
act_ref: s.36
rule_ref: R23(1)
schedule_ref: SCH7
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 36
trigger:
  always: true
controls:
- "[[CTL-REG-01]]"
evidence_expected:
- Govt request register
- Response SOP
tags:
- dpdp/obligation
- dpdp/D16
---

# OBL-REG-01 - Furnish information to Central Govt

> **Requirement:** Furnish information to authorised person for Seventh Schedule purposes within the time specified.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.36 |
| Rule / instrument | R23(1) |
| Schedule | SCH7 |
| Actor | data_fiduciary |
| Domain | [[D16 Regulatory Interface]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Govt request register
- Response SOP

## Satisfied by controls
- [[CTL-REG-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-REG-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-REG-01]])
```
