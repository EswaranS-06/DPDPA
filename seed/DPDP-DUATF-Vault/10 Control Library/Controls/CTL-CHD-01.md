---
type: control
control_id: CTL-CHD-01
title: Age assurance / age-gate
domain: "[[D07 Children & Persons with Disability]]"
control_type: Preventive
nature: Automated
frequency: Continuous
owner_role: Product
obligations:
- "[[OBL-CHD-03]]"
iso27001_2022:
- '5.34'
iso27701_2019:
- 7.2.3
nist_csf_2:
- PR.AA-02
tags:
- dpdp/control
- dpdp/D07
---

# CTL-CHD-01 - Age assurance / age-gate

Risk-based age assurance at onboarding (declaration + signals + verification where high risk).

| Attribute | Value |
|---|---|
| Domain | [[D07 Children & Persons with Disability]] |
| Type | Preventive |
| Nature | Automated |
| Frequency | Continuous |
| Owner role | Product |

## Obligations satisfied
- [[OBL-CHD-03]] Age-gating / child identification

## Test procedure
Attempt onboarding as minor on 2 channels.

## Evidence
- Age-gate design
- Test results

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.34 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.3 |
| NIST CSF 2.0 | PR.AA-02 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-CHD-01]]
```
