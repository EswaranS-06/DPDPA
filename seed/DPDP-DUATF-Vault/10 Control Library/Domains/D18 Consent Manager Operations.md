---
type: domain
domain_id: D18
title: Consent Manager Operations
obligation_count: 6
control_count: 2
tags:
- dpdp/domain
---

# D18 - Consent Manager Operations

Only for entities registering as Consent Managers (First Schedule).

## Obligations
| ID | Title | Source | Penalty | Phase |
|---|---|---|---|---|
| [[OBL-CMO-01]] | Register as Consent Manager | s.6(9) R4(1) | P7 | 2 |
| [[OBL-CMO-02]] | Platform & data non-readability | s.6(8) R4(2) | P7 | 2 |
| [[OBL-CMO-03]] | Records for 7 years | s.6(8) R4(2) | P7 | 2 |
| [[OBL-CMO-04]] | No sub-contracting; security; fiduciary capacity | s.6(8) R4(2) | P7 | 2 |
| [[OBL-CMO-05]] | Conflict of interest & transparency | s.6(8) R4(2) | P7 | 2 |
| [[OBL-CMO-06]] | Audit & change of control | s.6(8) R4(2) | P7 | 2 |

## Controls
| ID | Title | Type | Owner |
|---|---|---|---|
| [[CTL-CMO-01]] | Consent Manager registration & governance | Directive | Company Secretary |
| [[CTL-CMO-02]] | Consent Manager platform controls | Preventive | CTO |

## Test results in current cycle
```dataview
TABLE control, rating, tester, test_date FROM -"90 Templates" WHERE type = "control_test" AND contains(domain, [[D18 Consent Manager Operations]])
```
