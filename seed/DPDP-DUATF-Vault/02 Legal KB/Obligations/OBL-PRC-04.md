---
type: obligation
obl_id: OBL-PRC-04
title: Processor breach notification to DF
regime: DPDP
domain: "[[D13 Processor & Third-Party Management]]"
act_ref: s.8(6)
rule_ref: R7
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P2
penalty_text: s.8(6) breach intimation - up to Rs 200 crore
sec: 8.6
trigger:
  flags:
  - processor
controls:
- "[[CTL-TPM-03]]"
evidence_expected:
- DPA breach clause with SLA
tags:
- dpdp/obligation
- dpdp/D13
---

# OBL-PRC-04 - Processor breach notification to DF

> **Requirement:** Processor must notify DF of breaches promptly (contractual SLA) so DF can meet R7 clocks.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(6) |
| Rule / instrument | R7 |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D13 Processor & Third-Party Management]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.8(6) breach intimation - up to Rs 200 crore |
| Applies when | flags set: processor |

## Evidence expected
- DPA breach clause with SLA

## Satisfied by controls
- [[CTL-TPM-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-PRC-04]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-PRC-04]])
```
