---
type: domain
domain_id: D07
title: Children & Persons with Disability
obligation_count: 8
control_count: 5
tags:
- dpdp/domain
---

# D07 - Children & Persons with Disability

Age-gating, verifiable parental/guardian consent, no tracking/targeted ads, Fourth Schedule.

## Obligations
| ID | Title | Source | Penalty | Phase |
|---|---|---|---|---|
| [[OBL-CHD-01]] | Verifiable parental consent | s.9(1) R10 | P3 | 3 |
| [[OBL-CHD-02]] | Verify parent is identifiable adult | s.9(1) R10(1) | P3 | 3 |
| [[OBL-CHD-03]] | Age-gating / child identification | s.9 R10 | P3 | 3 |
| [[OBL-CHD-04]] | No detrimental processing | s.9(2) | P3 | 3 |
| [[OBL-CHD-05]] | No tracking, behavioural monitoring, targeted ads | s.9(3) R12 | P3 | 3 |
| [[OBL-CHD-06]] | Fourth Schedule exemption conditions | s.9(4) R12 | P3 | 3 |
| [[OBL-PWD-01]] | Verifiable guardian consent (PwD) | s.9(1) R11 | P3 | 3 |
| [[OBL-PWD-02]] | Verify guardian appointment | s.9(1) R11 | P3 | 3 |

## Controls
| ID | Title | Type | Owner |
|---|---|---|---|
| [[CTL-CHD-01]] | Age assurance / age-gate | Preventive | Product |
| [[CTL-CHD-02]] | Verifiable parental consent workflow | Preventive | Product / Ops |
| [[CTL-CHD-03]] | Child-safe processing configuration | Preventive | Product / Ad-tech |
| [[CTL-CHD-04]] | Fourth Schedule exemption scoping | Directive | Legal |
| [[CTL-PWD-01]] | Lawful guardian verification | Preventive | Ops |

## Test results in current cycle
```dataview
TABLE control, rating, tester, test_date FROM -"90 Templates" WHERE type = "control_test" AND contains(domain, [[D07 Children & Persons with Disability]])
```
