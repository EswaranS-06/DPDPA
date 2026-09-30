---
type: obligation
obl_id: OBL-SDF-07
title: Localisation of specified data
regime: DPDP
domain: "[[D15 Significant Data Fiduciary]]"
act_ref: s.10(2)(c)(iii)
rule_ref: R13(4)
schedule_ref: ''
actor: sdf
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P4
penalty_text: s.10 SDF - up to Rs 150 crore
sec: 10
trigger:
  role:
  - sdf
controls:
- "[[CTL-XB-02]]"
evidence_expected:
- Data residency architecture
- Transfer register
tags:
- dpdp/obligation
- dpdp/D15
---

# OBL-SDF-07 - Localisation of specified data

> **Requirement:** Ensure personal data specified by Central Govt (on committee recommendation) and its traffic data is processed within India / not transferred out.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.10(2)(c)(iii) |
| Rule / instrument | R13(4) |
| Schedule | - |
| Actor | sdf |
| Domain | [[D15 Significant Data Fiduciary]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.10 SDF - up to Rs 150 crore |
| Applies when | entity role is sdf |

## Evidence expected
- Data residency architecture
- Transfer register

## Satisfied by controls
- [[CTL-XB-02]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-SDF-07]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-SDF-07]])
```
