---
type: obligation
obl_id: OBL-CON-06
title: Proof of notice and consent
regime: DPDP
domain: "[[D06 Consent Lifecycle]]"
act_ref: s.6(10)
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
- "[[CTL-MAP-01]]"
- "[[CTL-NOT-04]]"
- "[[CTL-CON-02]]"
evidence_expected:
- Consent ledger (who, when, notice version, purpose, channel)
tags:
- dpdp/obligation
- dpdp/D06
---

# OBL-CON-06 - Proof of notice and consent

> **Requirement:** Be able to prove notice was given and consent obtained (burden of proof on DF).

| Attribute | Value |
|---|---|
| Source (Act/law) | s.6(10) |
| Rule / instrument | - |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D06 Consent Lifecycle]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | lawful basis is consent |

## Evidence expected
- Consent ledger (who, when, notice version, purpose, channel)

## Satisfied by controls
- [[CTL-MAP-01]]
- [[CTL-NOT-04]]
- [[CTL-CON-02]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-CON-06]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-CON-06]])
```
