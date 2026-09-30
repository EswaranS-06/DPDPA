---
type: control
control_id: CTL-CON-02
title: Consent ledger (proof of consent)
domain: "[[D06 Consent Lifecycle]]"
control_type: Preventive
nature: Automated
frequency: Continuous
owner_role: IT / Privacy
obligations:
- "[[OBL-CON-06]]"
- "[[OBL-CON-04]]"
iso27001_2022:
- '8.15'
- '5.33'
iso27701_2019:
- 7.2.8
- 7.2.4
nist_csf_2:
- PR.DS-01
- PR.PS-04
tags:
- dpdp/control
- dpdp/D06
---

# CTL-CON-02 - Consent ledger (proof of consent)

Central immutable log: principal ID, purpose(s), notice version, channel, timestamp, method, withdrawal events, CM reference.

| Attribute | Value |
|---|---|
| Domain | [[D06 Consent Lifecycle]] |
| Type | Preventive |
| Nature | Automated |
| Frequency | Continuous |
| Owner role | IT / Privacy |

## Obligations satisfied
- [[OBL-CON-06]] Proof of notice and consent
- [[OBL-CON-04]] Withdrawal with comparable ease

## Test procedure
Sample 25 principals; verify complete ledger records; test tamper protection.

## Evidence
- Ledger extract
- Integrity controls

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 8.15, 5.33 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.8, 7.2.4 |
| NIST CSF 2.0 | PR.DS-01, PR.PS-04 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-CON-02]]
```
