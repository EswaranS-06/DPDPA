---
type: control
control_id: CTL-CHD-03
title: Child-safe processing configuration
domain: "[[D07 Children & Persons with Disability]]"
control_type: Preventive
nature: Automated
frequency: Continuous
owner_role: Product / Ad-tech
obligations:
- "[[OBL-CHD-04]]"
- "[[OBL-CHD-05]]"
iso27001_2022:
- '5.34'
- '8.9'
iso27701_2019:
- 7.4.2
nist_csf_2:
- PR.PS-01
tags:
- dpdp/control
- dpdp/D07
---

# CTL-CHD-03 - Child-safe processing configuration

For child accounts: tracking/behavioural analytics & targeted ads disabled at SDK/ad-server level; profiling blocked.

| Attribute | Value |
|---|---|
| Domain | [[D07 Children & Persons with Disability]] |
| Type | Preventive |
| Nature | Automated |
| Frequency | Continuous |
| Owner role | Product / Ad-tech |

## Obligations satisfied
- [[OBL-CHD-04]] No detrimental processing
- [[OBL-CHD-05]] No tracking, behavioural monitoring, targeted ads

## Test procedure
Inspect SDK/ad config; network capture on child account.

## Evidence
- Config
- Traffic capture

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.34, 8.9 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.4.2 |
| NIST CSF 2.0 | PR.PS-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-CHD-03]]
```
