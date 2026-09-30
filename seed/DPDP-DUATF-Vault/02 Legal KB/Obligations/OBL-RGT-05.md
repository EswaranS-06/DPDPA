---
type: obligation
obl_id: OBL-RGT-05
title: Grievance redressal within 90 days
regime: DPDP
domain: "[[D12 Rights & Grievance]]"
act_ref: s.8(10), s.13
rule_ref: R14(3)
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 13
trigger:
  always: true
controls:
- "[[CTL-RGT-01]]"
- "[[CTL-RGT-02]]"
evidence_expected:
- Grievance log with ageing
- Published SLA
tags:
- dpdp/obligation
- dpdp/D12
---

# OBL-RGT-05 - Grievance redressal within 90 days

> **Requirement:** Readily available grievance redressal; respond within a period not exceeding 90 days; publish the period; implement TOMs.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(10), s.13 |
| Rule / instrument | R14(3) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D12 Rights & Grievance]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Grievance log with ageing
- Published SLA

## Satisfied by controls
- [[CTL-RGT-01]]
- [[CTL-RGT-02]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-RGT-05]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-RGT-05]])
```
