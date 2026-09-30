---
type: obligation
obl_id: OBL-LB-03
title: s.7(a) voluntary provision conditions
regime: DPDP
domain: "[[D04 Lawful Basis & Purpose]]"
act_ref: s.7(a)
rule_ref: ''
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 7
trigger:
  basis:
  - s7a
controls:
- "[[CTL-LB-01]]"
evidence_expected:
- Legitimate-use assessment memo
- Objection handling record
tags:
- dpdp/obligation
- dpdp/D04
---

# OBL-LB-03 - s.7(a) voluntary provision conditions

> **Requirement:** Rely on s.7(a) only where DP voluntarily provided data for the specified purpose and has not indicated non-consent to its use.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.7(a) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D04 Lawful Basis & Purpose]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | lawful basis is s7a |

## Evidence expected
- Legitimate-use assessment memo
- Objection handling record

## Satisfied by controls
- [[CTL-LB-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-LB-03]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-LB-03]])
```
