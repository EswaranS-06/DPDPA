---
type: obligation
obl_id: OBL-LB-02
title: Data minimisation for consent
regime: DPDP
domain: "[[D04 Lawful Basis & Purpose]]"
act_ref: s.6(1)
rule_ref: ''
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 6
trigger:
  basis:
  - consent
controls:
- "[[CTL-GOV-05]]"
- "[[CTL-MAP-04]]"
- "[[CTL-LB-02]]"
evidence_expected:
- Data element necessity review
tags:
- dpdp/obligation
- dpdp/D04
---

# OBL-LB-02 - Data minimisation for consent

> **Requirement:** Consent-based processing limited to personal data necessary for the specified purpose.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.6(1) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D04 Lawful Basis & Purpose]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | lawful basis is consent |

## Evidence expected
- Data element necessity review

## Satisfied by controls
- [[CTL-GOV-05]]
- [[CTL-MAP-04]]
- [[CTL-LB-02]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-LB-02]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-LB-02]])
```
