---
type: obligation
obl_id: OBL-CON-01
title: Valid consent standard
regime: DPDP
domain: "[[D06 Consent Lifecycle]]"
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
- "[[CTL-LB-02]]"
- "[[CTL-LB-04]]"
- "[[CTL-CON-01]]"
- "[[CTL-CON-06]]"
evidence_expected:
- Consent UI review
- Consent per purpose design
tags:
- dpdp/obligation
- dpdp/D06
---

# OBL-CON-01 - Valid consent standard

> **Requirement:** Consent free, specific, informed, unconditional, unambiguous, with clear affirmative action (no pre-ticked boxes, no bundling of unrelated purposes).

| Attribute | Value |
|---|---|
| Source (Act/law) | s.6(1) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D06 Consent Lifecycle]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | lawful basis is consent |

## Evidence expected
- Consent UI review
- Consent per purpose design

## Satisfied by controls
- [[CTL-LB-02]]
- [[CTL-LB-04]]
- [[CTL-CON-01]]
- [[CTL-CON-06]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-CON-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-CON-01]])
```
