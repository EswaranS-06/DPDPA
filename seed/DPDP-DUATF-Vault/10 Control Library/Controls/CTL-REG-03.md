---
type: control
control_id: CTL-REG-03
title: CERT-In PoC & reporting channel
domain: "[[D16 Regulatory Interface]]"
control_type: Directive
nature: Manual
frequency: Annual
owner_role: CISO
obligations:
- "[[LNK-CERT-04]]"
- "[[LNK-CERT-01]]"
iso27001_2022:
- '5.5'
iso27701_2019: []
nist_csf_2:
- RS.CO-02
tags:
- dpdp/control
- dpdp/D16
---

# CTL-REG-03 - CERT-In PoC & reporting channel

Designated CERT-In PoC and tested reporting channel.

| Attribute | Value |
|---|---|
| Domain | [[D16 Regulatory Interface]] |
| Type | Directive |
| Nature | Manual |
| Frequency | Annual |
| Owner role | CISO |

## Obligations satisfied
- [[LNK-CERT-04]] CERT-In Point of Contact
- [[LNK-CERT-01]] CERT-In incident report within 6 hours

## Test procedure
Inspect PoC filing.

## Evidence
- Filing

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.5 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | - |
| NIST CSF 2.0 | RS.CO-02 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-REG-03]]
```
