---
type: process_template
process_id: FIN-05
title: Payment processing & tokenisation
sector: NBFC, Fintech & Payments
department: Payments
activities:
- Checkout
- Token vault
- Fraud scoring
- Refunds
data_principals:
- Payer
data_categories:
- payment_card
- financial
- device_online
typical_systems:
- Gateway
- Token vault
- FRM
typical_third_parties:
- Card networks
- Issuing banks
typical_lawful_basis:
- s7a
flags:
- processor
- cross_border
context_tags:
- financial
- ai
specific_obligations:
- "[[OBL-LB-03]]"
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
- "[[OBL-XB-01]]"
- "[[OBL-XB-02]]"
- "[[OBL-XB-03]]"
sector_overlay: "[[SEC-FIN NBFC, Fintech & Payments]]"
tags:
- dpdp/process-catalogue
- sector/fin
---

# FIN-05 - Payment processing & tokenisation

**Sector:** NBFC, Fintech & Payments | **Department:** Payments

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Checkout
2. Token vault
3. Fraud scoring
4. Refunds

| Dimension | Typical values |
|---|---|
| Data principals | Payer |
| Data categories | payment_card, financial, device_online |
| Systems | Gateway, Token vault, FRM |
| Third parties | Card networks, Issuing banks |
| Lawful basis (typical) | [[s7a]] |
| Engine flags | processor, cross_border |
| Risk context | financial, ai |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-03]] s.7(a) voluntary provision conditions
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
- [[OBL-XB-01]] No transfer to restricted countries
- [[OBL-XB-02]] Foreign-State access conditions
- [[OBL-XB-03]] Sectoral localisation prevails

## Discovery prompts
- Which of the activities above exist here, and are there others?
- Confirm the data fields against real forms and screens.
- Confirm every system (incl. Excel/WhatsApp) and every recipient.
- Check whether the lawful basis per purpose is really as typical.
- Check whether the flags hold, especially children, cross-border and processors.
