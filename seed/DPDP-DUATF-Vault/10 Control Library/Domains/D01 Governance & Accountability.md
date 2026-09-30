---
type: domain
domain_id: D01
title: Governance & Accountability
obligation_count: 5
control_count: 7
tags:
- dpdp/domain
---

# D01 - Governance & Accountability

Programme ownership, DPO/contact, policies, TOMs, training, accountability of the Data Fiduciary.

## Obligations
| ID | Title | Source | Penalty | Phase |
|---|---|---|---|---|
| [[OBL-GOV-01]] | Accountability irrespective of processors | s.8(1) | P7 | 3 |
| [[OBL-GOV-02]] | Technical & organisational measures for compliance | s.8(4) | P7 | 3 |
| [[OBL-GOV-03]] | Publish contact of DPO / responsible person | s.8(9) R9 | P7 | 3 |
| [[OBL-GOV-04]] | Contact in every rights response | s.8(9) R9 | P7 | 3 |
| [[OBL-GOV-05]] | Lawful purpose only | s.4(1) | P7 | 3 |

## Controls
| ID | Title | Type | Owner |
|---|---|---|---|
| [[CTL-GOV-01]] | Privacy programme charter & RACI | Directive | Accountable Executive |
| [[CTL-GOV-02]] | Data protection policy suite | Directive | DPO / Privacy Lead |
| [[CTL-GOV-03]] | Designated contact person / DPO published | Directive | DPO / Privacy Lead |
| [[CTL-GOV-04]] | Privacy awareness & role-based training | Preventive | HR / Privacy Lead |
| [[CTL-GOV-05]] | Privacy by design gate in change/SDLC | Preventive | Product / IT Change Board |
| [[CTL-GOV-06]] | Management reporting & KPIs | Detective | DPO / Privacy Lead |
| [[CTL-GOV-07]] | Lawful-purpose screening | Preventive | Legal |

## Test results in current cycle
```dataview
TABLE control, rating, tester, test_date FROM -"90 Templates" WHERE type = "control_test" AND contains(domain, [[D01 Governance & Accountability]])
```
