---
type: obligation
obl_id: OBL-RGT-01
title: Publish means & identifiers for rights
regime: DPDP
domain: "[[D12 Rights & Grievance]]"
act_ref: s.11-14
rule_ref: R14(1),(5)
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 11
trigger:
  flags:
  - online_presence
controls:
- "[[CTL-RGT-01]]"
evidence_expected:
- Rights page screenshot
tags:
- dpdp/obligation
- dpdp/D12
---

# OBL-RGT-01 - Publish means & identifiers for rights

> **Requirement:** Prominently publish on website/app the means to make rights requests and identifiers required (e.g. customer no., mobile, email).

| Attribute | Value |
|---|---|
| Source (Act/law) | s.11-14 |
| Rule / instrument | R14(1),(5) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D12 Rights & Grievance]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | flags set: online_presence |

## Evidence expected
- Rights page screenshot

## Satisfied by controls
- [[CTL-RGT-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-RGT-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-RGT-01]])
```
