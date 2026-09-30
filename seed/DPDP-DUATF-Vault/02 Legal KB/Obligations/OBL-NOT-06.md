---
type: obligation
obl_id: OBL-NOT-06
title: Legacy consent notice
regime: DPDP
domain: "[[D05 Notice]]"
act_ref: s.5(2)
rule_ref: R3
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
  flags:
  - legacy_data
controls:
- "[[CTL-NOT-05]]"
evidence_expected:
- Legacy notice campaign plan & delivery logs
tags:
- dpdp/obligation
- dpdp/D05
---

# OBL-NOT-06 - Legacy consent notice

> **Requirement:** For consent given before commencement, give notice as soon as reasonably practicable; processing may continue until consent withdrawn.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.5(2) |
| Rule / instrument | R3 |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D05 Notice]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | lawful basis is consent; flags set: legacy_data |

## Evidence expected
- Legacy notice campaign plan & delivery logs

## Satisfied by controls
- [[CTL-NOT-05]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-NOT-06]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-NOT-06]])
```
