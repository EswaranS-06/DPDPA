---
type: process_template
process_id: LOG-01
title: Driver/delivery partner onboarding
sector: Logistics, Mobility & Gig Platforms
department: Supply
activities:
- Documents & licence
- Background verification
- Bank details
- Selfie authentication
data_principals:
- Driver/partner
data_categories:
- identity
- gov_id
- biometric
- financial
- background_check
typical_systems:
- Partner app
typical_third_parties:
- BGV vendors
- Insurers
typical_lawful_basis:
- consent
- s7d
flags:
- processor
- decision_or_disclosure
context_tags:
- biometric
- gov_id
specific_obligations:
- "[[OBL-LB-02]]"
- "[[OBL-LB-04]]"
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
sector_overlay: "[[SEC-LOG Logistics, Mobility & Gig Platforms]]"
tags:
- dpdp/process-catalogue
- sector/log
---

# LOG-01 - Driver/delivery partner onboarding

**Sector:** Logistics, Mobility & Gig Platforms | **Department:** Supply

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Documents & licence
2. Background verification
3. Bank details
4. Selfie authentication

| Dimension | Typical values |
|---|---|
| Data principals | Driver/partner |
| Data categories | identity, gov_id, biometric, financial, background_check |
| Systems | Partner app |
| Third parties | BGV vendors, Insurers |
| Lawful basis (typical) | [[consent]], [[s7d]] |
| Engine flags | processor, decision_or_disclosure |
| Risk context | biometric, gov_id |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-02]] Data minimisation for consent
- [[OBL-LB-04]] s.7(c)-(e) legal source identified
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
