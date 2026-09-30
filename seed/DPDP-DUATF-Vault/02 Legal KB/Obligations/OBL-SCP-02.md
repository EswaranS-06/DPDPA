---
type: obligation
obl_id: OBL-SCP-02
title: Determine role per processing activity
regime: DPDP
domain: "[[D02 Scoping, Applicability & Roles]]"
act_ref: s.2(i),(k)
rule_ref: ''
schedule_ref: ''
actor: any
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: ''
penalty_text: ''
sec: 2
trigger:
  always: true
controls:
- "[[CTL-SCP-02]]"
- "[[CTL-TPM-01]]"
evidence_expected:
- Role determination record per activity/contract
tags:
- dpdp/obligation
- dpdp/D02
---

# OBL-SCP-02 - Determine role per processing activity

> **Requirement:** Determine for each activity whether the entity acts as Data Fiduciary, Data Processor, joint DF, Consent Manager or State; document rationale (who determines purpose and means).

| Attribute | Value |
|---|---|
| Source (Act/law) | s.2(i),(k) |
| Rule / instrument | - |
| Schedule | - |
| Actor | any |
| Domain | [[D02 Scoping, Applicability & Roles]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | - |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Role determination record per activity/contract

## Satisfied by controls
- [[CTL-SCP-02]]
- [[CTL-TPM-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-SCP-02]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-SCP-02]])
```
