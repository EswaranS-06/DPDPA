---
type: obligation
obl_id: OBL-PRC-01
title: Processor only under valid contract
regime: DPDP
domain: "[[D13 Processor & Third-Party Management]]"
act_ref: s.8(2)
rule_ref: ''
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 8.2
trigger:
  flags:
  - processor
controls:
- "[[CTL-TPM-01]]"
- "[[CTL-TPM-03]]"
evidence_expected:
- Executed contract/DPA
tags:
- dpdp/obligation
- dpdp/D13
---

# OBL-PRC-01 - Processor only under valid contract

> **Requirement:** Engage/appoint/use a Data Processor only under a valid contract for activities related to offering goods/services.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(2) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D13 Processor & Third-Party Management]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | flags set: processor |

## Evidence expected
- Executed contract/DPA

## Satisfied by controls
- [[CTL-TPM-01]]
- [[CTL-TPM-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-PRC-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-PRC-01]])
```
