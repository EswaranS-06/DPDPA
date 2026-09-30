---
type: control
control_id: CTL-CHD-02
title: Verifiable parental consent workflow
domain: "[[D07 Children & Persons with Disability]]"
control_type: Preventive
nature: IT-dependent manual
frequency: Per onboarding
owner_role: Product / Ops
obligations:
- "[[OBL-CHD-01]]"
- "[[OBL-CHD-02]]"
iso27001_2022:
- '5.34'
iso27701_2019:
- 7.2.4
nist_csf_2:
- PR.AA-02
tags:
- dpdp/control
- dpdp/D07
---

# CTL-CHD-02 - Verifiable parental consent workflow

Parent identity/age verified via held records, voluntary details or DigiLocker/authorised virtual token; parent-child link recorded.

| Attribute | Value |
|---|---|
| Domain | [[D07 Children & Persons with Disability]] |
| Type | Preventive |
| Nature | IT-dependent manual |
| Frequency | Per onboarding |
| Owner role | Product / Ops |

## Obligations satisfied
- [[OBL-CHD-01]] Verifiable parental consent
- [[OBL-CHD-02]] Verify parent is identifiable adult

## Test procedure
Sample 10 child accounts; verify parent verification evidence.

## Evidence
- Workflow
- Verification logs

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.34 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.4 |
| NIST CSF 2.0 | PR.AA-02 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-CHD-02]]
```
