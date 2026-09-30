---
type: control
control_id: CTL-CMO-02
title: Consent Manager platform controls
domain: "[[D18 Consent Manager Operations]]"
control_type: Preventive
nature: Automated
frequency: Continuous
owner_role: CTO
obligations:
- "[[OBL-CMO-02]]"
- "[[OBL-CMO-03]]"
- "[[OBL-CMO-04]]"
iso27001_2022:
- '8.24'
- '5.33'
iso27701_2019:
- 7.2.8
nist_csf_2:
- PR.DS-01
tags:
- dpdp/control
- dpdp/D18
---

# CTL-CMO-02 - Consent Manager platform controls

Zero-knowledge data handling, interoperable APIs, 7-year records with DP machine-readable access, no sub-contracting, ISMS.

| Attribute | Value |
|---|---|
| Domain | [[D18 Consent Manager Operations]] |
| Type | Preventive |
| Nature | Automated |
| Frequency | Continuous |
| Owner role | CTO |

## Obligations satisfied
- [[OBL-CMO-02]] Platform & data non-readability
- [[OBL-CMO-03]] Records for 7 years
- [[OBL-CMO-04]] No sub-contracting; security; fiduciary capacity

## Test procedure
Architecture review; record retention test.

## Evidence
- Architecture
- Retention config

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 8.24, 5.33 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.8 |
| NIST CSF 2.0 | PR.DS-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-CMO-02]]
```
