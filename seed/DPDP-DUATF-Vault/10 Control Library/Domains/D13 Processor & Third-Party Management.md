---
type: domain
domain_id: D13
title: Processor & Third-Party Management
obligation_count: 4
control_count: 5
tags:
- dpdp/domain
---

# D13 - Processor & Third-Party Management

Contracts, due diligence, oversight, sub-processors, cessation/erasure flow-down.

## Obligations
| ID | Title | Source | Penalty | Phase |
|---|---|---|---|---|
| [[OBL-PRC-01]] | Processor only under valid contract | s.8(2) | P7 | 3 |
| [[OBL-PRC-02]] | Processor oversight | s.8(1),(5) R6(1)(f) | P1 | 3 |
| [[OBL-PRC-03]] | Flow-down withdrawal & erasure | s.6(6), s.8(7)(b) | P7 | 3 |
| [[OBL-PRC-04]] | Processor breach notification to DF | s.8(6) R7 | P2 | 3 |

## Controls
| ID | Title | Type | Owner |
|---|---|---|---|
| [[CTL-TPM-01]] | Third-party inventory & classification | Directive | Procurement / Privacy |
| [[CTL-TPM-02]] | Privacy due diligence before onboarding | Preventive | Procurement / Security |
| [[CTL-TPM-03]] | DPDP data processing agreement (DPA) | Preventive | Legal |
| [[CTL-TPM-04]] | Ongoing vendor monitoring | Detective | Vendor Risk |
| [[CTL-TPM-05]] | Data sharing with other Data Fiduciaries | Preventive | Legal / Privacy |

## Test results in current cycle
```dataview
TABLE control, rating, tester, test_date FROM -"90 Templates" WHERE type = "control_test" AND contains(domain, [[D13 Processor & Third-Party Management]])
```
