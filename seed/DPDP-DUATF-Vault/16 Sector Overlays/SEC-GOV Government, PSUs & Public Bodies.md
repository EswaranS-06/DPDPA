---
type: sector_overlay
sector_code: GOV
title: Government, PSUs & Public Bodies
covers: Ministries, departments, State agencies, municipal bodies, PSUs, statutory boards
regulators:
- MeitY
- UIDAI
- CAG
- CERT-In
- NIC
key_principals:
- Citizen
- Beneficiary
- Applicant
- Employee/pensioner
process_templates:
- "[[GOV-01 Beneficiary registration & DBT]]"
- "[[GOV-02 Certificates, licences & permits]]"
- "[[GOV-03 Regulatory inspection & enforcement]]"
- "[[GOV-04 PSU customer business (e.g. banking, energy retail)]]"
tags:
- dpdp/sector
- sector/gov
---

# SEC-GOV - Government, PSUs & Public Bodies

**Covers:** Ministries, departments, State agencies, municipal bodies, PSUs, statutory boards

**Regulators:** MeitY, UIDAI, CAG, CERT-In, NIC

## Sector laws that run alongside DPDP (s.38: DPDP is in addition; s.16(2): stricter transfer rules survive)
| Law / instrument | Why it matters for personal data |
|---|---|
| DPDP s.7(b),(c), s.17(2)(a), s.17(4), Rule 5 & Second Schedule | State processing standards & exemptions |
| Aadhaar Act 2016 & Authentication Regulations 2021 | Purpose limitation, auth logs, Aadhaar Data Vault |
| Aadhaar Authentication for Good Governance Rules 2020 (as amended) | Aadhaar auth for notified purposes |
| RTI Act 2005 s.8(1)(j) (amended by DPDP s.44(3)) | Personal information exempt from disclosure |
| Public Records Act 1993 | Record retention & destruction |
| MeitY GI Cloud / empanelled CSPs | Hosting of Government data |

## Localisation / cross-border
Government data typically on NIC/MeitY-empanelled clouds in India.

## Retention anchors (use in Retention Rules; reconciles s.8(7) 'retention required by law')
| Record | Period | Source | Confidence |
|---|---|---|---|
| Aadhaar authentication logs | 2 years online, then archived 5 years (verify) | Aadhaar Auth Regulations | verify |
| Public records | Per department record retention schedules | Public Records Act/Rules | verify |

> Confidence `verify` means you must confirm the current text before citing it in a client deliverable.

## DPDP hotspots in this sector
- Scheme beneficiary databases (DBT) - s.7(b) + Second Schedule
- Aadhaar seeding & masking
- Data sharing across departments
- RTI disclosures now exempt personal info
- PSU commercial activities are NOT State functions - consent applies

## Where assessments get stuck here
- Legacy scheme data with no notice/intimation
- Outsourced data-entry operators & CSCs

See also [[Stuck-Point Playbook]].

## Typical data principals
Citizen, Beneficiary, Applicant, Employee/pensioner

## Sector process templates
- [[GOV-01 Beneficiary registration & DBT]] (Schemes)
- [[GOV-02 Certificates, licences & permits]] (Services)
- [[GOV-03 Regulatory inspection & enforcement]] (Enforcement)
- [[GOV-04 PSU customer business (e.g. banking, energy retail)]] (PSU Commercial)

## Plus common functions
All [[Process Catalogue Index|common-function templates]] (HR, finance, marketing, IT, admin, legal) also apply.
