---
type: obligation
obl_id: OBL-RET-01
title: Erase at purpose end or withdrawal
regime: DPDP
domain: "[[D11 Retention & Erasure]]"
act_ref: s.8(7)(a)
rule_ref: ''
schedule_ref: ''
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
- "[[CTL-RET-01]]"
- "[[CTL-RET-02]]"
- "[[CTL-RET-05]]"
- "[[CTL-RGT-05]]"
evidence_expected:
- Retention schedule
- Deletion job logs
tags:
- dpdp/obligation
- dpdp/D11
---

# OBL-RET-01 - Erase at purpose end or withdrawal

> **Requirement:** Erase personal data when DP withdraws consent or as soon as it is reasonable to assume the specified purpose is no longer served, whichever earlier, unless retention needed for compliance with law.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(7)(a) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D11 Retention & Erasure]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Retention schedule
- Deletion job logs

## Satisfied by controls
- [[CTL-RET-01]]
- [[CTL-RET-02]]
- [[CTL-RET-05]]
- [[CTL-RGT-05]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-RET-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-RET-01]])
```
