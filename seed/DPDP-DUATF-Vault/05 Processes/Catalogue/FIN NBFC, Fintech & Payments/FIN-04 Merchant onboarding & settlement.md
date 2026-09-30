---
type: process_template
process_id: FIN-04
title: Merchant onboarding & settlement
sector: NBFC, Fintech & Payments
department: Payments
activities:
- Merchant KYC
- Beneficial owner checks
- Settlement
- Chargeback
data_principals:
- Merchant proprietor
- Merchant staff
data_categories:
- identity
- gov_id
- financial
typical_systems:
- PA platform
typical_third_parties:
- Acquiring bank
typical_lawful_basis:
- s7d
- s7a
flags:
- processor
context_tags:
- financial
specific_obligations:
- "[[OBL-LB-03]]"
- "[[OBL-LB-04]]"
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
sector_overlay: "[[SEC-FIN NBFC, Fintech & Payments]]"
tags:
- dpdp/process-catalogue
- sector/fin
---

# FIN-04 - Merchant onboarding & settlement

**Sector:** NBFC, Fintech & Payments | **Department:** Payments

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Merchant KYC
2. Beneficial owner checks
3. Settlement
4. Chargeback

| Dimension | Typical values |
|---|---|
| Data principals | Merchant proprietor, Merchant staff |
| Data categories | identity, gov_id, financial |
| Systems | PA platform |
| Third parties | Acquiring bank |
| Lawful basis (typical) | [[s7d]], [[s7a]] |
| Engine flags | processor |
| Risk context | financial |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-03]] s.7(a) voluntary provision conditions
- [[OBL-LB-04]] s.7(c)-(e) legal source identified
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
