---
type: sector_overlay
sector_code: CAP
title: Capital Markets
covers: Stock brokers, depository participants, AMCs/MFs, RTAs, investment advisers, PMS, KRAs, listed companies
regulators:
- SEBI
- Stock exchanges
- Depositories (NSDL/CDSL)
- FIU-IND
- CERT-In
key_principals:
- Investor
- Joint holder
- Nominee
- Authorised person
- Designated person (PIT)
process_templates:
- "[[CAP-01 Account opening (trading-demat-MF)]]"
- "[[CAP-02 Order management & call recording]]"
- "[[CAP-03 Research, advisory & robo-advice]]"
- "[[CAP-04 Insider trading compliance (listed cos.)]]"
tags:
- dpdp/sector
- sector/cap
---

# SEC-CAP - Capital Markets

**Covers:** Stock brokers, depository participants, AMCs/MFs, RTAs, investment advisers, PMS, KRAs, listed companies

**Regulators:** SEBI, Stock exchanges, Depositories (NSDL/CDSL), FIU-IND, CERT-In

## Sector laws that run alongside DPDP (s.38: DPDP is in addition; s.16(2): stricter transfer rules survive)
| Law / instrument | Why it matters for personal data |
|---|---|
| SEBI Cybersecurity & Cyber Resilience Framework (CSCRF) 2024 | Cyber controls; data localisation expectations for REs |
| SEBI KYC / KRA regulations | KYC via KRAs |
| SEBI (Prohibition of Insider Trading) Regulations 2015 | Structured Digital Database of UPSI sharing - preserve >= 8 years |
| SEBI LODR 2015 | Shareholder communication |
| PMLA 2002 | Records & reporting |
| SEBI intermediary record-keeping requirements | Retention periods for brokers/DPs (verify current) |

## Localisation / cross-border
SEBI CSCRF expects REs to keep regulated data within India (verify scope for your RE category).

## Retention anchors (use in Retention Rules; reconciles s.8(7) 'retention required by law')
| Record | Period | Source | Confidence |
|---|---|---|---|
| Client KYC & transaction records | 5 years after relationship (PMLA); SEBI may prescribe longer | PMLA / SEBI | verify |
| PIT Structured Digital Database | >= 8 years | SEBI PIT Regs | high |
| Call recordings of orders | Per SEBI/exchange circulars | Exchange circulars | verify |

> Confidence `verify` means you must confirm the current text before citing it in a client deliverable.

## DPDP hotspots in this sector
- Order call recordings
- Nominee & joint holders
- Algorithmic advice (robo-advisers)
- Investor grievance via SCORES vs DPDP grievance

## Where assessments get stuck here
- KRA/CKYC data reused for marketing
- Distributor networks (MFDs, sub-brokers) as DFs vs processors

See also [[Stuck-Point Playbook]].

## Typical data principals
Investor, Joint holder, Nominee, Authorised person, Designated person (PIT)

## Sector process templates
- [[CAP-01 Account opening (trading-demat-MF)]] (Onboarding)
- [[CAP-02 Order management & call recording]] (Trading)
- [[CAP-03 Research, advisory & robo-advice]] (Advisory)
- [[CAP-04 Insider trading compliance (listed cos.)]] (Corporate)

## Plus common functions
All [[Process Catalogue Index|common-function templates]] (HR, finance, marketing, IT, admin, legal) also apply.
