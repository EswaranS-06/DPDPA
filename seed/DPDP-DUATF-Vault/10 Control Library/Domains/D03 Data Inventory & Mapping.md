---
type: domain
domain_id: D03
title: Data Inventory & Mapping
obligation_count: 2
control_count: 4
tags:
- dpdp/domain
---

# D03 - Data Inventory & Mapping

Processing activity register (RoPA), data flows, systems, data element catalogue. The graph.

## Obligations
| ID | Title | Source | Penalty | Phase |
|---|---|---|---|---|
| [[OBL-MAP-01]] | Maintain processing activity register | s.6(10), s.8(1),(4) | - | 3 |
| [[OBL-MAP-02]] | Identify digitised non-digital data | s.3(a) | - | 3 |

## Controls
| ID | Title | Type | Owner |
|---|---|---|---|
| [[CTL-MAP-01]] | Processing activity register (RoPA) | Directive | Process Owners / Privacy |
| [[CTL-MAP-02]] | Data flow diagrams incl. digitisation points | Directive | Process Owners / Architecture |
| [[CTL-MAP-03]] | System & shadow-data discovery | Detective | IT Security |
| [[CTL-MAP-04]] | Data element catalogue & classification | Directive | Data Governance |

## Test results in current cycle
```dataview
TABLE control, rating, tester, test_date FROM -"90 Templates" WHERE type = "control_test" AND contains(domain, [[D03 Data Inventory & Mapping]])
```
