---
type: obligation
obl_id: OBL-PRC-03
title: Flow-down withdrawal & erasure
regime: DPDP
domain: "[[D13 Processor & Third-Party Management]]"
act_ref: s.6(6), s.8(7)(b)
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
- "[[CTL-CON-04]]"
- "[[CTL-RET-04]]"
- "[[CTL-TPM-03]]"
evidence_expected:
- DPA clauses
- Instruction logs
tags:
- dpdp/obligation
- dpdp/D13
---

# OBL-PRC-03 - Flow-down withdrawal & erasure

> **Requirement:** Contract/instructions require processor to cease processing on withdrawal and erase at purpose end.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.6(6), s.8(7)(b) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D13 Processor & Third-Party Management]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | flags set: processor |

## Evidence expected
- DPA clauses
- Instruction logs

## Satisfied by controls
- [[CTL-CON-04]]
- [[CTL-RET-04]]
- [[CTL-TPM-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-PRC-03]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-PRC-03]])
```
