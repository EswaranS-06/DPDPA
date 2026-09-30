---
type: obligation
obl_id: LNK-CERT-04
title: CERT-In Point of Contact
regime: Other Indian law
domain: "[[D16 Regulatory Interface]]"
act_ref: IT Act s.70B(6)
rule_ref: CERT-In Directions (iii)
schedule_ref: ''
actor: any
phase: 0
in_force: '2022-06-28'
status: in force (other law)
penalty_tier: ''
penalty_text: ''
sec: 0
trigger:
  always: true
controls:
- "[[CTL-REG-03]]"
evidence_expected:
- PoC designation filed
tags:
- dpdp/obligation
- dpdp/D16
---

# LNK-CERT-04 - CERT-In Point of Contact

> **Requirement:** Designate a Point of Contact to interface with CERT-In.

| Attribute | Value |
|---|---|
| Source (Act/law) | IT Act s.70B(6) |
| Rule / instrument | CERT-In Directions (iii) |
| Schedule | - |
| Actor | any |
| Domain | [[D16 Regulatory Interface]] |
| Commencement | in force (other law) |
| Penalty exposure | - |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- PoC designation filed

## Satisfied by controls
- [[CTL-REG-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[LNK-CERT-04]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[LNK-CERT-04]])
```
