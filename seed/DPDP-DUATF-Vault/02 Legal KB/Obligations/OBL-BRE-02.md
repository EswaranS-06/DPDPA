---
type: obligation
obl_id: OBL-BRE-02
title: Initial intimation to Board
regime: DPDP
domain: "[[D10 Breach Management]]"
act_ref: s.8(6)
rule_ref: R7(2)(a)
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
- Board intimation template
- Submission acknowledgement
tags:
- dpdp/obligation
- dpdp/D10
---

# OBL-BRE-02 - Initial intimation to Board

> **Requirement:** Without delay: description incl. nature, extent, timing, location and likely impact.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(6) |
| Rule / instrument | R7(2)(a) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D10 Breach Management]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.8(6) breach intimation - up to Rs 200 crore |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Board intimation template
- Submission acknowledgement

## Satisfied by controls
- [[CTL-BRE-01]]
- [[CTL-BRE-02]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-BRE-02]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-BRE-02]])
```
