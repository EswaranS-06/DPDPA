---
type: obligation
obl_id: OBL-PRC-02
title: Processor oversight
regime: DPDP
domain: "[[D13 Processor & Third-Party Management]]"
act_ref: s.8(1),(5)
rule_ref: R6(1)(f)
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P1
penalty_text: s.8(5) security safeguards - up to Rs 250 crore
sec: 8.1
trigger:
  flags:
  - processor
controls:
- "[[CTL-TPM-01]]"
- "[[CTL-TPM-02]]"
- "[[CTL-TPM-04]]"
evidence_expected:
- Vendor risk assessment
- Audit/SOC reports
tags:
- dpdp/obligation
- dpdp/D13
---

# OBL-PRC-02 - Processor oversight

> **Requirement:** Due diligence and ongoing oversight of processors proportionate to risk (DF remains accountable).

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(1),(5) |
| Rule / instrument | R6(1)(f) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D13 Processor & Third-Party Management]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.8(5) security safeguards - up to Rs 250 crore |
| Applies when | flags set: processor |

## Evidence expected
- Vendor risk assessment
- Audit/SOC reports

## Satisfied by controls
- [[CTL-TPM-01]]
- [[CTL-TPM-02]]
- [[CTL-TPM-04]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-PRC-02]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-PRC-02]])
```
