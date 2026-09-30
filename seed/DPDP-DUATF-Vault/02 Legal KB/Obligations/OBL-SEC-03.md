---
type: obligation
obl_id: OBL-SEC-03
title: Access control to computer resources
regime: DPDP
domain: "[[D09 Security Safeguards]]"
act_ref: s.8(5)
rule_ref: R6(1)(b)
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
- "[[CTL-SEC-04]]"
- "[[CTL-SEC-05]]"
- "[[CTL-SEC-14]]"
evidence_expected:
- IAM policy
- Access reviews
- PAM logs
tags:
- dpdp/obligation
- dpdp/D09
---

# OBL-SEC-03 - Access control to computer resources

> **Requirement:** Appropriate measures to control access to computer resources used by DF or processor.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(5) |
| Rule / instrument | R6(1)(b) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D09 Security Safeguards]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.8(5) security safeguards - up to Rs 250 crore |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- IAM policy
- Access reviews
- PAM logs

## Satisfied by controls
- [[CTL-SEC-04]]
- [[CTL-SEC-05]]
- [[CTL-SEC-14]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-SEC-03]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-SEC-03]])
```
