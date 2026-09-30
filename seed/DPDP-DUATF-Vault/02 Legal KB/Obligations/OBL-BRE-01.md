---
type: obligation
obl_id: OBL-BRE-01
title: Intimate affected Data Principals
regime: DPDP
domain: "[[D10 Breach Management]]"
act_ref: s.8(6)
rule_ref: R7(1)
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P2
penalty_text: s.8(6) breach intimation - up to Rs 200 crore
sec: 8.6
trigger:
  always: true
controls:
- "[[CTL-BRE-01]]"
- "[[CTL-BRE-02]]"
- "[[CTL-BRE-03]]"
evidence_expected:
- DP notification template
- Breach register
tags:
- dpdp/obligation
- dpdp/D10
---

# OBL-BRE-01 - Intimate affected Data Principals

> **Requirement:** On becoming aware of a personal data breach, intimate each affected DP without delay via user account/registered communication: description (nature, extent, timing), likely consequences, mitigation, safety measures, contact.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(6) |
| Rule / instrument | R7(1) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D10 Breach Management]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.8(6) breach intimation - up to Rs 200 crore |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- DP notification template
- Breach register

## Satisfied by controls
- [[CTL-BRE-01]]
- [[CTL-BRE-02]]
- [[CTL-BRE-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-BRE-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-BRE-01]])
```
