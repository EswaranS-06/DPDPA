---
type: obligation
obl_id: OBL-CMO-01
title: Register as Consent Manager
regime: DPDP
domain: "[[D18 Consent Manager Operations]]"
act_ref: s.6(9)
rule_ref: R4(1)
schedule_ref: SCH1-A
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
- "[[CTL-CMO-01]]"
evidence_expected:
- Registration certificate
tags:
- dpdp/obligation
- dpdp/D18
---

# OBL-CMO-01 - Register as Consent Manager

> **Requirement:** Register with Board meeting Part A conditions (Indian company, net worth >= Rs 2 cr, capacity, fit & proper, certified interoperable platform).

| Attribute | Value |
|---|---|
| Source (Act/law) | s.6(9) |
| Rule / instrument | R4(1) |
| Schedule | SCH1-A |
| Actor | consent_manager |
| Domain | [[D18 Consent Manager Operations]] |
| Commencement | not yet in force - 2026-11-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | entity role is consent_manager |

## Evidence expected
- Registration certificate

## Satisfied by controls
- [[CTL-CMO-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-CMO-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-CMO-01]])
```
