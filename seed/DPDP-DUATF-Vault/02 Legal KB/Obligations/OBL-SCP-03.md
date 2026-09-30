---
type: obligation
obl_id: OBL-SCP-03
title: Document and justify exemptions
regime: DPDP
domain: "[[D02 Scoping, Applicability & Roles]]"
act_ref: s.17
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
  - ex17_1a
  - ex17_1b
  - ex17_1c
  - ex17_1d
  - ex17_1e
  - ex17_1f
  - ex17_2a
  - ex17_2b
  - ex17_3
controls:
- "[[CTL-SCP-03]]"
evidence_expected:
- Exemption register entry with legal opinion
tags:
- dpdp/obligation
- dpdp/D02
---

# OBL-SCP-03 - Document and justify exemptions

> **Requirement:** Where s.17 exemption is relied on, document the specific clause, scope, conditions and residual obligations (s.8(1), 8(5) always remain under s.17(1)).

| Attribute | Value |
|---|---|
| Source (Act/law) | s.17 |
| Rule / instrument | R16 |
| Schedule | SCH2 |
| Actor | data_fiduciary |
| Domain | [[D02 Scoping, Applicability & Roles]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | - |
| Applies when | lawful basis is ex17_1a or ex17_1b or ex17_1c or ex17_1d or ex17_1e or ex17_1f or ex17_2a or ex17_2b or ex17_3 |

## Evidence expected
- Exemption register entry with legal opinion

## Satisfied by controls
- [[CTL-SCP-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-SCP-03]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-SCP-03]])
```
