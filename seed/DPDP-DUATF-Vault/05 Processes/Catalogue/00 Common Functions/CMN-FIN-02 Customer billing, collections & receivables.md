---
type: process_template
process_id: CMN-FIN-02
title: Customer billing, collections & receivables
sector: All sectors (common functions)
department: Finance
activities:
- Invoicing
- Payment collection
- Reminders & collections
- Refunds
- Credit checks
data_principals:
- Customer
data_categories:
- identity
- contact
- financial
- transaction
typical_systems:
- ERP
- Billing system
- Payment gateway
typical_third_parties:
- Payment gateway
- Collection agency
- Credit bureau
typical_lawful_basis:
- consent
- s7a
flags:
- processor
- decision_or_disclosure
context_tags:
- financial
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
- "[[OBL-DQ-01]]"
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
sector_overlay: ''
tags:
- dpdp/process-catalogue
- sector/cmn
---

# CMN-FIN-02 - Customer billing, collections & receivables

**Sector:** All sectors (common functions) | **Department:** Finance

> **Assessor note:** Collection agency conduct; payment data localisation (RBI) via PG.

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Invoicing
2. Payment collection
3. Reminders & collections
4. Refunds
5. Credit checks

| Dimension | Typical values |
|---|---|
| Data principals | Customer |
| Data categories | identity, contact, financial, transaction |
| Systems | ERP, Billing system, Payment gateway |
| Third parties | Payment gateway, Collection agency, Credit bureau |
| Lawful basis (typical) | [[consent]], [[s7a]] |
| Engine flags | processor, decision_or_disclosure |
| Risk context | financial |

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
- [[OBL-DQ-01]] Accuracy for decisions & disclosures
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
