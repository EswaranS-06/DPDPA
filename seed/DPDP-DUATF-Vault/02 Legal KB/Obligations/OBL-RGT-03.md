---
type: obligation
obl_id: OBL-RGT-03
title: Right to correction, completion, updating
regime: DPDP
domain: "[[D12 Rights & Grievance]]"
act_ref: s.12(1),(2)
rule_ref: R14(2)
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 12
trigger:
  basis:
  - consent
  - s7a
controls:
- "[[CTL-DQ-02]]"
- "[[CTL-RGT-02]]"
evidence_expected:
- Correction SOP
- Change logs
tags:
- dpdp/obligation
- dpdp/D12
---

# OBL-RGT-03 - Right to correction, completion, updating

> **Requirement:** Correct inaccurate/misleading, complete incomplete and update personal data on request.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.12(1),(2) |
| Rule / instrument | R14(2) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D12 Rights & Grievance]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | lawful basis is consent or s7a |

## Evidence expected
- Correction SOP
- Change logs

## Satisfied by controls
- [[CTL-DQ-02]]
- [[CTL-RGT-02]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-RGT-03]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-RGT-03]])
```
