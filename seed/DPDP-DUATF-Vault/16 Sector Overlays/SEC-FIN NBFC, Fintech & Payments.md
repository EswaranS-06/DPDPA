---
type: sector_overlay
sector_code: FIN
title: NBFC, Fintech & Payments
covers: NBFCs, digital lenders & LSPs, payment aggregators/gateways, PPI wallets, account aggregators, BNPL, neo-banks
regulators:
- RBI
- NPCI
- FIU-IND
- CERT-In
key_principals:
- Borrower
- Wallet user
- Merchant & merchant staff
- Payer/payee
- Co-borrower
process_templates:
- "[[FIN-01 Digital onboarding & KYC in app]]"
- "[[FIN-02 Underwriting with alternate data]]"
- "[[FIN-03 Servicing, repayment & collections]]"
- "[[FIN-04 Merchant onboarding & settlement]]"
- "[[FIN-05 Payment processing & tokenisation]]"
- "[[FIN-06 Wallet - Account Aggregator consent flows]]"
tags:
- dpdp/sector
- sector/fin
---

# SEC-FIN - NBFC, Fintech & Payments

**Covers:** NBFCs, digital lenders & LSPs, payment aggregators/gateways, PPI wallets, account aggregators, BNPL, neo-banks

**Regulators:** RBI, NPCI, FIU-IND, CERT-In

## Sector laws that run alongside DPDP (s.38: DPDP is in addition; s.16(2): stricter transfer rules survive)
| Law / instrument | Why it matters for personal data |
|---|---|
| RBI (Digital Lending) Directions 2025 | Need-based data collection with explicit consent; no access to contacts/media/call logs; data storage in India; LSP accountability (verify current text) |
| RBI Master Direction - Payment Aggregators & Payment Gateways | Merchant KYC, no card storage, data localisation |
| RBI Master Direction - PPIs | Wallet KYC levels |
| RBI Master Direction - KYC 2016 | CDD |
| PMLA 2002 | Records & reporting |
| RBI - Storage of Payment System Data 2018 | Localisation |
| RBI NBFC-AA Master Direction | Consent artefact framework for FIPs/FIUs |

## Localisation / cross-border
Payment data and digital-lending data stored in India. LSPs/partners must follow RE's data policy.

## Retention anchors (use in Retention Rules; reconciles s.8(7) 'retention required by law')
| Record | Period | Source | Confidence |
|---|---|---|---|
| KYC & transaction records | 5 years after relationship ends | PMLA Rules | high |
| Digital-lending borrower data | As per RE policy; delete on request subject to law | RBI Digital Lending Directions | verify |

> Confidence `verify` means you must confirm the current text before citing it in a client deliverable.

## DPDP hotspots in this sector
- App permissions (contacts, SMS, location, media)
- LSP/partner apps acting as processors but using data for own purposes
- Alternate-data credit scoring & AI (s.8(3), profiling)
- SDK sprawl in apps (analytics, attribution, fraud)
- Co-lending: two DFs

## Where assessments get stuck here
- Reading SMS for underwriting - needs explicit consent & minimisation
- Partners' consent screens not controlled by RE
- Fraud/risk use as s.7 vs consent debate - document legitimacy under law (PMLA/RBI)

See also [[Stuck-Point Playbook]].

## Typical data principals
Borrower, Wallet user, Merchant & merchant staff, Payer/payee, Co-borrower

## Sector process templates
- [[FIN-01 Digital onboarding & KYC in app]] (Onboarding)
- [[FIN-02 Underwriting with alternate data]] (Lending)
- [[FIN-03 Servicing, repayment & collections]] (Lending)
- [[FIN-04 Merchant onboarding & settlement]] (Payments)
- [[FIN-05 Payment processing & tokenisation]] (Payments)
- [[FIN-06 Wallet - Account Aggregator consent flows]] (Wallets / AA)

## Plus common functions
All [[Process Catalogue Index|common-function templates]] (HR, finance, marketing, IT, admin, legal) also apply.
