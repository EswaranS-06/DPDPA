---
type: obligation
obl_id: OBL-RET-04
title: 48-hour pre-erasure intimation
regime: DPDP
domain: "[[D11 Retention & Erasure]]"
act_ref: s.8(8)
rule_ref: R8(2)
schedule_ref: SCH3
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 8.8
trigger:
  flags:
  - third_schedule
controls:
- "[[CTL-RET-03]]"
evidence_expected:
- Notification template
- Send logs
tags:
- dpdp/obligation
- dpdp/D11
---

# OBL-RET-04 - 48-hour pre-erasure intimation

> **Requirement:** At least 48 hours before Third Schedule erasure, inform DP that data will be erased unless they log in/contact.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(8) |
| Rule / instrument | R8(2) |
| Schedule | SCH3 |
| Actor | data_fiduciary |
| Domain | [[D11 Retention & Erasure]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | flags set: third_schedule |

## Evidence expected
- Notification template
- Send logs

## Satisfied by controls
- [[CTL-RET-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-RET-04]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-RET-04]])
```
