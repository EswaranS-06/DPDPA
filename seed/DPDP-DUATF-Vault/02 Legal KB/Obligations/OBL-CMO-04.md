---
type: obligation
obl_id: OBL-CMO-04
title: No sub-contracting; security; fiduciary capacity
regime: DPDP
domain: "[[D18 Consent Manager Operations]]"
act_ref: s.6(8)
rule_ref: R4(2)
schedule_ref: SCH1-B6,B7,B8
actor: consent_manager
phase: 2
in_force: '2026-11-13'
status: not yet in force - 2026-11-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 6
trigger:
  role:
  - consent_manager
controls:
- "[[CTL-CMO-02]]"
evidence_expected:
- Contracts
- ISMS
tags:
- dpdp/obligation
- dpdp/D18
---

# OBL-CMO-04 - No sub-contracting; security; fiduciary capacity

> **Requirement:** No sub-contracting/assignment; reasonable security safeguards; act in fiduciary capacity for DP.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.6(8) |
| Rule / instrument | R4(2) |
| Schedule | SCH1-B6,B7,B8 |
| Actor | consent_manager |
| Domain | [[D18 Consent Manager Operations]] |
| Commencement | not yet in force - 2026-11-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | entity role is consent_manager |

## Evidence expected
- Contracts
- ISMS

## Satisfied by controls
- [[CTL-CMO-02]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-CMO-04]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-CMO-04]])
```
