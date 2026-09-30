---
type: process_template
process_id: CMN-LEG-03
title: Regulatory reporting & law-enforcement requests
sector: All sectors (common functions)
department: Legal & Compliance
activities:
- Regulatory returns
- Police/agency requests
- Court orders
data_principals:
- Customer
- Employee
data_categories:
- any
typical_systems:
- Case register
typical_third_parties:
- Regulators
- LEAs
typical_lawful_basis:
- s7c
- s7d
- s7e
- ex17_1c
flags:
- decision_or_disclosure
context_tags: []
specific_obligations:
- "[[OBL-SCP-03]]"
- "[[OBL-LB-04]]"
- "[[OBL-DQ-01]]"
- "[[OBL-RGT-01]]"
sector_overlay: ''
tags:
- dpdp/process-catalogue
- sector/cmn
---

# CMN-LEG-03 - Regulatory reporting & law-enforcement requests

**Sector:** All sectors (common functions) | **Department:** Legal & Compliance

> **Assessor note:** Maintain disclosure register (supports s.11 recipient listing).

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Regulatory returns
2. Police/agency requests
3. Court orders

| Dimension | Typical values |
|---|---|
| Data principals | Customer, Employee |
| Data categories | any |
| Systems | Case register |
| Third parties | Regulators, LEAs |
| Lawful basis (typical) | [[s7c]], [[s7d]], [[s7e]], [[ex17_1c]] |
| Engine flags | decision_or_disclosure |
| Risk context | - |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-SCP-03]] Document and justify exemptions
- [[OBL-LB-04]] s.7(c)-(e) legal source identified
- [[OBL-DQ-01]] Accuracy for decisions & disclosures
- [[OBL-RGT-01]] Publish means & identifiers for rights

## Discovery prompts
- Which of the activities above exist here, and are there others?
- Confirm the data fields against real forms and screens.
- Confirm every system (incl. Excel/WhatsApp) and every recipient.
- Check whether the lawful basis per purpose is really as typical.
- Check whether the flags hold, especially children, cross-border and processors.
