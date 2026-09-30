---
type: obligation
obl_id: OBL-DQ-01
title: Accuracy for decisions & disclosures
regime: DPDP
domain: "[[D08 Data Quality]]"
act_ref: s.8(3)
rule_ref: ''
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 8.3
trigger:
  flags:
  - decision_or_disclosure
controls:
- "[[CTL-DQ-01]]"
- "[[CTL-DQ-02]]"
- "[[CTL-TPM-05]]"
evidence_expected:
- Data quality rules
- Reconciliation reports
tags:
- dpdp/obligation
- dpdp/D08
---

# OBL-DQ-01 - Accuracy for decisions & disclosures

> **Requirement:** Ensure completeness, accuracy and consistency where personal data is used to make a decision affecting the DP or is disclosed to another Data Fiduciary.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(3) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D08 Data Quality]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | flags set: decision_or_disclosure |

## Evidence expected
- Data quality rules
- Reconciliation reports

## Satisfied by controls
- [[CTL-DQ-01]]
- [[CTL-DQ-02]]
- [[CTL-TPM-05]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-DQ-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-DQ-01]])
```
