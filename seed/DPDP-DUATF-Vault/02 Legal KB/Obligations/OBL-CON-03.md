---
type: obligation
obl_id: OBL-CON-03
title: Consent request language & contact
regime: DPDP
domain: "[[D06 Consent Lifecycle]]"
act_ref: s.6(3)
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
- "[[CTL-GOV-03]]"
- "[[CTL-NOT-03]]"
evidence_expected:
- Consent request screenshots
tags:
- dpdp/obligation
- dpdp/D06
---

# OBL-CON-03 - Consent request language & contact

> **Requirement:** Consent request in clear plain language, English/Eighth Schedule option, with contact details of DPO or authorised person.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.6(3) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D06 Consent Lifecycle]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | lawful basis is consent |

## Evidence expected
- Consent request screenshots

## Satisfied by controls
- [[CTL-GOV-03]]
- [[CTL-NOT-03]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-CON-03]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-CON-03]])
```
