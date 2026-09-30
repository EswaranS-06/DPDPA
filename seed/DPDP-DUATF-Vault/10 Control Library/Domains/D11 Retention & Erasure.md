---
type: domain
domain_id: D11
title: Retention & Erasure
obligation_count: 6
control_count: 5
tags:
- dpdp/domain
---

# D11 - Retention & Erasure

Purpose-end erasure, Third Schedule, 48h notice, 1-year log floor, sector retention conflicts.

## Obligations
| ID | Title | Source | Penalty | Phase |
|---|---|---|---|---|
| [[OBL-RET-01]] | Erase at purpose end or withdrawal | s.8(7)(a) | P7 | 3 |
| [[OBL-RET-02]] | Processors erase too | s.8(7)(b) | P7 | 3 |
| [[OBL-RET-03]] | Third Schedule inactivity erasure | s.8(8) R8(1) | P7 | 3 |
| [[OBL-RET-04]] | 48-hour pre-erasure intimation | s.8(8) R8(2) | P7 | 3 |
| [[OBL-RET-05]] | 1-year floor for data, traffic data & logs | s.8(7) R8(3) | P7 | 3 |
| [[OBL-RET-06]] | Reconciled retention schedule | s.8(7) R8 | - | 3 |

## Controls
| ID | Title | Type | Owner |
|---|---|---|---|
| [[CTL-RET-01]] | Reconciled retention schedule | Directive | Legal / Records |
| [[CTL-RET-02]] | Automated deletion / anonymisation jobs | Corrective | IT / App Owners |
| [[CTL-RET-03]] | Third Schedule inactivity engine | Corrective | Product / IT |
| [[CTL-RET-04]] | Processor erasure certification | Corrective | Procurement / Privacy |
| [[CTL-RET-05]] | Paper record disposal | Corrective | Admin |

## Test results in current cycle
```dataview
TABLE control, rating, tester, test_date FROM -"90 Templates" WHERE type = "control_test" AND contains(domain, [[D11 Retention & Erasure]])
```
