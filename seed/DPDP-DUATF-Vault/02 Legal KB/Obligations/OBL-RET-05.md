---
type: obligation
obl_id: OBL-RET-05
title: 1-year floor for data, traffic data & logs
regime: DPDP
domain: "[[D11 Retention & Erasure]]"
act_ref: s.8(7)
rule_ref: R8(3)
schedule_ref: SCH7
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 8.7
trigger:
  always: true
controls:
- "[[CTL-SEC-07]]"
- "[[CTL-RET-01]]"
evidence_expected:
- Retention config
- Archive design
tags:
- dpdp/obligation
- dpdp/D11
---

# OBL-RET-05 - 1-year floor for data, traffic data & logs

> **Requirement:** Retain personal data, associated traffic data and processing logs for minimum 1 year from processing for Seventh Schedule purposes, then erase unless other law requires.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(7) |
| Rule / instrument | R8(3) |
| Schedule | SCH7 |
| Actor | data_fiduciary |
| Domain | [[D11 Retention & Erasure]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Retention config
- Archive design

## Satisfied by controls
- [[CTL-SEC-07]]
- [[CTL-RET-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-RET-05]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-RET-05]])
```
