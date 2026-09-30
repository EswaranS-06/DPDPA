---
type: obligation
obl_id: OBL-REG-02
title: Confidentiality of Govt requests
regime: DPDP
domain: "[[D16 Regulatory Interface]]"
act_ref: s.36
rule_ref: R23(2)
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 36
trigger:
  always: true
controls:
- "[[CTL-REG-01]]"
evidence_expected:
- Restricted handling SOP
tags:
- dpdp/obligation
- dpdp/D16
---

# OBL-REG-02 - Confidentiality of Govt requests

> **Requirement:** Do not disclose a Govt information request where so directed (sovereignty/security) without written permission.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.36 |
| Rule / instrument | R23(2) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D16 Regulatory Interface]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Restricted handling SOP

## Satisfied by controls
- [[CTL-REG-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-REG-02]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-REG-02]])
```
