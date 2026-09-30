---
type: obligation
obl_id: OBL-LB-01
title: Specified purpose defined per activity
regime: DPDP
domain: "[[D04 Lawful Basis & Purpose]]"
act_ref: s.2(za), s.4, s.6(1)
rule_ref: R3(b)
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 4
trigger:
  always: true
controls:
- "[[CTL-GOV-05]]"
- "[[CTL-GOV-07]]"
- "[[CTL-LB-01]]"
- "[[CTL-LB-04]]"
- "[[CTL-TPM-05]]"
evidence_expected:
- Purpose register
tags:
- dpdp/obligation
- dpdp/D04
---

# OBL-LB-01 - Specified purpose defined per activity

> **Requirement:** Define and record the specified purpose for each processing activity; processing beyond it needs a new basis.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.2(za), s.4, s.6(1) |
| Rule / instrument | R3(b) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D04 Lawful Basis & Purpose]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Purpose register

## Satisfied by controls
- [[CTL-GOV-05]]
- [[CTL-GOV-07]]
- [[CTL-LB-01]]
- [[CTL-LB-04]]
- [[CTL-TPM-05]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-LB-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-LB-01]])
```
