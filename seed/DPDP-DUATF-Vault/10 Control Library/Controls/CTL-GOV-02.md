---
type: control
control_id: CTL-GOV-02
title: Data protection policy suite
domain: "[[D01 Governance & Accountability]]"
control_type: Directive
nature: Manual
frequency: Annual
owner_role: DPO / Privacy Lead
obligations:
- "[[OBL-GOV-02]]"
iso27001_2022:
- '5.1'
- '5.34'
iso27701_2019:
- '6.2'
- 6.15.1.4
nist_csf_2:
- GV.PO-01
- GV.PO-02
tags:
- dpdp/control
- dpdp/D01
---

# CTL-GOV-02 - Data protection policy suite

Privacy policy (internal), retention policy, rights handling SOP, breach policy, vendor privacy standard, children's data standard; version-controlled, reviewed annually.

| Attribute | Value |
|---|---|
| Domain | [[D01 Governance & Accountability]] |
| Type | Directive |
| Nature | Manual |
| Frequency | Annual |
| Owner role | DPO / Privacy Lead |

## Obligations satisfied
- [[OBL-GOV-02]] Technical & organisational measures for compliance

## Test procedure
Inspect policies for DPDP coverage vs obligation register; check review dates.

## Evidence
- Policies with version history

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.1, 5.34 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 6.2, 6.15.1.4 |
| NIST CSF 2.0 | GV.PO-01, GV.PO-02 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-GOV-02]]
```
