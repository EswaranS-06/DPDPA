---
type: process_template
process_id: FIN-06
title: Wallet / Account Aggregator consent flows
sector: NBFC, Fintech & Payments
department: Wallets / AA
activities:
- Consent artefact creation
- Data fetch
- Consent revocation
data_principals:
- Customer
data_categories:
- financial
- transaction
typical_systems:
- AA platform
typical_third_parties:
- FIPs
- FIUs
typical_lawful_basis:
- consent
flags:
- consent_manager_used
- decision_or_disclosure
context_tags: []
specific_obligations:
- "[[OBL-LB-02]]"
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
- "[[OBL-CON-07]]"
- "[[OBL-DQ-01]]"
- "[[OBL-RGT-01]]"
- "[[OBL-RGT-02]]"
- "[[OBL-RGT-03]]"
- "[[OBL-RGT-04]]"
- "[[OBL-RGT-06]]"
sector_overlay: "[[SEC-FIN NBFC, Fintech & Payments]]"
tags:
- dpdp/process-catalogue
- sector/fin
---

# FIN-06 - Wallet / Account Aggregator consent flows

**Sector:** NBFC, Fintech & Payments | **Department:** Wallets / AA

> **Assessor note:** AA consent model is a template for DPDP Consent Managers.

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Consent artefact creation
2. Data fetch
3. Consent revocation

| Dimension | Typical values |
|---|---|
| Data principals | Customer |
| Data categories | financial, transaction |
| Systems | AA platform |
| Third parties | FIPs, FIUs |
| Lawful basis (typical) | [[consent]] |
| Engine flags | consent_manager_used, decision_or_disclosure |
| Risk context | - |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-02]] Data minimisation for consent
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
- [[OBL-CON-07]] Accept Consent Manager instructions
- [[OBL-DQ-01]] Accuracy for decisions & disclosures
- [[OBL-RGT-01]] Publish means & identifiers for rights
- [[OBL-RGT-02]] Right to access
- [[OBL-RGT-03]] Right to correction, completion, updating
- [[OBL-RGT-04]] Right to erasure
- [[OBL-RGT-06]] Right to nominate

## Discovery prompts
- Which of the activities above exist here, and are there others?
- Confirm the data fields against real forms and screens.
- Confirm every system (incl. Excel/WhatsApp) and every recipient.
- Check whether the lawful basis per purpose is really as typical.
- Check whether the flags hold, especially children, cross-border and processors.
