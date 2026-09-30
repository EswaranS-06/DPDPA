---
type: process_template
process_id: CMN-FIN-01
title: Vendor onboarding & payments (individual vendors/consultants)
sector: All sectors (common functions)
department: Finance
activities:
- Vendor KYC (PAN, GST, bank)
- Invoice processing
- TDS
- Payments
data_principals:
- Individual vendor
- Consultant
- Vendor contact person
data_categories:
- identity
- gov_id
- financial
- contact
typical_systems:
- ERP
- Vendor portal
typical_third_parties:
- Bank
typical_lawful_basis:
- s7a
- s7d
flags: []
context_tags:
- financial
- gov_id
specific_obligations:
- "[[OBL-LB-03]]"
- "[[OBL-LB-04]]"
- "[[OBL-RGT-01]]"
- "[[OBL-RGT-02]]"
- "[[OBL-RGT-03]]"
- "[[OBL-RGT-04]]"
- "[[OBL-RGT-06]]"
sector_overlay: ''
tags:
- dpdp/process-catalogue
- sector/cmn
---

# CMN-FIN-01 - Vendor onboarding & payments (individual vendors/consultants)

**Sector:** All sectors (common functions) | **Department:** Finance

> **Assessor note:** Contact persons of corporate vendors are DPs too.

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Vendor KYC (PAN, GST, bank)
2. Invoice processing
3. TDS
4. Payments

| Dimension | Typical values |
|---|---|
| Data principals | Individual vendor, Consultant, Vendor contact person |
| Data categories | identity, gov_id, financial, contact |
| Systems | ERP, Vendor portal |
| Third parties | Bank |
| Lawful basis (typical) | [[s7a]], [[s7d]] |
| Engine flags | - |
| Risk context | financial, gov_id |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-03]] s.7(a) voluntary provision conditions
- [[OBL-LB-04]] s.7(c)-(e) legal source identified
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
