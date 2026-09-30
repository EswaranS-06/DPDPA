---
type: obligation
obl_id: OBL-SCP-04
title: Monitor SDF notification
regime: DPDP
domain: "[[D02 Scoping, Applicability & Roles]]"
act_ref: s.10(1)
rule_ref: ''
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: ''
penalty_text: ''
sec: 10
trigger:
  always: true
controls:
- "[[CTL-SCP-01]]"
- "[[CTL-SCP-04]]"
evidence_expected:
- Regulatory change log entry
tags:
- dpdp/obligation
- dpdp/D02
---

# OBL-SCP-04 - Monitor SDF notification

> **Requirement:** Monitor Central Govt notifications under s.10(1) for designation as SDF (entity or class) and trigger SDF programme on notification.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.10(1) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D02 Scoping, Applicability & Roles]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | - |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Regulatory change log entry

## Satisfied by controls
- [[CTL-SCP-01]]
- [[CTL-SCP-04]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-SCP-04]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-SCP-04]])
```
