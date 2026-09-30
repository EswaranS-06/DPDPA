---
type: obligation
obl_id: OBL-STA-01
title: State benefit processing per Second Schedule
regime: DPDP
domain: "[[D17 State & Research Processing]]"
act_ref: s.7(b)
rule_ref: R5
schedule_ref: SCH2
actor: state
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P7
penalty_text: any other provision - up to Rs 50 crore
sec: 7
trigger:
  basis:
  - s7b
controls:
- "[[CTL-STA-01]]"
evidence_expected:
- Scheme-wise processing notes
- Intimation to beneficiaries
tags:
- dpdp/obligation
- dpdp/D17
---

# OBL-STA-01 - State benefit processing per Second Schedule

> **Requirement:** State and instrumentalities processing under s.7(b) follow Second Schedule standards (lawful, purpose-limited, necessary, accurate, retention-limited, secure, intimation, accountable).

| Attribute | Value |
|---|---|
| Source (Act/law) | s.7(b) |
| Rule / instrument | R5 |
| Schedule | SCH2 |
| Actor | state |
| Domain | [[D17 State & Research Processing]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | any other provision - up to Rs 50 crore |
| Applies when | lawful basis is s7b |

## Evidence expected
- Scheme-wise processing notes
- Intimation to beneficiaries

## Satisfied by controls
- [[CTL-STA-01]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-STA-01]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-STA-01]])
```
