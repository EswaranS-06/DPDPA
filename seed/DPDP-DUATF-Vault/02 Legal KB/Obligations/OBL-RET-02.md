---
type: obligation
obl_id: OBL-RET-02
title: Processors erase too
regime: DPDP
domain: "[[D11 Retention & Erasure]]"
act_ref: s.8(7)(b)
rule_ref: ''
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 8.7
trigger:
  flags:
  - processor
controls:
- "[[CTL-RET-04]]"
- "[[CTL-TPM-03]]"
evidence_expected:
- Erasure certificates from processors
tags:
- dpdp/obligation
- dpdp/D11
---

# OBL-RET-02 - Processors erase too

> **Requirement:** Cause processors to erase personal data made available to them.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(7)(b) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D11 Retention & Erasure]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | flags set: processor |

## Evidence expected
- Erasure certificates from processors

## Satisfied by controls
- [[CTL-RET-04]]
- [[CTL-TPM-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-RET-02]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-RET-02]])
```
