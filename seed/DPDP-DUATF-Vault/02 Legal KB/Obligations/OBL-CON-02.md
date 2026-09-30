---
type: obligation
obl_id: OBL-CON-02
title: No infringing consent terms
regime: DPDP
domain: "[[D06 Consent Lifecycle]]"
act_ref: s.6(2)
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
- "[[CTL-CON-01]]"
evidence_expected:
- Legal review of T&Cs / consent language
tags:
- dpdp/obligation
- dpdp/D06
---

# OBL-CON-02 - No infringing consent terms

> **Requirement:** Consent terms that infringe the Act, Rules or other law are invalid to that extent (e.g. waivers of right to complain).

| Attribute | Value |
|---|---|
| Source (Act/law) | s.6(2) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D06 Consent Lifecycle]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | lawful basis is consent |

## Evidence expected
- Legal review of T&Cs / consent language

## Satisfied by controls
- [[CTL-CON-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-CON-02]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-CON-02]])
```
