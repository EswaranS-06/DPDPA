---
type: domain
domain_id: D15
title: Significant Data Fiduciary
obligation_count: 7
control_count: 3
tags:
- dpdp/domain
---

# D15 - Significant Data Fiduciary

DPO in India, independent auditor, annual DPIA & audit, algorithmic due diligence, localisation.

## Obligations
| ID | Title | Source | Penalty | Phase |
|---|---|---|---|---|
| [[OBL-SDF-01]] | Appoint DPO based in India | s.10(2)(a) | P4 | 3 |
| [[OBL-SDF-02]] | Appoint independent data auditor | s.10(2)(b) | P4 | 3 |
| [[OBL-SDF-03]] | Annual DPIA | s.10(2)(c)(i) R13(1) | P4 | 3 |
| [[OBL-SDF-04]] | Annual audit | s.10(2)(c)(ii) R13(1) | P4 | 3 |
| [[OBL-SDF-05]] | Report significant observations to Board | s.10(2) R13(2) | P4 | 3 |
| [[OBL-SDF-06]] | Algorithmic due diligence | s.10(2)(c)(iii) R13(3) | P4 | 3 |
| [[OBL-SDF-07]] | Localisation of specified data | s.10(2)(c)(iii) R13(4) | P4 | 3 |

## Controls
| ID | Title | Type | Owner |
|---|---|---|---|
| [[CTL-SDF-01]] | SDF governance (DPO & auditor) | Directive | Board / Company Secretary |
| [[CTL-SDF-02]] | Annual DPIA & audit cycle | Detective | DPO |
| [[CTL-SDF-03]] | Algorithm inventory & risk assessment | Detective | Data Science / Risk |

## Test results in current cycle
```dataview
TABLE control, rating, tester, test_date FROM -"90 Templates" WHERE type = "control_test" AND contains(domain, [[D15 Significant Data Fiduciary]])
```
