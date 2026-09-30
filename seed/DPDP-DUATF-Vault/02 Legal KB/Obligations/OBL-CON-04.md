---
type: obligation
obl_id: OBL-CON-04
title: Withdrawal with comparable ease
regime: DPDP
domain: "[[D06 Consent Lifecycle]]"
act_ref: s.6(4)
rule_ref: R3(c)(i)
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 6
trigger:
  basis:
  - consent
controls:
- "[[CTL-CON-02]]"
- "[[CTL-CON-03]]"
evidence_expected:
- Withdrawal journey test (clicks/steps vs giving)
tags:
- dpdp/obligation
- dpdp/D06
---

# OBL-CON-04 - Withdrawal with comparable ease

> **Requirement:** DP can withdraw consent at any time with ease comparable to giving it.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.6(4) |
| Rule / instrument | R3(c)(i) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D06 Consent Lifecycle]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | lawful basis is consent |

## Evidence expected
- Withdrawal journey test (clicks/steps vs giving)

## Satisfied by controls
- [[CTL-CON-02]]
- [[CTL-CON-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-CON-04]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-CON-04]])
```
