---
type: obligation
obl_id: OBL-GOV-02
title: Technical & organisational measures for compliance
regime: DPDP
domain: "[[D01 Governance & Accountability]]"
act_ref: s.8(4)
rule_ref: ''
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 8.4
trigger:
  always: true
controls:
- "[[CTL-GOV-01]]"
- "[[CTL-GOV-02]]"
- "[[CTL-GOV-04]]"
- "[[CTL-GOV-05]]"
evidence_expected:
- Privacy programme charter
- Policy suite
- Training records
- Control library with owners
tags:
- dpdp/obligation
- dpdp/D01
---

# OBL-GOV-02 - Technical & organisational measures for compliance

> **Requirement:** Implement appropriate technical and organisational measures to ensure effective observance of the Act and Rules.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(4) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D01 Governance & Accountability]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Privacy programme charter
- Policy suite
- Training records
- Control library with owners

## Satisfied by controls
- [[CTL-GOV-01]]
- [[CTL-GOV-02]]
- [[CTL-GOV-04]]
- [[CTL-GOV-05]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-GOV-02]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-GOV-02]])
```
