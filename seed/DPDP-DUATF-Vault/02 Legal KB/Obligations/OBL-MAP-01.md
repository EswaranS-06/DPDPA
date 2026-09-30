---
type: obligation
obl_id: OBL-MAP-01
title: Maintain processing activity register
regime: DPDP
domain: "[[D03 Data Inventory & Mapping]]"
act_ref: s.6(10), s.8(1),(4)
rule_ref: ''
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: ''
penalty_text: ''
sec: 8.4
trigger:
  always: true
controls:
- "[[CTL-MAP-01]]"
- "[[CTL-MAP-02]]"
- "[[CTL-MAP-03]]"
- "[[CTL-MAP-04]]"
evidence_expected:
- RoPA / activity register
- Data flow diagrams
tags:
- dpdp/obligation
- dpdp/D03
---

# OBL-MAP-01 - Maintain processing activity register

> **Requirement:** Maintain a register of processing activities (purpose, basis, principals, data, systems, recipients, transfers, retention) sufficient to discharge burden of proof and accountability.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.6(10), s.8(1),(4) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D03 Data Inventory & Mapping]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | - |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- RoPA / activity register
- Data flow diagrams

## Satisfied by controls
- [[CTL-MAP-01]]
- [[CTL-MAP-02]]
- [[CTL-MAP-03]]
- [[CTL-MAP-04]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-MAP-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-MAP-01]])
```
