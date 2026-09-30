---
type: sector_overlay
sector_code: ECR
title: E-commerce & Retail
covers: Marketplaces, D2C brands, quick-commerce, omnichannel retail, FMCG consumer programmes
regulators:
- Department of Consumer Affairs / CCPA
- RBI (payments)
- CERT-In
key_principals:
- Customer
- Guest checkout buyer
- Gift recipient
- Seller (individual)
- Delivery partner
- Store visitor
process_templates:
- "[[ECR-01 Customer registration & profile]]"
- "[[ECR-02 Order, payment, fulfilment & returns]]"
- "[[ECR-03 Personalisation, ads & retargeting]]"
- "[[ECR-04 In-store POS, loyalty & CCTV]]"
- "[[ECR-05 Fraud prevention & reviews]]"
tags:
- dpdp/sector
- sector/ecr
---

# SEC-ECR - E-commerce & Retail

**Covers:** Marketplaces, D2C brands, quick-commerce, omnichannel retail, FMCG consumer programmes

**Regulators:** Department of Consumer Affairs / CCPA, RBI (payments), CERT-In

## Sector laws that run alongside DPDP (s.38: DPDP is in addition; s.16(2): stricter transfer rules survive)
| Law / instrument | Why it matters for personal data |
|---|---|
| Consumer Protection (E-Commerce) Rules 2020 | Seller info, grievance officer, no manipulation |
| Guidelines for Prevention & Regulation of Dark Patterns 2023 | Consent & UI design |
| DPDP Third Schedule | E-commerce >= 2 crore registered users in India: 3-year inactivity erasure + 48h notice |
| RBI Card-on-File tokenisation | No card storage by merchants |
| CGST Act s.36 & Income-tax | Invoice retention |
| TRAI TCCCPR | Promotional SMS/voice |

## Localisation / cross-border
Payment data via RBI-regulated PAs; many SaaS tools abroad.

## Retention anchors (use in Retention Rules; reconciles s.8(7) 'retention required by law')
| Record | Period | Source | Confidence |
|---|---|---|---|
| Invoices & tax records | 72 months from due date of annual return (GST) | CGST s.36 | high |
| Inactive user data (large platforms) | Erase after 3 years inactivity (except account access/wallet) | DPDP Third Schedule | high |
| Transaction logs & PD (all DFs) | Min 1 year | DPDP R8(3) | high |

> Confidence `verify` means you must confirm the current text before citing it in a client deliverable.

## DPDP hotspots in this sector
- Ad-tech, pixels, retargeting & marketplace data sharing with sellers
- Seller/merchant access to buyer data (processor or DF?)
- Loyalty & phone-number-at-billing in stores
- Reviews & UGC
- Children buying on platform
- Delivery partners & address/phone masking

## Where assessments get stuck here
- Sellers get buyer addresses - contractually limit to fulfilment
- Omnichannel identity stitching across POS/app/web without clear notice

See also [[Stuck-Point Playbook]].

## Typical data principals
Customer, Guest checkout buyer, Gift recipient, Seller (individual), Delivery partner, Store visitor

## Sector process templates
- [[ECR-01 Customer registration & profile]] (Platform)
- [[ECR-02 Order, payment, fulfilment & returns]] (Orders)
- [[ECR-03 Personalisation, ads & retargeting]] (Marketing)
- [[ECR-04 In-store POS, loyalty & CCTV]] (Stores)
- [[ECR-05 Fraud prevention & reviews]] (Trust & Safety)

## Plus common functions
All [[Process Catalogue Index|common-function templates]] (HR, finance, marketing, IT, admin, legal) also apply.
