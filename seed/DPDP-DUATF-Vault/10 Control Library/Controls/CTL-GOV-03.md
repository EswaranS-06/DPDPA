---
type: control
control_id: CTL-GOV-03
title: Designated contact person / DPO published
domain: "[[D01 Governance & Accountability]]"
control_type: Directive
nature: Manual
frequency: On change
owner_role: DPO / Privacy Lead
obligations:
- "[[OBL-GOV-03]]"
- "[[OBL-GOV-04]]"
- "[[OBL-CON-03]]"
iso27001_2022:
- '5.5'
iso27701_2019:
- 6.3.1.1
- 7.3.3
nist_csf_2:
- GV.RR-02
tags:
- dpdp/control
- dpdp/D01
---

# CTL-GOV-03 - Designated contact person / DPO published

Designate DPO (SDF) or responsible person; publish business contact on website/app, notices and rights responses.

| Attribute | Value |
|---|---|
| Domain | [[D01 Governance & Accountability]] |
| Type | Directive |
| Nature | Manual |
| Frequency | On change |
| Owner role | DPO / Privacy Lead |

## Obligations satisfied
- [[OBL-GOV-03]] Publish contact of DPO / responsible person
- [[OBL-GOV-04]] Contact in every rights response
- [[OBL-CON-03]] Consent request language & contact

## Test procedure
Inspect website/app; sample 5 rights responses for contact details.

## Evidence
- Screenshots
- Designation letter
- Response samples

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.5 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 6.3.1.1, 7.3.3 |
| NIST CSF 2.0 | GV.RR-02 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-GOV-03]]
```
