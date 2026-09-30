---
type: obligation
obl_id: OBL-SEC-07
title: Security clauses in processor contracts
regime: DPDP
domain: "[[D09 Security Safeguards]]"
act_ref: s.8(5)
rule_ref: R6(1)(f)
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P1
penalty_text: s.8(5) security safeguards - up to Rs 250 crore
sec: 8.5
trigger:
  flags:
  - processor
controls:
- "[[CTL-TPM-03]]"
evidence_expected:
- DPA / contract clauses
tags:
- dpdp/obligation
- dpdp/D09
---

# OBL-SEC-07 - Security clauses in processor contracts

> **Requirement:** Appropriate provision in DF-processor contract for reasonable security safeguards.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(5) |
| Rule / instrument | R6(1)(f) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D09 Security Safeguards]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.8(5) security safeguards - up to Rs 250 crore |
| Applies when | flags set: processor |

## Evidence expected
- DPA / contract clauses

## Satisfied by controls
- [[CTL-TPM-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-SEC-07]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-SEC-07]])
```
