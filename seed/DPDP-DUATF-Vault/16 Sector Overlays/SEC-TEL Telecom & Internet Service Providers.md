---
type: sector_overlay
sector_code: TEL
title: Telecom & Internet Service Providers
covers: Telcos, ISPs, VNOs, CPaaS, data centres
regulators:
- DoT
- TRAI
- CERT-In
- TEC
key_principals:
- Subscriber
- Retailer/POS
- Called/calling party
- Enterprise end-users
process_templates:
- "[[TEL-01 SIM-connection activation & KYC]]"
- "[[TEL-02 Network operations, CDR-IPDR & location]]"
- "[[TEL-03 Billing, plans & value-added services]]"
- "[[TEL-04 CPaaS-SMS-voice for enterprises]]"
tags:
- dpdp/sector
- sector/tel
---

# SEC-TEL - Telecom & Internet Service Providers

**Covers:** Telcos, ISPs, VNOs, CPaaS, data centres

**Regulators:** DoT, TRAI, CERT-In, TEC

## Sector laws that run alongside DPDP (s.38: DPDP is in addition; s.16(2): stricter transfer rules survive)
| Law / instrument | Why it matters for personal data |
|---|---|
| Telecommunications Act 2023 | Authorisation, user identification, interception |
| Telecom Cyber Security Rules 2024 | Security obligations, incident reporting |
| DoT Unified Licence / authorisation conditions | CDR/IPDR retention (2 years), subscriber data restrictions abroad |
| Telecom (Procedures & Safeguards for Lawful Interception) Rules 2024 | Interception records |
| TRAI TCCCPR 2018 (as amended) | Commercial communications, DLT, consent registers |
| CERT-In Directions 2022 | Data centre/VPS/cloud/VPN providers: subscriber KYC records 5 years |

## Localisation / cross-border
Licence conditions restrict transfer of subscriber/user accounting information outside India (verify clause).

## Retention anchors (use in Retention Rules; reconciles s.8(7) 'retention required by law')
| Record | Period | Source | Confidence |
|---|---|---|---|
| CDR / IPDR | 2 years | DoT UL amendment Dec 2021 | high |
| Customer Acquisition Forms / KYC | Per DoT instructions | DoT | verify |
| VPN/cloud subscriber KYC | 5 years after cancellation | CERT-In Directions 2022 | high |

> Confidence `verify` means you must confirm the current text before citing it in a client deliverable.

## DPDP hotspots in this sector
- Subscriber KYC (Aadhaar e-KYC) at POS/retailers
- Location & traffic data
- Lawful interception secrecy
- CPaaS acting for enterprises (processor)
- Spam/fraud analytics on calls

## Where assessments get stuck here
- Retailer network collecting KYC - processor contracts at scale
- Consent registers under TCCCPR vs DPDP consent ledger - unify

See also [[Stuck-Point Playbook]].

## Typical data principals
Subscriber, Retailer/POS, Called/calling party, Enterprise end-users

## Sector process templates
- [[TEL-01 SIM-connection activation & KYC]] (Sales)
- [[TEL-02 Network operations, CDR-IPDR & location]] (Network)
- [[TEL-03 Billing, plans & value-added services]] (Commercial)
- [[TEL-04 CPaaS-SMS-voice for enterprises]] (Enterprise)

## Plus common functions
All [[Process Catalogue Index|common-function templates]] (HR, finance, marketing, IT, admin, legal) also apply.
