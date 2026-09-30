---
type: process_template
process_id: ECR-04
title: In-store POS, loyalty & CCTV
sector: E-commerce & Retail
department: Stores
activities:
- Phone at billing
- Loyalty enrolment
- Footfall analytics
- CCTV
data_principals:
- Customer
- Visitor
data_categories:
- contact
- transaction
- images_av
typical_systems:
- POS
- Loyalty
- CCTV/VMS
typical_third_parties:
- Loyalty vendor
- Analytics vendor
typical_lawful_basis:
- consent
- s7a
flags:
- processor
- marketing
context_tags:
- cctv
specific_obligations:
- "[[OBL-LB-02]]"
- "[[OBL-LB-03]]"
- "[[OBL-NOT-01]]"
- "[[OBL-NOT-02]]"
- "[[OBL-NOT-03]]"
- "[[OBL-NOT-04]]"
- "[[OBL-NOT-05]]"
- "[[OBL-CON-01]]"
- "[[OBL-CON-02]]"
- "[[OBL-CON-03]]"
- "[[OBL-CON-04]]"
- "[[OBL-CON-05]]"
- "[[OBL-CON-06]]"
- "[[OBL-SEC-07]]"
- "[[OBL-RET-02]]"
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

# ECR-04 - In-store POS, loyalty & CCTV

**Sector:** E-commerce & Retail | **Department:** Stores

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Phone at billing
2. Loyalty enrolment
3. Footfall analytics
4. CCTV

| Dimension | Typical values |
|---|---|
| Data principals | Customer, Visitor |
| Data categories | contact, transaction, images_av |
| Systems | POS, Loyalty, CCTV/VMS |
| Third parties | Loyalty vendor, Analytics vendor |
| Lawful basis (typical) | [[consent]], [[s7a]] |
| Engine flags | processor, marketing |
| Risk context | cctv |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-02]] Data minimisation for consent
- [[OBL-LB-03]] s.7(a) voluntary provision conditions
- [[OBL-NOT-01]] Notice with every consent request
- [[OBL-NOT-02]] Notice standalone & plain
- [[OBL-NOT-03]] Itemised data and specified purpose
- [[OBL-NOT-04]] Means to withdraw, exercise rights, complain
- [[OBL-NOT-05]] Language option
- [[OBL-CON-01]] Valid consent standard
- [[OBL-CON-02]] No infringing consent terms
- [[OBL-CON-03]] Consent request language & contact
- [[OBL-CON-04]] Withdrawal with comparable ease
- [[OBL-CON-05]] Cease processing after withdrawal
- [[OBL-CON-06]] Proof of notice and consent
- [[OBL-SEC-07]] Security clauses in processor contracts
- [[OBL-RET-02]] Processors erase too
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
