---
type: obligation
obl_id: OBL-RGT-07
title: Requester identification
regime: DPDP
domain: "[[D12 Rights & Grievance]]"
act_ref: s.11-14
rule_ref: R14(2),(5)
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 11
trigger:
  always: true
controls:
- "[[CTL-RGT-03]]"
evidence_expected:
- Identity verification SOP
tags:
- dpdp/obligation
- dpdp/D12
---

# OBL-RGT-07 - Requester identification

> **Requirement:** Verify requester via identifier issued by DF before acting on rights requests.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.11-14 |
| Rule / instrument | R14(2),(5) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D12 Rights & Grievance]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Identity verification SOP

## Satisfied by controls
- [[CTL-RGT-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-RGT-07]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-RGT-07]])
```
