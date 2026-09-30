---
type: domain
domain_id: D05
title: Notice
obligation_count: 6
control_count: 5
tags:
- dpdp/domain
---

# D05 - Notice

s.5 / Rule 3 notices incl. legacy notice and language.

## Obligations
| ID | Title | Source | Penalty | Phase |
|---|---|---|---|---|
| [[OBL-NOT-01]] | Notice with every consent request | s.5(1) R3 | P7 | 3 |
| [[OBL-NOT-02]] | Notice standalone & plain | s.5(1) R3(a),(b) | P7 | 3 |
| [[OBL-NOT-03]] | Itemised data and specified purpose | s.5(1)(i) R3(b) | P7 | 3 |
| [[OBL-NOT-04]] | Means to withdraw, exercise rights, complain | s.5(1)(ii),(iii) R3(c) | P7 | 3 |
| [[OBL-NOT-05]] | Language option | s.5(3) | P7 | 3 |
| [[OBL-NOT-06]] | Legacy consent notice | s.5(2) R3 | P7 | 3 |

## Controls
| ID | Title | Type | Owner |
|---|---|---|---|
| [[CTL-NOT-01]] | Rule 3 notice standard & templates | Directive | Privacy / Legal |
| [[CTL-NOT-02]] | Notice-to-register reconciliation | Detective | Privacy |
| [[CTL-NOT-03]] | Multilingual notice availability | Preventive | Marketing / Privacy |
| [[CTL-NOT-04]] | Notice versioning | Directive | Privacy / IT |
| [[CTL-NOT-05]] | Legacy customer notice campaign | Corrective | Marketing / Privacy |

## Test results in current cycle
```dataview
TABLE control, rating, tester, test_date FROM -"90 Templates" WHERE type = "control_test" AND contains(domain, [[D05 Notice]])
```
