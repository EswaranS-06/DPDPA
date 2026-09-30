---
type: control
control_id: CTL-TPM-04
title: Ongoing vendor monitoring
domain: "[[D13 Processor & Third-Party Management]]"
control_type: Detective
nature: Manual
frequency: Annual
owner_role: Vendor Risk
obligations:
- "[[OBL-PRC-02]]"
iso27001_2022:
- '5.22'
iso27701_2019:
- 7.2.6
nist_csf_2:
- GV.SC-07
tags:
- dpdp/control
- dpdp/D13
---

# CTL-TPM-04 - Ongoing vendor monitoring

Annual reassessment for critical vendors; SOC/ISO report review; right-to-audit exercised risk-based.

| Attribute | Value |
|---|---|
| Domain | [[D13 Processor & Third-Party Management]] |
| Type | Detective |
| Nature | Manual |
| Frequency | Annual |
| Owner role | Vendor Risk |

## Obligations satisfied
- [[OBL-PRC-02]] Processor oversight

## Test procedure
Inspect last reviews of top 10 vendors.

## Evidence
- Review files

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.22 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.6 |
| NIST CSF 2.0 | GV.SC-07 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-TPM-04]]
```
