---
type: obligation
obl_id: OBL-SEC-04
title: Logging, monitoring & review
regime: DPDP
domain: "[[D09 Security Safeguards]]"
act_ref: s.8(5)
rule_ref: R6(1)(c)
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
- "[[CTL-SEC-05]]"
- "[[CTL-SEC-06]]"
- "[[CTL-SEC-10]]"
- "[[CTL-SEC-13]]"
evidence_expected:
- Log source inventory
- SIEM use cases
- Review evidence
tags:
- dpdp/obligation
- dpdp/D09
---

# OBL-SEC-04 - Logging, monitoring & review

> **Requirement:** Visibility on access through logs, monitoring and review to detect unauthorised access, investigate and remediate.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(5) |
| Rule / instrument | R6(1)(c) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D09 Security Safeguards]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.8(5) security safeguards - up to Rs 250 crore |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Log source inventory
- SIEM use cases
- Review evidence

## Satisfied by controls
- [[CTL-SEC-05]]
- [[CTL-SEC-06]]
- [[CTL-SEC-10]]
- [[CTL-SEC-13]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-SEC-04]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-SEC-04]])
```
