---
type: domain
domain_id: D10
title: Breach Management
obligation_count: 5
control_count: 4
tags:
- dpdp/domain
---

# D10 - Breach Management

Detection, triage, DP intimation, Board 72h report, CERT-In 6h.

## Obligations
| ID | Title | Source | Penalty | Phase |
|---|---|---|---|---|
| [[OBL-BRE-01]] | Intimate affected Data Principals | s.8(6) R7(1) | P2 | 3 |
| [[OBL-BRE-02]] | Initial intimation to Board | s.8(6) R7(2)(a) | P2 | 3 |
| [[OBL-BRE-03]] | Detailed report to Board within 72 hours | s.8(6) R7(2)(b) | P2 | 3 |
| [[OBL-BRE-04]] | Breach awareness capability | s.8(5),(6) R6(1)(c), R7 | P2 | 3 |
| [[LNK-CERT-01]] | CERT-In incident report within 6 hours | IT Act s.70B(6) CERT-In Directions 28.04.2022 (ii) | - | now |

## Controls
| ID | Title | Type | Owner |
|---|---|---|---|
| [[CTL-BRE-01]] | Incident response plan with DPDP & CERT-In clocks | Corrective | CISO / DPO |
| [[CTL-BRE-02]] | Breach register & decision log | Detective | DPO |
| [[CTL-BRE-03]] | DP notification capability | Corrective | Privacy / Comms |
| [[CTL-BRE-04]] | Breach tabletop exercises | Detective | CISO / DPO |

## Test results in current cycle
```dataview
TABLE control, rating, tester, test_date FROM -"90 Templates" WHERE type = "control_test" AND contains(domain, [[D10 Breach Management]])
```
