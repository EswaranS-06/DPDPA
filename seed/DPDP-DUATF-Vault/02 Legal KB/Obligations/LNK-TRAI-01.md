---
type: obligation
obl_id: LNK-TRAI-01
title: Commercial communication preferences
regime: Other Indian law
domain: "[[D06 Consent Lifecycle]]"
act_ref: TRAI Act
rule_ref: TCCCPR 2018 (as amended)
schedule_ref: ''
actor: any
phase: 0
in_force: ''
status: in force (other law)
penalty_tier: ''
penalty_text: ''
sec: 0
trigger:
  flags:
  - marketing
controls:
- "[[CTL-CON-06]]"
evidence_expected:
- DLT registrations
- Consent templates
tags:
- dpdp/obligation
- dpdp/D06
---

# LNK-TRAI-01 - Commercial communication preferences

> **Requirement:** Promotional SMS/voice to Indian numbers only via registered headers/templates on DLT, honour DND preferences and digital consent acquisition.

| Attribute | Value |
|---|---|
| Source (Act/law) | TRAI Act |
| Rule / instrument | TCCCPR 2018 (as amended) |
| Schedule | - |
| Actor | any |
| Domain | [[D06 Consent Lifecycle]] |
| Commencement | in force (other law) |
| Penalty exposure | - |
| Applies when | flags set: marketing |

## Evidence expected
- DLT registrations
- Consent templates

## Satisfied by controls
- [[CTL-CON-06]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[LNK-TRAI-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[LNK-TRAI-01]])
```
