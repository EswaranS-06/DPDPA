---
type: control
control_id: CTL-PWD-01
title: Lawful guardian verification
domain: "[[D07 Children & Persons with Disability]]"
control_type: Preventive
nature: Manual
frequency: Per case
owner_role: Ops
obligations:
- "[[OBL-PWD-01]]"
- "[[OBL-PWD-02]]"
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

# CTL-PWD-01 - Lawful guardian verification

Checklist to verify guardian appointment order (court/RPwD designated authority/National Trust LLC) before accepting consent.

| Attribute | Value |
|---|---|
| Domain | [[D07 Children & Persons with Disability]] |
| Type | Preventive |
| Nature | Manual |
| Frequency | Per case |
| Owner role | Ops |

## Obligations satisfied
- [[OBL-PWD-01]] Verifiable guardian consent (PwD)
- [[OBL-PWD-02]] Verify guardian appointment

## Test procedure
Sample guardian cases; verify orders on file.

## Evidence
- Orders
- Checklist

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.34 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.4 |
| NIST CSF 2.0 | PR.AA-02 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-PWD-01]]
```
