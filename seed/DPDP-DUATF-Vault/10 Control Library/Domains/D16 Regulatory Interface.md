---
type: domain
domain_id: D16
title: Regulatory Interface
obligation_count: 6
control_count: 3
tags:
- dpdp/domain
---

# D16 - Regulatory Interface

Board inquiries, Govt information calls, voluntary undertaking, appeals, change tracking.

## Obligations
| ID | Title | Source | Penalty | Phase |
|---|---|---|---|---|
| [[OBL-REG-01]] | Furnish information to Central Govt | s.36 R23(1) | P7 | 3 |
| [[OBL-REG-02]] | Confidentiality of Govt requests | s.36 R23(2) | P7 | 3 |
| [[OBL-REG-03]] | Cooperate with Board inquiry & directions | s.27, s.28 R20 | P7 | 3 |
| [[OBL-REG-04]] | Honour voluntary undertakings | s.32 | P6 | 3 |
| [[OBL-REG-05]] | Appeal within 60 days | s.29 R22 | - | 3 |
| [[LNK-CERT-04]] | CERT-In Point of Contact | IT Act s.70B(6) CERT-In Directions (iii) | - | now |

## Controls
| ID | Title | Type | Owner |
|---|---|---|---|
| [[CTL-REG-01]] | Regulator & Government request handling | Directive | Legal |
| [[CTL-REG-02]] | Undertaking & appeal tracker | Detective | Legal |
| [[CTL-REG-03]] | CERT-In PoC & reporting channel | Directive | CISO |

## Test results in current cycle
```dataview
TABLE control, rating, tester, test_date FROM -"90 Templates" WHERE type = "control_test" AND contains(domain, [[D16 Regulatory Interface]])
```
