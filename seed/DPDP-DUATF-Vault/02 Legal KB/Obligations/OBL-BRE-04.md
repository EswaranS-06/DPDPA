---
type: obligation
obl_id: OBL-BRE-04
title: Breach awareness capability
regime: DPDP
domain: "[[D10 Breach Management]]"
act_ref: s.8(5),(6)
rule_ref: R6(1)(c), R7
schedule_ref: ''
actor: data_fiduciary
phase: 3
in_force: '2027-05-13'
status: not yet in force - 2027-05-13
penalty_tier: P2
penalty_text: s.8(6) breach intimation - up to Rs 200 crore
sec: 8.6
trigger:
  always: true
controls:
- "[[CTL-SEC-06]]"
- "[[CTL-BRE-01]]"
- "[[CTL-BRE-04]]"
evidence_expected:
- IR plan
- Escalation matrix
- Processor breach SLA
tags:
- dpdp/obligation
- dpdp/D10
---

# OBL-BRE-04 - Breach awareness capability

> **Requirement:** Capability to detect and escalate breaches (incl. from processors) so the 'without delay' and 72-hour clocks can be met.

| Attribute | Value |
|---|---|
| Source (Act/law) | s.8(5),(6) |
| Rule / instrument | R6(1)(c), R7 |
| Schedule | - |
| Actor | data_fiduciary |
| Domain | [[D10 Breach Management]] |
| Commencement | not yet in force - 2027-05-13 |
| Penalty exposure | s.8(6) breach intimation - up to Rs 200 crore |
| Applies when | Always (every in-scope activity) |

## Evidence expected
- IR plan
- Escalation matrix
- Processor breach SLA

## Satisfied by controls
- [[CTL-SEC-06]]
- [[CTL-BRE-01]]
- [[CTL-BRE-04]]

## Activities where this applies (engine output)
```dataview
LIST FROM "11 Assessments/Engine Output" WHERE contains(applicable_obligations, [[OBL-BRE-04]])
```

## Findings against this obligation
```dataview
TABLE severity, status, owner FROM -"90 Templates" WHERE type = "finding" AND contains(obligations, [[OBL-BRE-04]])
```
