---
type: obligation
obl_id: OBL-GOV-05
title: Lawful purpose only
regime: DPDP
domain: "[[D01 Governance & Accountability]]"
act_ref: s.4(1)
rule_ref: ''
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
- "[[CTL-GOV-07]]"
- "[[CTL-LB-01]]"
evidence_expected:
- Purpose register with lawful basis per purpose
tags:
- dpdp/obligation
- dpdp/D01
---

# OBL-GOV-05 - Lawful purpose only

> **Requirement:** Process personal data only for a lawful purpose (not expressly forbidden by law) and only on consent or a s.7 legitimate use.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.4(1) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D01 Governance & Accountability]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Purpose register with lawful basis per purpose

## Satisfied by controls
- [[CTL-GOV-07]]
- [[CTL-LB-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-GOV-05]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-GOV-05]])
```
