---
type: domain
domain_id: D04
title: Lawful Basis & Purpose
obligation_count: 6
control_count: 4
tags:
- dpdp/domain
---

# D04 - Lawful Basis & Purpose

Purpose register; consent vs s.7 legitimate use per purpose; minimisation.

## Obligations
| ID | Title | Source | Penalty | Phase |
|---|---|---|---|---|
| [[OBL-LB-01]] | Specified purpose defined per activity | s.2(za), s.4, s.6(1) R3(b) | P7 | 3 |
| [[OBL-LB-02]] | Data minimisation for consent | s.6(1) | P7 | 3 |
| [[OBL-LB-03]] | s.7(a) voluntary provision conditions | s.7(a) | P7 | 3 |
| [[OBL-LB-04]] | s.7(c)-(e) legal source identified | s.7(c),(d),(e) | P7 | 3 |
| [[OBL-LB-05]] | s.7(f)-(h) emergency use bounded | s.7(f),(g),(h) | P7 | 3 |
| [[OBL-LB-06]] | s.7(i) employment use bounded | s.7(i) | P7 | 3 |

## Controls
| ID | Title | Type | Owner |
|---|---|---|---|
| [[CTL-LB-01]] | Purpose register with lawful basis | Directive | Legal / Privacy |
| [[CTL-LB-02]] | Data minimisation review | Preventive | Product / Process Owner |
| [[CTL-LB-03]] | Employee data purpose boundary | Directive | HR / Legal |
| [[CTL-LB-04]] | Secondary-use & repurposing control | Preventive | Privacy / Data Governance |

## Test results in current cycle
```dataview
TABLE control, rating, tester, test_date FROM -"90 Templates" WHERE type = "control_test" AND contains(domain, [[D04 Lawful Basis & Purpose]])
```
