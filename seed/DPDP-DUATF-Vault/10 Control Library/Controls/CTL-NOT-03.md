---
type: control
control_id: CTL-NOT-03
title: Multilingual notice availability
domain: "[[D05 Notice]]"
control_type: Preventive
nature: Manual
frequency: Annual
owner_role: Marketing / Privacy
obligations:
- "[[OBL-NOT-05]]"
- "[[OBL-CON-03]]"
iso27001_2022:
- '5.34'
iso27701_2019:
- 7.3.3
nist_csf_2:
- GV.PO-01
tags:
- dpdp/control
- dpdp/D05
---

# CTL-NOT-03 - Multilingual notice availability

Notices available in English + Eighth Schedule languages relevant to customer base (based on geography/channel), with language selector.

| Attribute | Value |
|---|---|
| Domain | [[D05 Notice]] |
| Type | Preventive |
| Nature | Manual |
| Frequency | Annual |
| Owner role | Marketing / Privacy |

## Obligations satisfied
- [[OBL-NOT-05]] Language option
- [[OBL-CON-03]] Consent request language & contact

## Test procedure
Check language coverage vs customer geography data.

## Evidence
- Language versions

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.34 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.3.3 |
| NIST CSF 2.0 | GV.PO-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-NOT-03]]
```
