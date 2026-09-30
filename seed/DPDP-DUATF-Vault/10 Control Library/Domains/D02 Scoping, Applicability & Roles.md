---
type: domain
domain_id: D02
title: Scoping, Applicability & Roles
obligation_count: 4
control_count: 4
tags:
- dpdp/domain
---

# D02 - Scoping, Applicability & Roles

Territorial/material scope, role determination (DF/Processor/SDF/CM/State), exemptions register.

## Obligations
| ID | Title | Source | Penalty | Phase |
|---|---|---|---|---|
| [[OBL-SCP-01]] | Determine applicability of the Act | s.3 | - | 3 |
| [[OBL-SCP-02]] | Determine role per processing activity | s.2(i),(k) | - | 3 |
| [[OBL-SCP-03]] | Document and justify exemptions | s.17 R16 | - | 3 |
| [[OBL-SCP-04]] | Monitor SDF notification | s.10(1) | - | 3 |

## Controls
| ID | Title | Type | Owner |
|---|---|---|---|
| [[CTL-SCP-01]] | Applicability & entity profile assessment | Directive | DPO / Legal |
| [[CTL-SCP-02]] | Role determination per activity & contract | Directive | Legal / Privacy |
| [[CTL-SCP-03]] | Exemption register | Directive | Legal |
| [[CTL-SCP-04]] | Regulatory change monitoring | Detective | Legal / Compliance |

## Test results in current cycle
```dataview
TABLE control, rating, tester, test_date FROM -"90 Templates" WHERE type = "control_test" AND contains(domain, [[D02 Scoping, Applicability & Roles]])
```
