---
type: control
control_id: CTL-RGT-02
title: Rights handling SOP & SLA tracking
domain: "[[D12 Rights & Grievance]]"
control_type: Directive
nature: IT-dependent manual
frequency: Weekly ageing
owner_role: DPO
obligations:
- "[[OBL-RGT-02]]"
- "[[OBL-RGT-03]]"
- "[[OBL-RGT-04]]"
- "[[OBL-RGT-05]]"
- "[[OBL-RGT-06]]"
- "[[OBL-RGT-08]]"
iso27001_2022:
- '5.34'
iso27701_2019:
- 7.3.6
- 7.3.9
nist_csf_2:
- RS.MA-01
tags:
- dpdp/control
- dpdp/D12
---

# CTL-RGT-02 - Rights handling SOP & SLA tracking

SOP per right (access, correction, erasure, nomination, grievance) with internal SLA well within 90 days, ageing report and escalation.

| Attribute | Value |
|---|---|
| Domain | [[D12 Rights & Grievance]] |
| Type | Directive |
| Nature | IT-dependent manual |
| Frequency | Weekly ageing |
| Owner role | DPO |

## Obligations satisfied
- [[OBL-RGT-02]] Right to access
- [[OBL-RGT-03]] Right to correction, completion, updating
- [[OBL-RGT-04]] Right to erasure
- [[OBL-RGT-05]] Grievance redressal within 90 days
- [[OBL-RGT-06]] Right to nominate
- [[OBL-RGT-08]] Handle requests considering Data Principal duties

## Test procedure
Sample 15 requests; verify SLA, completeness, response content.

## Evidence
- Request log
- Responses

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.34 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.3.6, 7.3.9 |
| NIST CSF 2.0 | RS.MA-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-RGT-02]]
```
