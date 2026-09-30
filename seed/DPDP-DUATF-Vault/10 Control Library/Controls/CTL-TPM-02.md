---
type: control
control_id: CTL-TPM-02
title: Privacy due diligence before onboarding
domain: "[[D13 Processor & Third-Party Management]]"
control_type: Preventive
nature: Manual
frequency: Per onboarding
owner_role: Procurement / Security
obligations:
- "[[OBL-PRC-02]]"
iso27001_2022:
- '5.19'
- '5.21'
iso27701_2019:
- 7.2.6
nist_csf_2:
- GV.SC-06
tags:
- dpdp/control
- dpdp/D13
---

# CTL-TPM-02 - Privacy due diligence before onboarding

Risk-tiered questionnaire, certifications (ISO 27001/27701, SOC 2), data location, sub-processors before contract.

| Attribute | Value |
|---|---|
| Domain | [[D13 Processor & Third-Party Management]] |
| Type | Preventive |
| Nature | Manual |
| Frequency | Per onboarding |
| Owner role | Procurement / Security |

## Obligations satisfied
- [[OBL-PRC-02]] Processor oversight

## Test procedure
Sample 5 recent onboardings.

## Evidence
- DD records

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.19, 5.21 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.6 |
| NIST CSF 2.0 | GV.SC-06 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-TPM-02]]
```
