---
type: obligation
obl_id: OBL-RET-03
title: Third Schedule inactivity erasure
regime: DPDP
domain: "[[D11 Retention & Erasure]]"
act_ref: s.8(8)
rule_ref: R8(1)
schedule_ref: SCH3
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 8.8
trigger:
  flags:
  - third_schedule
controls:
- "[[CTL-RET-03]]"
evidence_expected:
- Inactivity job config
- User count evidence
tags:
- dpdp/obligation
- dpdp/D11
---

# OBL-RET-03 - Third Schedule inactivity erasure

> **Requirement:** E-commerce (>=2 cr users), online gaming (>=50 lakh), social media (>=2 cr): erase after 3 years from last approach/commencement (except account access & virtual tokens) unless law requires retention.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(8) |
| Rule / instrument | R8(1) |
| Schedule | SCH3 |
| Actor | data_fiduciary |
| Domain | [[D11 Retention & Erasure]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | flags set: third_schedule |

## Evidence expected
- Inactivity job config
- User count evidence

## Satisfied by controls
- [[CTL-RET-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-RET-03]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-RET-03]])
```
