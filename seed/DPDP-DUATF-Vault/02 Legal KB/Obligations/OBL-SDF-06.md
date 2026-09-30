---
type: obligation
obl_id: OBL-SDF-06
title: Algorithmic due diligence
regime: DPDP
domain: "[[D15 Significant Data Fiduciary]]"
act_ref: s.10(2)(c)(iii)
rule_ref: R13(3)
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
- "[[CTL-SDF-03]]"
evidence_expected:
- Algorithm inventory
- Model risk assessments
tags:
- dpdp/obligation
- dpdp/D15
---

# OBL-SDF-06 - Algorithmic due diligence

> **Requirement:** Verify technical measures incl. algorithmic software for hosting, display, upload, modification, publishing, transmission, storage, updating or sharing are not likely to risk DP rights.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.10(2)(c)(iii) |
| Rule / instrument | R13(3) |
| Schedule | - |
| Actor | sdf |
| Domain | [[D15 Significant Data Fiduciary]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.10 SDF - up to Rs 150 crore |
| Applies when | entity role is sdf |

## Evidence expected
- Algorithm inventory
- Model risk assessments

## Satisfied by controls
- [[CTL-SDF-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-SDF-06]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-SDF-06]])
```
