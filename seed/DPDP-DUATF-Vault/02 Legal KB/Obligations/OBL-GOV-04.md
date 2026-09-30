---
type: obligation
obl_id: OBL-GOV-04
title: Contact in every rights response
regime: DPDP
domain: "[[D01 Governance & Accountability]]"
act_ref: s.8(9)
rule_ref: R9
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 8.9
trigger:
  always: true
controls:
- "[[CTL-GOV-03]]"
evidence_expected:
- Response templates
- Sample responses
tags:
- dpdp/obligation
- dpdp/D01
---

# OBL-GOV-04 - Contact in every rights response

> **Requirement:** Mention the DPO/responsible person contact in every response to a communication from a DP for exercise of rights.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(9) |
| Rule / instrument | R9 |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D01 Governance & Accountability]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Response templates
- Sample responses

## Satisfied by controls
- [[CTL-GOV-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-GOV-04]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-GOV-04]])
```
