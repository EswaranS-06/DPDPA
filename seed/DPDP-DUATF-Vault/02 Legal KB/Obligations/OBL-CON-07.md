---
type: obligation
obl_id: OBL-CON-07
title: Accept Consent Manager instructions
regime: DPDP
domain: "[[D06 Consent Lifecycle]]"
act_ref: s.6(7),(8)
rule_ref: R4
schedule_ref: SCH1
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
  flags:
  - consent_manager_used
controls:
- "[[CTL-CON-05]]"
evidence_expected:
- CM integration spec
- CM event logs
tags:
- dpdp/obligation
- dpdp/D06
---

# OBL-CON-07 - Accept Consent Manager instructions

> **Requirement:** Where DP uses a registered Consent Manager, accept consent/withdrawal via the CM and integrate.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.6(7),(8) |
| Rule / instrument | R4 |
| Schedule | SCH1 |
| Actor | data_fiduciary |
| Domain | [[D06 Consent Lifecycle]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | lawful basis is consent; flags set: consent_manager_used |

## Evidence expected
- CM integration spec
- CM event logs

## Satisfied by controls
- [[CTL-CON-05]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-CON-07]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-CON-07]])
```
