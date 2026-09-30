---
type: process_template
process_id: HLT-05
title: Pharmacy dispensing & e-pharmacy
sector: Healthcare
department: Pharmacy
activities:
- Prescription validation
- H1 register
- Home delivery
data_principals:
- Patient
data_categories:
- health
- identity
- contact
- financial
typical_systems:
- Pharmacy system
typical_third_parties:
- Delivery partners
typical_lawful_basis:
- s7a
- s7d
flags:
- processor
context_tags:
- health
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
sector_overlay: "[[SEC-HLT Healthcare]]"
tags:
- dpdp/process-catalogue
- sector/hlt
---

# HLT-05 - Pharmacy dispensing & e-pharmacy

**Sector:** Healthcare | **Department:** Pharmacy

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Prescription validation
2. H1 register
3. Home delivery

| Dimension | Typical values |
|---|---|
| Data principals | Patient |
| Data categories | health, identity, contact, financial |
| Systems | Pharmacy system |
| Third parties | Delivery partners |
| Lawful basis (typical) | [[s7a]], [[s7d]] |
| Engine flags | processor |
| Risk context | health |

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
