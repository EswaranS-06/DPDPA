---
type: obligation
obl_id: OBL-RGT-06
title: Right to nominate
regime: DPDP
domain: "[[D12 Rights & Grievance]]"
act_ref: s.14
rule_ref: R14(4)
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 14
trigger:
  basis:
  - consent
  - s7a
controls:
- "[[CTL-RGT-02]]"
- "[[CTL-RGT-03]]"
evidence_expected:
- Nomination form/flow
- Nominee verification SOP
tags:
- dpdp/obligation
- dpdp/D12
---

# OBL-RGT-06 - Right to nominate

> **Requirement:** Enable DP to nominate individual(s) to exercise rights on death/incapacity, per terms of service and law.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.14 |
| Rule / instrument | R14(4) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D12 Rights & Grievance]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | lawful basis is consent or s7a |

## Evidence expected
- Nomination form/flow
- Nominee verification SOP

## Satisfied by controls
- [[CTL-RGT-02]]
- [[CTL-RGT-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-RGT-06]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-RGT-06]])
```
