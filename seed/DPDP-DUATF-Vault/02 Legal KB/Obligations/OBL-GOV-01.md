---
type: obligation
obl_id: OBL-GOV-01
title: Accountability irrespective of processors
regime: DPDP
domain: "[[D01 Governance & Accountability]]"
act_ref: s.8(1)
rule_ref: ''
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 8.1
trigger:
  always: true
controls:
- "[[CTL-GOV-01]]"
- "[[CTL-GOV-06]]"
evidence_expected:
- Board-approved privacy policy
- Accountability/RACI matrix
- Management review minutes
tags:
- dpdp/obligation
- dpdp/D01
---

# OBL-GOV-01 - Accountability irrespective of processors

> **Requirement:** Data Fiduciary remains responsible for compliance for all processing by it or on its behalf, irrespective of any agreement to the contrary or DP failure to perform duties.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(1) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D01 Governance & Accountability]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Board-approved privacy policy
- Accountability/RACI matrix
- Management review minutes

## Satisfied by controls
- [[CTL-GOV-01]]
- [[CTL-GOV-06]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-GOV-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-GOV-01]])
```
