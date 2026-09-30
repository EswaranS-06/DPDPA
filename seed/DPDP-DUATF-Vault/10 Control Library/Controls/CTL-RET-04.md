---
type: control
control_id: CTL-RET-04
title: Processor erasure certification
domain: "[[D11 Retention & Erasure]]"
control_type: Corrective
nature: Manual
frequency: Per event
owner_role: Procurement / Privacy
obligations:
- "[[OBL-RET-02]]"
- "[[OBL-PRC-03]]"
iso27001_2022:
- '5.20'
- '8.10'
iso27701_2019:
- 8.4.2
nist_csf_2:
- GV.SC-10
tags:
- dpdp/control
- dpdp/D11
---

# CTL-RET-04 - Processor erasure certification

Processors return/erase data at contract end or instruction; certificate obtained.

| Attribute | Value |
|---|---|
| Domain | [[D11 Retention & Erasure]] |
| Type | Corrective |
| Nature | Manual |
| Frequency | Per event |
| Owner role | Procurement / Privacy |

## Obligations satisfied
- [[OBL-RET-02]] Processors erase too
- [[OBL-PRC-03]] Flow-down withdrawal & erasure

## Test procedure
Sample 3 terminated vendors for certificates.

## Evidence
- Certificates

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.20, 8.10 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 8.4.2 |
| NIST CSF 2.0 | GV.SC-10 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-RET-04]]
```
