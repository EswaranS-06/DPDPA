---
type: obligation
obl_id: OBL-SEC-02
title: Encryption / masking / tokenisation
regime: DPDP
domain: "[[D09 Security Safeguards]]"
act_ref: s.8(5)
rule_ref: R6(1)(a)
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
- "[[CTL-SEC-02]]"
- "[[CTL-SEC-03]]"
- "[[CTL-SEC-12]]"
- "[[CTL-SEC-14]]"
evidence_expected:
- Encryption standard
- Key mgmt
- DB/storage config evidence
tags:
- dpdp/obligation
- dpdp/D09
---

# OBL-SEC-02 - Encryption / masking / tokenisation

> **Requirement:** Secure personal data through encryption, obfuscation, masking or virtual tokens mapped to it.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(5) |
| Rule / instrument | R6(1)(a) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D09 Security Safeguards]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.8(5) security safeguards - up to Rs 250 crore |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Encryption standard
- Key mgmt
- DB/storage config evidence

## Satisfied by controls
- [[CTL-SEC-02]]
- [[CTL-SEC-03]]
- [[CTL-SEC-12]]
- [[CTL-SEC-14]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-SEC-02]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-SEC-02]])
```
