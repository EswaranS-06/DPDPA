---
type: obligation
obl_id: OBL-RGT-02
title: Right to access
regime: DPDP
domain: "[[D12 Rights & Grievance]]"
act_ref: s.11(1)
rule_ref: R14(2)
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 11
trigger:
  basis:
  - consent
  - s7a
controls:
- "[[CTL-RGT-02]]"
- "[[CTL-RGT-04]]"
- "[[CTL-TPM-05]]"
evidence_expected:
- Access request SOP
- Response samples
tags:
- dpdp/obligation
- dpdp/D12
---

# OBL-RGT-02 - Right to access

> **Requirement:** Provide summary of personal data and processing activities, identities of other DFs and processors shared with and description of data shared.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.11(1) |
| Rule / instrument | R14(2) |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D12 Rights & Grievance]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | lawful basis is consent or s7a |

## Evidence expected
- Access request SOP
- Response samples

## Satisfied by controls
- [[CTL-RGT-02]]
- [[CTL-RGT-04]]
- [[CTL-TPM-05]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-RGT-02]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-RGT-02]])
```
