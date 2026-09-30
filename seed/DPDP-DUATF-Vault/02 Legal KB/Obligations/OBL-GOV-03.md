---
type: obligation
obl_id: OBL-GOV-03
title: Publish contact of DPO / responsible person
regime: DPDP
domain: "[[D01 Governance & Accountability]]"
act_ref: s.8(9)
rule_ref: R9
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 8.9
trigger:
  always: true
controls:
- "[[CTL-GOV-03]]"
evidence_expected:
- Website/app screenshot of contact
- Designation letter
tags:
- dpdp/obligation
- dpdp/D01
---

# OBL-GOV-03 - Publish contact of DPO / responsible person

> **Requirement:** Prominently publish on website/app the business contact information of the DPO (if SDF) or a person able to answer DP questions on processing.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(9) |
| Rule / instrument | R9 |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D01 Governance & Accountability]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Website/app screenshot of contact
- Designation letter

## Satisfied by controls
- [[CTL-GOV-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-GOV-03]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-GOV-03]])
```
