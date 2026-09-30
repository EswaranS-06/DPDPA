---
type: obligation
obl_id: OBL-BRE-03
title: Detailed report to Board within 72 hours
regime: DPDP
domain: "[[D10 Breach Management]]"
act_ref: s.8(6)
rule_ref: R7(2)(b)
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
evidence_expected:
- 72h report
- RCA
tags:
- dpdp/obligation
- dpdp/D10
---

# OBL-BRE-03 - Detailed report to Board within 72 hours

> **Requirement:** Within 72 hours of awareness (or longer as Board allows on written request): updated details, circumstances, mitigation, cause findings, remedial measures, report on DP intimations.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(6) |
| Rule / instrument | R7(2)(b) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D10 Breach Management]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.8(6) breach intimation - up to Rs 200 crore |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- 72h report
- RCA

## Satisfied by controls
- [[CTL-BRE-01]]
- [[CTL-BRE-02]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-BRE-03]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-BRE-03]])
```
