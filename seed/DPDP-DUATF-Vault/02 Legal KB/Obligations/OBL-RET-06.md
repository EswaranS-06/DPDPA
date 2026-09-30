---
type: obligation
obl_id: OBL-RET-06
title: Reconciled retention schedule
regime: DPDP
domain: "[[D11 Retention & Erasure]]"
act_ref: s.8(7)
rule_ref: R8
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: ''
penalty_text: ''
sec: 8.7
trigger:
  always: true
controls:
- "[[CTL-RET-01]]"
evidence_expected:
- Retention schedule with legal citations
tags:
- dpdp/obligation
- dpdp/D11
---

# OBL-RET-06 - Reconciled retention schedule

> **Requirement:** Maintain a retention schedule reconciling DPDP erasure with sector/tax/labour retention laws, per data category and purpose.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(7) |
| Rule / instrument | R8 |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D11 Retention & Erasure]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | - |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Retention schedule with legal citations

## Satisfied by controls
- [[CTL-RET-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-RET-06]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-RET-06]])
```
