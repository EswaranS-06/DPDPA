---
type: obligation
obl_id: OBL-RGT-04
title: Right to erasure
regime: DPDP
domain: "[[D12 Rights & Grievance]]"
act_ref: s.12(3)
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
- "[[CTL-RET-02]]"
- "[[CTL-RGT-02]]"
- "[[CTL-RGT-05]]"
evidence_expected:
- Erasure SOP
- Legal-hold check
- Completion evidence
tags:
- dpdp/obligation
- dpdp/D12
---

# OBL-RGT-04 - Right to erasure

> **Requirement:** Erase on request unless retention necessary for specified purpose or compliance with law.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.12(3) |
| Rule / instrument | R14(2) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D12 Rights & Grievance]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | lawful basis is consent or s7a |

## Evidence expected
- Erasure SOP
- Legal-hold check
- Completion evidence

## Satisfied by controls
- [[CTL-RET-02]]
- [[CTL-RGT-02]]
- [[CTL-RGT-05]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-RGT-04]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-RGT-04]])
```
