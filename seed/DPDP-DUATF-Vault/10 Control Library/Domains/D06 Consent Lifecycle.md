---
type: domain
domain_id: D06
title: Consent Lifecycle
obligation_count: 9
control_count: 6
tags:
- dpdp/domain
---

# D06 - Consent Lifecycle

Capture, record, proof, withdrawal, Consent Manager integration.

## Obligations
| ID | Title | Source | Penalty | Phase |
|---|---|---|---|---|
| [[OBL-CON-01]] | Valid consent standard | s.6(1) | P7 | 3 |
| [[OBL-CON-02]] | No infringing consent terms | s.6(2) | P7 | 3 |
| [[OBL-CON-03]] | Consent request language & contact | s.6(3) | P7 | 3 |
| [[OBL-CON-04]] | Withdrawal with comparable ease | s.6(4) R3(c)(i) | P7 | 3 |
| [[OBL-CON-05]] | Cease processing after withdrawal | s.6(6) | P7 | 3 |
| [[OBL-CON-06]] | Proof of notice and consent | s.6(10) | P7 | 3 |
| [[OBL-CON-07]] | Accept Consent Manager instructions | s.6(7),(8) R4 | P7 | 3 |
| [[LNK-TRAI-01]] | Commercial communication preferences | TRAI Act TCCCPR 2018 (as amended) | - | now |
| [[LNK-CCPA-01]] | No dark patterns in consent/UI | Consumer Protection Act 2019 s.18 Guidelines for Prevention and Regulation of Dark Patterns 2023 | - | now |

## Controls
| ID | Title | Type | Owner |
|---|---|---|---|
| [[CTL-CON-01]] | Consent capture design standard | Preventive | Product / UX |
| [[CTL-CON-02]] | Consent ledger (proof of consent) | Preventive | IT / Privacy |
| [[CTL-CON-03]] | Withdrawal with comparable ease | Preventive | Product |
| [[CTL-CON-04]] | Withdrawal propagation | Corrective | IT / Data Engineering |
| [[CTL-CON-05]] | Consent Manager integration | Preventive | IT / Privacy |
| [[CTL-CON-06]] | Marketing consent & DLT compliance | Preventive | Marketing |

## Test results in current cycle
```dataview
TABLE control, rating, tester, test_date FROM -"90 Templates" WHERE type = "control_test" AND contains(domain, [[D06 Consent Lifecycle]])
```
