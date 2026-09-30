---
type: obligation
obl_id: LNK-CERT-02
title: ICT logs 180 days within India
regime: Other Indian law
domain: "[[D09 Security Safeguards]]"
act_ref: IT Act s.70B(6)
rule_ref: CERT-In Directions (iv)
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
- "[[CTL-SEC-07]]"
- "[[CTL-XB-02]]"
evidence_expected:
- Log retention config
- Log storage location
tags:
- dpdp/obligation
- dpdp/D09
---

# LNK-CERT-02 - ICT logs 180 days within India

> **Requirement:** Maintain logs of all ICT systems securely for rolling 180 days within Indian jurisdiction.

| Attribute | Value |
|---|---|
| Source (Act/law) | IT Act s.70B(6) |
| Rule / instrument | CERT-In Directions (iv) |
| Schedule | - |
| Actor | any |
| Domain | [[D09 Security Safeguards]] |
| Commencement | in force (other law) |
| Penalty exposure | - |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Log retention config
- Log storage location

## Satisfied by controls
- [[CTL-SEC-07]]
- [[CTL-XB-02]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[LNK-CERT-02]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[LNK-CERT-02]])
```
