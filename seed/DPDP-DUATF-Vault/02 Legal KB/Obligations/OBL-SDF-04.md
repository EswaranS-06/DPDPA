---
type: obligation
obl_id: OBL-SDF-04
title: Annual audit
regime: DPDP
domain: "[[D15 Significant Data Fiduciary]]"
act_ref: s.10(2)(c)(ii)
rule_ref: R13(1)
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
- "[[CTL-SDF-02]]"
evidence_expected:
- Audit report
tags:
- dpdp/obligation
- dpdp/D15
---

# OBL-SDF-04 - Annual audit

> **Requirement:** Conduct audit every 12 months to ensure compliance.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.10(2)(c)(ii) |
| Rule / instrument | R13(1) |
| Schedule | - |
| Actor | sdf |
| Domain | [[D15 Significant Data Fiduciary]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.10 SDF - up to Rs 150 crore |
| Applies when | entity role is sdf |

## Evidence expected
- Audit report

## Satisfied by controls
- [[CTL-SDF-02]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-SDF-04]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-SDF-04]])
```
