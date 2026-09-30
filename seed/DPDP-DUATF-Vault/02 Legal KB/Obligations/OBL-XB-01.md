---
type: obligation
obl_id: OBL-XB-01
title: No transfer to restricted countries
regime: DPDP
domain: "[[D14 Cross-Border Transfer & Localisation]]"
act_ref: s.16(1)
rule_ref: ''
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
- Transfer register
- Restricted list check
tags:
- dpdp/obligation
- dpdp/D14
---

# OBL-XB-01 - No transfer to restricted countries

> **Requirement:** Do not transfer personal data to any country/territory restricted by Central Govt notification (negative list).

| Attribute | Value |
|---|---|
| Source (Act/law) | s.16(1) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D14 Cross-Border Transfer & Localisation]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | flags set: cross_border |

## Evidence expected
- Transfer register
- Restricted list check

## Satisfied by controls
- [[CTL-SCP-04]]
- [[CTL-XB-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-XB-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-XB-01]])
```
