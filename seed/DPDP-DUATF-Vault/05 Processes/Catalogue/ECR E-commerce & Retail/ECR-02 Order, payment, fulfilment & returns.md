---
type: process_template
process_id: ECR-02
title: Order, payment, fulfilment & returns
sector: E-commerce & Retail
department: Orders
activities:
- Checkout
- Payment
- Seller fulfilment
- Last-mile delivery
- Returns & refunds
data_principals:
- Customer
- Gift recipient
data_categories:
- identity
- contact
- financial
- location
- transaction
typical_systems:
- OMS
- WMS
- PG
typical_third_parties:
- Sellers
- Logistics partners
- PG
typical_lawful_basis:
- s7a
flags:
- processor
- third_schedule
context_tags:
- financial
specific_obligations:
- "[[OBL-LB-03]]"
- "[[OBL-SEC-07]]"
- "[[OBL-RET-02]]"
- "[[OBL-RET-03]]"
- "[[OBL-RET-04]]"
- "[[OBL-RGT-01]]"
- "[[OBL-RGT-02]]"
- "[[OBL-RGT-03]]"
- "[[OBL-RGT-04]]"
- "[[OBL-RGT-06]]"
- "[[OBL-PRC-01]]"
- "[[OBL-PRC-02]]"
- "[[OBL-PRC-03]]"
- "[[OBL-PRC-04]]"
sector_overlay: "[[SEC-ECR E-commerce & Retail]]"
tags:
- dpdp/process-catalogue
- sector/ecr
---

# ECR-02 - Order, payment, fulfilment & returns

**Sector:** E-commerce & Retail | **Department:** Orders

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Checkout
2. Payment
3. Seller fulfilment
4. Last-mile delivery
5. Returns & refunds

| Dimension | Typical values |
|---|---|
| Data principals | Customer, Gift recipient |
| Data categories | identity, contact, financial, location, transaction |
| Systems | OMS, WMS, PG |
| Third parties | Sellers, Logistics partners, PG |
| Lawful basis (typical) | [[s7a]] |
| Engine flags | processor, third_schedule |
| Risk context | financial |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-03]] s.7(a) voluntary provision conditions
- [[OBL-SEC-07]] Security clauses in processor contracts
- [[OBL-RET-02]] Processors erase too
- [[OBL-RET-03]] Third Schedule inactivity erasure
- [[OBL-RET-04]] 48-hour pre-erasure intimation
- [[OBL-RGT-01]] Publish means & identifiers for rights
- [[OBL-RGT-02]] Right to access
- [[OBL-RGT-03]] Right to correction, completion, updating
- [[OBL-RGT-04]] Right to erasure
- [[OBL-RGT-06]] Right to nominate
- [[OBL-PRC-01]] Processor only under valid contract
- [[OBL-PRC-02]] Processor oversight
- [[OBL-PRC-03]] Flow-down withdrawal & erasure
- [[OBL-PRC-04]] Processor breach notification to DF

## Discovery prompts
- Which of the activities above exist here, and are there others?
- Confirm the data fields against real forms and screens.
- Confirm every system (incl. Excel/WhatsApp) and every recipient.
- Check whether the lawful basis per purpose is really as typical.
- Check whether the flags hold, especially children, cross-border and processors.
