---
type: process_template
process_id: CMN-LEG-04
title: Contract management
sector: All sectors (common functions)
department: Legal & Compliance
activities:
- Contract repository
- Signatory details
- e-sign
data_principals:
- Signatories
- Counterparty contacts
data_categories:
- identity
- contact
- signature
typical_systems:
- CLM
- e-sign
typical_third_parties:
- e-sign provider
typical_lawful_basis:
- s7a
flags:
- processor
- cross_border
context_tags: []
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
sector_overlay: ''
tags:
- dpdp/process-catalogue
- sector/cmn
---

# CMN-LEG-04 - Contract management

**Sector:** All sectors (common functions) | **Department:** Legal & Compliance

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Contract repository
2. Signatory details
3. e-sign

| Dimension | Typical values |
|---|---|
| Data principals | Signatories, Counterparty contacts |
| Data categories | identity, contact, signature |
| Systems | CLM, e-sign |
| Third parties | e-sign provider |
| Lawful basis (typical) | [[s7a]] |
| Engine flags | processor, cross_border |
| Risk context | - |

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
