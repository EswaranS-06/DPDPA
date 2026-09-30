---
type: domain
domain_id: D08
title: Data Quality
obligation_count: 1
control_count: 2
tags:
- dpdp/domain
---

# D08 - Data Quality

Completeness, accuracy and consistency for decisions/disclosures.

## Obligations
| ID | Title | Source | Penalty | Phase |
|---|---|---|---|---|
| [[OBL-DQ-01]] | Accuracy for decisions & disclosures | s.8(3) | P7 | 3 |

## Controls
| ID | Title | Type | Owner |
|---|---|---|---|
| [[CTL-DQ-01]] | Data quality rules for decisioning & disclosures | Preventive | Data Governance |
| [[CTL-DQ-02]] | Correction propagation | Corrective | Ops / IT |

## Test results in current cycle
```dataview
TABLE control, rating, tester, test_date FROM -"90 Templates" WHERE type = "control_test" AND contains(domain, [[D08 Data Quality]])
```
