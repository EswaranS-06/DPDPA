---
type: process_template
process_id: CAP-04
title: Insider trading compliance (listed cos.)
sector: Capital Markets
department: Corporate
activities:
- Designated persons & relatives data
- Trading pre-clearance
- SDD entries
data_principals:
- Designated persons
- Immediate relatives
- UPSI recipients
data_categories:
- identity
- gov_id
- financial
typical_systems:
- PIT tool
typical_third_parties: []
typical_lawful_basis:
- s7d
flags:
- decision_or_disclosure
context_tags: []
specific_obligations:
- "[[OBL-LB-04]]"
- "[[OBL-DQ-01]]"
- "[[OBL-RGT-01]]"
sector_overlay: "[[SEC-CAP Capital Markets]]"
tags:
- dpdp/process-catalogue
- sector/cap
---

# CAP-04 - Insider trading compliance (listed cos.)

**Sector:** Capital Markets | **Department:** Corporate

> **Assessor note:** Relatives' data - notice via designated person.

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Designated persons & relatives data
2. Trading pre-clearance
3. SDD entries

| Dimension | Typical values |
|---|---|
| Data principals | Designated persons, Immediate relatives, UPSI recipients |
| Data categories | identity, gov_id, financial |
| Systems | PIT tool |
| Third parties | - |
| Lawful basis (typical) | [[s7d]] |
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
