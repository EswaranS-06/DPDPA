---
type: process_template
process_id: GOV-03
title: Regulatory inspection & enforcement
sector: Government, PSUs & Public Bodies
department: Enforcement
activities:
- Inspections
- Notices
- Penalties
data_principals:
- Regulated persons
data_categories:
- identity
- any
typical_systems:
- Case systems
typical_third_parties: []
typical_lawful_basis:
- s7c
- ex17_1b
flags:
- decision_or_disclosure
context_tags: []
specific_obligations:
- "[[OBL-SCP-03]]"
- "[[OBL-LB-04]]"
- "[[OBL-DQ-01]]"
- "[[OBL-RGT-01]]"
sector_overlay: "[[SEC-GOV Government, PSUs & Public Bodies]]"
tags:
- dpdp/process-catalogue
- sector/gov
---

# GOV-03 - Regulatory inspection & enforcement

**Sector:** Government, PSUs & Public Bodies | **Department:** Enforcement

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Inspections
2. Notices
3. Penalties

| Dimension | Typical values |
|---|---|
| Data principals | Regulated persons |
| Data categories | identity, any |
| Systems | Case systems |
| Third parties | - |
| Lawful basis (typical) | [[s7c]], [[ex17_1b]] |
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
