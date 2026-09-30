---
type: domain
domain_id: D09
title: Security Safeguards
obligation_count: 11
control_count: 14
tags:
- dpdp/domain
---

# D09 - Security Safeguards

Rule 6 minimum safeguards and supporting ISMS.

## Obligations
| ID | Title | Source | Penalty | Phase |
|---|---|---|---|---|
| [[OBL-SEC-01]] | Reasonable security safeguards | s.8(5) R6(1) | P1 | 3 |
| [[OBL-SEC-02]] | Encryption / masking / tokenisation | s.8(5) R6(1)(a) | P1 | 3 |
| [[OBL-SEC-03]] | Access control to computer resources | s.8(5) R6(1)(b) | P1 | 3 |
| [[OBL-SEC-04]] | Logging, monitoring & review | s.8(5) R6(1)(c) | P1 | 3 |
| [[OBL-SEC-05]] | Continuity (backups) | s.8(5) R6(1)(d) | P1 | 3 |
| [[OBL-SEC-06]] | Retain logs & data 1 year for investigation | s.8(5) R6(1)(e) | P1 | 3 |
| [[OBL-SEC-07]] | Security clauses in processor contracts | s.8(5) R6(1)(f) | P1 | 3 |
| [[OBL-SEC-08]] | TOMs for security observance | s.8(5) R6(1)(g) | P1 | 3 |
| [[LNK-CERT-02]] | ICT logs 180 days within India | IT Act s.70B(6) CERT-In Directions (iv) | - | now |
| [[LNK-CERT-03]] | Clock synchronisation | IT Act s.70B(6) CERT-In Directions (i) | - | now |
| [[LNK-SPDI-01]] | SPDI Rules 2011 (until Phase 3) | IT Act s.43A SPDI Rules 2011 | - | now |

## Controls
| ID | Title | Type | Owner |
|---|---|---|---|
| [[CTL-SEC-01]] | ISMS & security risk assessment | Directive | CISO |
| [[CTL-SEC-02]] | Encryption at rest & in transit | Preventive | IT Security |
| [[CTL-SEC-03]] | Masking, tokenisation & pseudonymisation | Preventive | IT / App Owners |
| [[CTL-SEC-04]] | Identity & access management | Preventive | IT / System Owners |
| [[CTL-SEC-05]] | Privileged access management | Preventive | IT Security |
| [[CTL-SEC-06]] | Logging & monitoring of personal data access | Detective | SOC |
| [[CTL-SEC-07]] | Log & data retention for investigation (1 yr / 180 d India) | Preventive | IT / SOC |
| [[CTL-SEC-08]] | Backup & restore | Corrective | IT Ops |
| [[CTL-SEC-09]] | Vulnerability & patch management | Preventive | IT Security |
| [[CTL-SEC-10]] | DLP & data exfiltration controls | Detective | IT Security |
| [[CTL-SEC-11]] | Physical & paper record security | Preventive | Admin / Facilities |
| [[CTL-SEC-12]] | Secure SDLC & non-prod data | Preventive | Engineering |
| [[CTL-SEC-13]] | Clock synchronisation | Preventive | IT Ops |
| [[CTL-SEC-14]] | Endpoint & mobile device security | Preventive | IT |

## Test results in current cycle
```dataview
TABLE control, rating, tester, test_date FROM -"90 Templates" WHERE type = "control_test" AND contains(domain, [[D09 Security Safeguards]])
```
