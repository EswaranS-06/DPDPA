---
type: process_template
process_id: CMN-FIN-04
title: Statutory audit, tax & regulatory filings
sector: All sectors (common functions)
department: Finance
activities:
- Books of account
- GST returns
- Income tax assessments
- Auditor access
data_principals:
- Customers
- Employees
- Vendors
data_categories:
- financial
- transaction
- gov_id
typical_systems:
- ERP
typical_third_parties:
- Statutory auditor
- Tax consultant
typical_lawful_basis:
- s7d
- s7e
flags:
- decision_or_disclosure
context_tags: []
specific_obligations:
- "[[OBL-LB-04]]"
- "[[OBL-DQ-01]]"
- "[[OBL-RGT-01]]"
sector_overlay: ''
tags:
- dpdp/process-catalogue
- sector/cmn
---

# CMN-FIN-04 - Statutory audit, tax & regulatory filings

**Sector:** All sectors (common functions) | **Department:** Finance

> **Assessor note:** Retention: Companies Act 8 yrs; CGST 72 months from annual return due date; Income-tax Act.

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Books of account
2. GST returns
3. Income tax assessments
4. Auditor access

| Dimension | Typical values |
|---|---|
| Data principals | Customers, Employees, Vendors |
| Data categories | financial, transaction, gov_id |
| Systems | ERP |
| Third parties | Statutory auditor, Tax consultant |
| Lawful basis (typical) | [[s7d]], [[s7e]] |
| Engine flags | decision_or_disclosure |
| Risk context | - |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-04]] s.7(c)-(e) legal source identified
- [[OBL-DQ-01]] Accuracy for decisions & disclosures
- [[OBL-RGT-01]] Publish means & identifiers for rights

## Discovery prompts
- Which of the activities above exist here, and are there others?
- Confirm the data fields against real forms and screens.
- Confirm every system (incl. Excel/WhatsApp) and every recipient.
- Check whether the lawful basis per purpose is really as typical.
- Check whether the flags hold, especially children, cross-border and processors.
