---
type: obligation
obl_id: LNK-CERT-03
title: Clock synchronisation
regime: Other Indian law
domain: "[[D09 Security Safeguards]]"
act_ref: IT Act s.70B(6)
rule_ref: CERT-In Directions (i)
schedule_ref: ''
actor: any
phase: 0
in_force: '2022-06-28'
status: in force (other law)
penalty_tier: ''
penalty_text: ''
sec: 0
trigger:
  always: true
controls:
- "[[CTL-SEC-13]]"
evidence_expected:
- NTP config
tags:
- dpdp/obligation
- dpdp/D09
---

# LNK-CERT-03 - Clock synchronisation

> **Requirement:** Synchronise ICT system clocks to NTP of NIC/NPL or traceable source.

| Attribute | Value |
|---|---|
| Source (Act/law) | IT Act s.70B(6) |
| Rule / instrument | CERT-In Directions (i) |
| Schedule | - |
| Actor | any |
| Domain | [[D09 Security Safeguards]] |
| Commencement | in force (other law) |
| Penalty exposure | - |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- NTP config

## Satisfied by controls
- [[CTL-SEC-13]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[LNK-CERT-03]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[LNK-CERT-03]])
```
