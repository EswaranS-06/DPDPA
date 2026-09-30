---
type: obligation
obl_id: LNK-CERT-01
title: CERT-In incident report within 6 hours
regime: Other Indian law
domain: "[[D10 Breach Management]]"
act_ref: IT Act s.70B(6)
rule_ref: CERT-In Directions 28.04.2022 (ii)
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
- "[[CTL-BRE-01]]"
- "[[CTL-REG-03]]"
evidence_expected:
- CERT-In reporting SOP
- Submission records
tags:
- dpdp/obligation
- dpdp/D10
---

# LNK-CERT-01 - CERT-In incident report within 6 hours

> **Requirement:** Report cyber incidents in Annexure I (incl. data breach/leak) to CERT-In within 6 hours of noticing.

| Attribute | Value |
|---|---|
| Source (Act/law) | IT Act s.70B(6) |
| Rule / instrument | CERT-In Directions 28.04.2022 (ii) |
| Schedule | - |
| Actor | any |
| Domain | [[D10 Breach Management]] |
| Commencement | in force (other law) |
| Penalty exposure | - |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- CERT-In reporting SOP
- Submission records

## Satisfied by controls
- [[CTL-BRE-01]]
- [[CTL-REG-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[LNK-CERT-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[LNK-CERT-01]])
```
