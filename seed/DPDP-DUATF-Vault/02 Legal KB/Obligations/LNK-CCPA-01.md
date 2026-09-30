---
type: obligation
obl_id: LNK-CCPA-01
title: No dark patterns in consent/UI
regime: Other Indian law
domain: "[[D06 Consent Lifecycle]]"
act_ref: Consumer Protection Act 2019 s.18
rule_ref: Guidelines for Prevention and Regulation of Dark Patterns 2023
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
  - online_presence
controls:
- "[[CTL-CON-01]]"
evidence_expected:
- UX dark-pattern audit
tags:
- dpdp/obligation
- dpdp/D06
---

# LNK-CCPA-01 - No dark patterns in consent/UI

> **Requirement:** Avoid dark patterns (false urgency, basket sneaking, confirm shaming, forced action, subscription traps, interface interference, nagging, drip pricing, disguised ads, bait & switch, SaaS billing, rogue malware, trick question).

| Attribute | Value |
|---|---|
| Source (Act/law) | Consumer Protection Act 2019 s.18 |
| Rule / instrument | Guidelines for Prevention and Regulation of Dark Patterns 2023 |
| Schedule | - |
| Actor | any |
| Domain | [[D06 Consent Lifecycle]] |
| Commencement | in force (other law) |
| Penalty exposure | - |
| Applies when | flags set: online_presence |

## Evidence expected
- UX dark-pattern audit

## Satisfied by controls
- [[CTL-CON-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[LNK-CCPA-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[LNK-CCPA-01]])
```
