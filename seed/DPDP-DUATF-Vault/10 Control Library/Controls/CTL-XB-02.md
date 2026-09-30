---
type: control
control_id: CTL-XB-02
title: Data residency architecture
domain: "[[D14 Cross-Border Transfer & Localisation]]"
control_type: Preventive
nature: Automated
frequency: Continuous
owner_role: IT Architecture
obligations:
- "[[OBL-XB-03]]"
- "[[OBL-SDF-07]]"
- "[[LNK-CERT-02]]"
iso27001_2022:
- '5.23'
iso27701_2019:
- 7.5.1
nist_csf_2:
- PR.DS-01
tags:
- dpdp/control
- dpdp/D14
---

# CTL-XB-02 - Data residency architecture

Region pinning and technical controls for data required to stay in India (RBI payments, IRDAI, SEBI, Govt, SDF-specified, CERT-In logs).

| Attribute | Value |
|---|---|
| Domain | [[D14 Cross-Border Transfer & Localisation]] |
| Type | Preventive |
| Nature | Automated |
| Frequency | Continuous |
| Owner role | IT Architecture |

## Obligations satisfied
- [[OBL-XB-03]] Sectoral localisation prevails
- [[OBL-SDF-07]] Localisation of specified data
- [[LNK-CERT-02]] ICT logs 180 days within India

## Test procedure
Inspect cloud region config & replication.

## Evidence
- Architecture
- Config

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.23 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.5.1 |
| NIST CSF 2.0 | PR.DS-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-XB-02]]
```
