---
type: obligation
obl_id: OBL-RES-01
title: Research/statistics exemption conditions
regime: DPDP
domain: "[[D17 State & Research Processing]]"
act_ref: s.17(2)(b)
rule_ref: R16
schedule_ref: SCH2
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: ''
penalty_text: ''
sec: 17
trigger:
  basis:
  - ex17_2b
controls:
- "[[CTL-SCP-03]]"
- "[[CTL-RES-01]]"
evidence_expected:
- Research protocol
- De-identification evidence
tags:
- dpdp/obligation
- dpdp/D17
---

# OBL-RES-01 - Research/statistics exemption conditions

> **Requirement:** Research, archiving or statistical processing exempt only if not used for DP-specific decisions and follows Second Schedule standards.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.17(2)(b) |
| Rule / instrument | R16 |
| Schedule | SCH2 |
| Actor | data_fiduciary |
| Domain | [[D17 State & Research Processing]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | - |
| Applies when | lawful basis is ex17_2b |

## Evidence expected
- Research protocol
- De-identification evidence

## Satisfied by controls
- [[CTL-SCP-03]]
- [[CTL-RES-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-RES-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-RES-01]])
```
