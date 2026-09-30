---
type: obligation
obl_id: LNK-SPDI-01
title: SPDI Rules 2011 (until Phase 3)
regime: Other Indian law
domain: "[[D09 Security Safeguards]]"
act_ref: IT Act s.43A
rule_ref: SPDI Rules 2011
schedule_ref: ''
actor: any
phase: 0
in_force: ''
status: in force (other law)
penalty_tier: ''
penalty_text: ''
sec: 0
trigger:
  always: true
controls:
- "[[CTL-SEC-01]]"
evidence_expected:
- Privacy policy
- ISO 27001 certificate/audit
tags:
- dpdp/obligation
- dpdp/D09
---

# LNK-SPDI-01 - SPDI Rules 2011 (until Phase 3)

> **Requirement:** Until s.44(2) commences, body corporates handling sensitive personal data (passwords, financial, health, sexual orientation, biometrics, medical records) must follow SPDI Rules: privacy policy, written consent for SPD, reasonable security practices (e.g. ISO 27001), grievance officer (1 month).

| Attribute | Value |
|---|---|
| Source (Act/law) | IT Act s.43A |
| Rule / instrument | SPDI Rules 2011 |
| Schedule | - |
| Actor | any |
| Domain | [[D09 Security Safeguards]] |
| Commencement | in force (other law) |
| Penalty exposure | - |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- Privacy policy
- ISO 27001 certificate/audit

## Satisfied by controls
- [[CTL-SEC-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[LNK-SPDI-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[LNK-SPDI-01]])
```
