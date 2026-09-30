---
type: obligation
obl_id: OBL-SDF-01
title: Appoint DPO based in India
regime: DPDP
domain: "[[D15 Significant Data Fiduciary]]"
act_ref: s.10(2)(a)
rule_ref: ''
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
- "[[CTL-SDF-01]]"
evidence_expected:
- Board resolution
- DPO appointment letter
tags:
- dpdp/obligation
- dpdp/D15
---

# OBL-SDF-01 - Appoint DPO based in India

> **Requirement:** Appoint DPO representing SDF, based in India, responsible to Board of Directors/governing body, point of contact for grievance redressal.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.10(2)(a) |
| Rule / instrument | - |
| Schedule | - |
| Actor | sdf |
| Domain | [[D15 Significant Data Fiduciary]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.10 SDF - up to Rs 150 crore |
| Applies when | entity role is sdf |

## Evidence expected
- Board resolution
- DPO appointment letter

## Satisfied by controls
- [[CTL-SDF-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-SDF-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-SDF-01]])
```
