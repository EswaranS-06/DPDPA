---
type: domain
domain_id: D14
title: Cross-Border Transfer & Localisation
obligation_count: 3
control_count: 2
tags:
- dpdp/domain
---

# D14 - Cross-Border Transfer & Localisation

Negative list, sectoral localisation, R15 foreign-State access conditions.

## Obligations
| ID | Title | Source | Penalty | Phase |
|---|---|---|---|---|
| [[OBL-XB-01]] | No transfer to restricted countries | s.16(1) | P7 | 3 |
| [[OBL-XB-02]] | Foreign-State access conditions | s.16 R15 | P7 | 3 |
| [[OBL-XB-03]] | Sectoral localisation prevails | s.16(2) | P7 | 3 |

## Controls
| ID | Title | Type | Owner |
|---|---|---|---|
| [[CTL-XB-01]] | Transfer register & negative-list check | Detective | Privacy / Legal |
| [[CTL-XB-02]] | Data residency architecture | Preventive | IT Architecture |

## Test results in current cycle
```dataview
TABLE control, rating, tester, test_date FROM -"90 Templates" WHERE type = "control_test" AND contains(domain, [[D14 Cross-Border Transfer & Localisation]])
```
