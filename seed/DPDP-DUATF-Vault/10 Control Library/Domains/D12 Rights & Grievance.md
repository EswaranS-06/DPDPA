---
type: domain
domain_id: D12
title: Rights & Grievance
obligation_count: 8
control_count: 5
tags:
- dpdp/domain
---

# D12 - Rights & Grievance

Access, correction, erasure, nomination, grievance within 90 days.

## Obligations
| ID | Title | Source | Penalty | Phase |
|---|---|---|---|---|
| [[OBL-RGT-01]] | Publish means & identifiers for rights | s.11-14 R14(1),(5) | P7 | 3 |
| [[OBL-RGT-02]] | Right to access | s.11(1) R14(2) | P7 | 3 |
| [[OBL-RGT-03]] | Right to correction, completion, updating | s.12(1),(2) R14(2) | P7 | 3 |
| [[OBL-RGT-04]] | Right to erasure | s.12(3) R14(2) | P7 | 3 |
| [[OBL-RGT-05]] | Grievance redressal within 90 days | s.8(10), s.13 R14(3) | P7 | 3 |
| [[OBL-RGT-06]] | Right to nominate | s.14 R14(4) | P7 | 3 |
| [[OBL-RGT-07]] | Requester identification | s.11-14 R14(2),(5) | P7 | 3 |
| [[OBL-RGT-08]] | Handle requests considering Data Principal duties | s.15 | P5 | 3 |

## Controls
| ID | Title | Type | Owner |
|---|---|---|---|
| [[CTL-RGT-01]] | Rights & grievance intake channels | Directive | Customer Service / DPO |
| [[CTL-RGT-02]] | Rights handling SOP & SLA tracking | Directive | DPO |
| [[CTL-RGT-03]] | Requester verification | Preventive | Customer Service |
| [[CTL-RGT-04]] | Access-request data assembly | Preventive | IT / Privacy |
| [[CTL-RGT-05]] | Erasure request workflow with legal-hold check | Corrective | Privacy / IT |

## Test results in current cycle
```dataview
TABLE control, rating, tester, test_date FROM -"90 Templates" WHERE type = "control_test" AND contains(domain, [[D12 Rights & Grievance]])
```
