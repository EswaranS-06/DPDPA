---
type: obligation
obl_id: OBL-XB-02
title: Foreign-State access conditions
regime: DPDP
domain: "[[D14 Cross-Border Transfer & Localisation]]"
act_ref: s.16
rule_ref: R15
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 16
trigger:
  flags:
  - cross_border
controls:
- "[[CTL-SCP-04]]"
- "[[CTL-XB-01]]"
evidence_expected:
- Transfer impact note
- Order compliance record
tags:
- dpdp/obligation
- dpdp/D14
---

# OBL-XB-02 - Foreign-State access conditions

> **Requirement:** Meet Central Govt requirements (general/special order) on making personal data available to a foreign State or entity under its control.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.16 |
| Rule / instrument | R15 |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D14 Cross-Border Transfer & Localisation]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | flags set: cross_border |

## Evidence expected
- Transfer impact note
- Order compliance record

## Satisfied by controls
- [[CTL-SCP-04]]
- [[CTL-XB-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-XB-02]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-XB-02]])
```
