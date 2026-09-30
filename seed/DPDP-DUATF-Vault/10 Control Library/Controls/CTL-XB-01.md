---
type: control
control_id: CTL-XB-01
title: Transfer register & negative-list check
domain: "[[D14 Cross-Border Transfer & Localisation]]"
control_type: Detective
nature: Manual
frequency: Quarterly + on notification
owner_role: Privacy / Legal
obligations:
- "[[OBL-XB-01]]"
- "[[OBL-XB-02]]"
- "[[OBL-XB-03]]"
iso27001_2022:
- '5.14'
- '5.23'
iso27701_2019:
- 7.5.1
- 7.5.2
- 7.5.3
nist_csf_2:
- GV.SC-04
tags:
- dpdp/control
- dpdp/D14
---

# CTL-XB-01 - Transfer register & negative-list check

Register of cross-border transfers (vendor, country, data, purpose, basis, safeguards) checked against notified restricted list and sector localisation.

| Attribute | Value |
|---|---|
| Domain | [[D14 Cross-Border Transfer & Localisation]] |
| Type | Detective |
| Nature | Manual |
| Frequency | Quarterly + on notification |
| Owner role | Privacy / Legal |

## Obligations satisfied
- [[OBL-XB-01]] No transfer to restricted countries
- [[OBL-XB-02]] Foreign-State access conditions
- [[OBL-XB-03]] Sectoral localisation prevails

## Test procedure
Reconcile transfer register with cloud regions/vendor locations.

## Evidence
- Transfer register

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.14, 5.23 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.5.1, 7.5.2, 7.5.3 |
| NIST CSF 2.0 | GV.SC-04 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-XB-01]]
```
