---
type: obligation
obl_id: OBL-XB-03
title: Sectoral localisation prevails
regime: DPDP
domain: "[[D14 Cross-Border Transfer & Localisation]]"
act_ref: s.16(2)
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
- "[[CTL-XB-01]]"
- "[[CTL-XB-02]]"
evidence_expected:
- Sector localisation assessment
tags:
- dpdp/obligation
- dpdp/D14
---

# OBL-XB-03 - Sectoral localisation prevails

> **Requirement:** Comply with sector laws imposing higher protection or localisation (e.g. RBI payment data, IRDAI, SEBI, Govt/MeitY cloud, telecom).

| Attribute | Value |
|---|---|
| Source (Act/law) | s.16(2) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D14 Cross-Border Transfer & Localisation]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | flags set: cross_border |

## Evidence expected
- Sector localisation assessment

## Satisfied by controls
- [[CTL-XB-01]]
- [[CTL-XB-02]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-XB-03]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-XB-03]])
```
