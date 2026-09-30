---
type: obligation
obl_id: OBL-SCP-01
title: Determine applicability of the Act
regime: DPDP
domain: "[[D02 Scoping, Applicability & Roles]]"
act_ref: s.3
rule_ref: ''
schedule_ref: ''
actor: any
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: ''
penalty_text: ''
sec: 3
trigger:
  always: true
controls:
- "[[CTL-SCP-01]]"
evidence_expected:
- Applicability assessment memo
tags:
- dpdp/obligation
- dpdp/D02
---

# OBL-SCP-01 - Determine applicability of the Act

> **Requirement:** Determine whether processing is of digital personal data in India or outside India in connection with offering goods/services to DPs in India; record exclusions (personal/domestic; publicly made available by DP or under law).

| Attribute | Value |
|---|---|
| Source (Act/law) | s.3 |
| Rule / instrument | - |
| Schedule | - |
| Actor | any |
| Domain | [[D02 Scoping, Applicability & Roles]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | - |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Applicability assessment memo

## Satisfied by controls
- [[CTL-SCP-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-SCP-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-SCP-01]])
```
