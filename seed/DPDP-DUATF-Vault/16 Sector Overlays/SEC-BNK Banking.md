---
type: sector_overlay
sector_code: BNK
title: Banking
covers: Scheduled commercial banks, small finance banks, payments banks, co-operative banks
regulators:
- RBI
- FIU-IND
- NPCI (for payment systems)
- CERT-In
- Banking Ombudsman (RBI Integrated Ombudsman)
key_principals:
- Customer
- Prospect
- Minor customer & guardian
- Nominee
- Guarantor / co-applicant
- Beneficiary / payee
- Merchant
- Employee
process_templates:
- "[[BNK-01 Account opening & KYC (branch, digital, V-CIP)]]"
- "[[BNK-02 Deposits, payments & transactions]]"
- "[[BNK-03 Loan origination, underwriting & disbursal]]"
- "[[BNK-04 Collections & recovery]]"
- "[[BNK-05 Credit-debit card issuance & usage]]"
- "[[BNK-06 AML monitoring & regulatory reporting]]"
- "[[BNK-07 Insurance, MF & investment distribution]]"
- "[[BNK-08 Branch operations, lockers & walk-ins]]"
tags:
- dpdp/sector
- sector/bnk
---

# SEC-BNK - Banking

**Covers:** Scheduled commercial banks, small finance banks, payments banks, co-operative banks

**Regulators:** RBI, FIU-IND, NPCI (for payment systems), CERT-In, Banking Ombudsman (RBI Integrated Ombudsman)

## Sector laws that run alongside DPDP (s.38: DPDP is in addition; s.16(2): stricter transfer rules survive)
| Law / instrument | Why it matters for personal data |
|---|---|
| Banking Regulation Act 1949 | Licensing; customer confidentiality expectations |
| RBI Master Direction - KYC 2016 (as amended) | CDD, V-CIP, periodic KYC updation, record keeping |
| PMLA 2002 & PML (Maintenance of Records) Rules 2005 | Transaction & identity records; STR/CTR reporting to FIU-IND |
| RBI - Storage of Payment System Data (Apr 2018) + FAQs | Entire payment data stored only in India |
| RBI Master Direction - IT Governance, Risk, Controls & Assurance Practices 2023 | IT/cyber governance, incident reporting |
| RBI Master Direction - Outsourcing of IT Services 2023 | Vendor oversight incl. cloud; right to audit; data location |
| RBI Cyber Security Framework for Banks 2016 & later circulars | Cyber incident reporting to RBI (within 2-6 hours per circulars) |
| Credit Information Companies (Regulation) Act 2005 & Rules 2006 | Bureau reporting accuracy, access & correction |
| RBI Master Direction - NBFC-Account Aggregator 2016 | Consent artefacts for financial data sharing |
| RBI Card-on-File Tokenisation directions | Merchants/PAs may not store card data (CoF) - tokens |
| Payment and Settlement Systems Act 2007 | Payment system operator obligations |

## Localisation / cross-border
Payment system data must be stored only in India (RBI 2018). Outsourcing/cloud: RBI supervisory access regardless of location. DPDP s.16(2) keeps these stricter rules alive.

## Retention anchors (use in Retention Rules; reconciles s.8(7) 'retention required by law')
| Record | Period | Source | Confidence |
|---|---|---|---|
| KYC & transaction records | 5 years after end of business relationship / transaction | PMLA Rules r.3 & 9; RBI KYC MD | high |
| Payment system data | Stored in India; retention as per RBI & PMLA | RBI Apr 2018 | high |
| Books of account | 8 years | Companies Act s.128(5) | high |
| Call recordings (telesales/collections) | Per RBI/internal policy - commonly >= 3 months to years | RBI fair practices / internal | verify |
| CCTV at branches/ATMs | Per RBI/State police guidance - commonly 90 days | RBI circulars / police orders | verify |

> Confidence `verify` means you must confirm the current text before citing it in a client deliverable.

## DPDP hotspots in this sector
- Legacy customers with no DPDP-grade consent (massive s.5(2) legacy notice)
- Cross-sell/marketing using KYC data without separate consent
- DSA/DST/agents and fintech partners acting as processors or co-DFs
- Account Aggregator & bureau sharing (s.8(3) accuracy)
- Children: minor accounts & guardian consent
- Nominee data (nominee is a DP)
- Collection agents misuse of contact lists

## Where assessments get stuck here
- PMLA/KYC retention overrides erasure requests - document 'retention required by law' responses
- Core banking has no purpose-level consent flags - implement consent layer outside CBS
- Hundreds of vendors - tier them; start with those holding bulk PD
- Paper account-opening forms in branches digitised by back office - map the digitisation point

See also [[Stuck-Point Playbook]].

## Typical data principals
Customer, Prospect, Minor customer & guardian, Nominee, Guarantor / co-applicant, Beneficiary / payee, Merchant, Employee

## Sector process templates
- [[BNK-01 Account opening & KYC (branch, digital, V-CIP)]] (Retail Banking)
- [[BNK-02 Deposits, payments & transactions]] (Retail Banking)
- [[BNK-03 Loan origination, underwriting & disbursal]] (Lending)
- [[BNK-04 Collections & recovery]] (Lending)
- [[BNK-05 Credit-debit card issuance & usage]] (Cards)
- [[BNK-06 AML monitoring & regulatory reporting]] (Risk & Compliance)
- [[BNK-07 Insurance, MF & investment distribution]] (Wealth & Third-party products)
- [[BNK-08 Branch operations, lockers & walk-ins]] (Branch Ops)

## Plus common functions
All [[Process Catalogue Index|common-function templates]] (HR, finance, marketing, IT, admin, legal) also apply.
