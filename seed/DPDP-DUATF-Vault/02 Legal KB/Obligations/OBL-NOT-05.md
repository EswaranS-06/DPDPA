---
type: obligation
obl_id: OBL-NOT-05
title: Language option
regime: DPDP
domain: "[[D05 Notice]]"
act_ref: s.5(3)
rule_ref: ''
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 5
trigger:
  basis:
  - consent
controls:
- "[[CTL-NOT-03]]"
evidence_expected:
- Language versions
- Language selector screenshot
tags:
- dpdp/obligation
- dpdp/D05
---

# OBL-NOT-05 - Language option

> **Requirement:** DP given option to access notice in English or any Eighth Schedule language.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.5(3) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D05 Notice]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | lawful basis is consent |

## Evidence expected
- Language versions
- Language selector screenshot

## Satisfied by controls
- [[CTL-NOT-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-NOT-05]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-NOT-05]])
```
