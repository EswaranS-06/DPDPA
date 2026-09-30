---
type: control
control_id: CTL-SDF-01
title: SDF governance (DPO & auditor)
domain: "[[D15 Significant Data Fiduciary]]"
control_type: Directive
nature: Manual
frequency: On notification; annual
owner_role: Board / Company Secretary
obligations:
- "[[OBL-SDF-01]]"
- "[[OBL-SDF-02]]"
iso27001_2022:
- '5.2'
- '5.35'
iso27701_2019:
- 6.3.1.1
nist_csf_2:
- GV.RR-01
tags:
- dpdp/control
- dpdp/D15
---

# CTL-SDF-01 - SDF governance (DPO & auditor)

Board resolution appointing India-based DPO reporting to board; independent data auditor with independence checks.

| Attribute | Value |
|---|---|
| Domain | [[D15 Significant Data Fiduciary]] |
| Type | Directive |
| Nature | Manual |
| Frequency | On notification; annual |
| Owner role | Board / Company Secretary |

## Obligations satisfied
- [[OBL-SDF-01]] Appoint DPO based in India
- [[OBL-SDF-02]] Appoint independent data auditor

## Test procedure
Inspect resolutions and independence declarations.

## Evidence
- Resolutions

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.2, 5.35 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 6.3.1.1 |
| NIST CSF 2.0 | GV.RR-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-SDF-01]]
```
