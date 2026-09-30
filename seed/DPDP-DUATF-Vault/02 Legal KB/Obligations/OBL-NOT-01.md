---
type: obligation
obl_id: OBL-NOT-01
title: Notice with every consent request
regime: DPDP
domain: "[[D05 Notice]]"
act_ref: s.5(1)
rule_ref: R3
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 5
trigger:
  basis:
  - consent
controls:
- "[[CTL-NOT-01]]"
- "[[CTL-NOT-04]]"
evidence_expected:
- Notice versions
- UI screenshots
- Consent flow recording
tags:
- dpdp/obligation
- dpdp/D05
---

# OBL-NOT-01 - Notice with every consent request

> **Requirement:** Every consent request accompanied or preceded by a notice.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.5(1) |
| Rule / instrument | R3 |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D05 Notice]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | lawful basis is consent |

## Evidence expected
- Notice versions
- UI screenshots
- Consent flow recording

## Satisfied by controls
- [[CTL-NOT-01]]
- [[CTL-NOT-04]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-NOT-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-NOT-01]])
```
