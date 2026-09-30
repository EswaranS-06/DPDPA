---
type: obligation
obl_id: OBL-MAP-02
title: Identify digitised non-digital data
regime: DPDP
domain: "[[D03 Data Inventory & Mapping]]"
act_ref: s.3(a)
rule_ref: ''
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: ''
penalty_text: ''
sec: 3
trigger:
  always: true
controls:
- "[[CTL-MAP-02]]"
evidence_expected:
- Data event map showing digitisation step
tags:
- dpdp/obligation
- dpdp/D03
---

# OBL-MAP-02 - Identify digitised non-digital data

> **Requirement:** Identify data collected in non-digital form and subsequently digitised (brought in scope by s.3(a)(ii)) and the point of digitisation.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.3(a) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D03 Data Inventory & Mapping]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | - |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Data event map showing digitisation step

## Satisfied by controls
- [[CTL-MAP-02]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-MAP-02]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-MAP-02]])
```
