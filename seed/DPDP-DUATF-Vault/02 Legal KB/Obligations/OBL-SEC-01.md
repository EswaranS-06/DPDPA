---
type: obligation
obl_id: OBL-SEC-01
title: Reasonable security safeguards
regime: DPDP
domain: "[[D09 Security Safeguards]]"
act_ref: s.8(5)
rule_ref: R6(1)
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P1
penalty_text: s.8(5) security safeguards - up to Rs 250 crore
sec: 8.5
trigger:
  always: true
controls:
- "[[CTL-MAP-03]]"
- "[[CTL-SEC-01]]"
- "[[CTL-SEC-09]]"
- "[[CTL-SEC-10]]"
- "[[CTL-SEC-11]]"
- "[[CTL-SEC-12]]"
evidence_expected:
- ISMS scope
- Risk assessment
- Security policy
tags:
- dpdp/obligation
- dpdp/D09
---

# OBL-SEC-01 - Reasonable security safeguards

> **Requirement:** Protect personal data in possession/control, including processing by processors, by reasonable security safeguards to prevent personal data breach.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(5) |
| Rule / instrument | R6(1) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D09 Security Safeguards]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.8(5) security safeguards - up to Rs 250 crore |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- ISMS scope
- Risk assessment
- Security policy

## Satisfied by controls
- [[CTL-MAP-03]]
- [[CTL-SEC-01]]
- [[CTL-SEC-09]]
- [[CTL-SEC-10]]
- [[CTL-SEC-11]]
- [[CTL-SEC-12]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-SEC-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-SEC-01]])
```
