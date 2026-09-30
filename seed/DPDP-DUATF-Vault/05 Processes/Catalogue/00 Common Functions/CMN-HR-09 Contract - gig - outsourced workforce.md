---
type: process_template
process_id: CMN-HR-09
title: Contract / gig / outsourced workforce
sector: All sectors (common functions)
department: Human Resources
activities:
- Contractor onboarding via agency
- Gate pass & ID
- Wage compliance verification
data_principals:
- Contract worker
data_categories:
- identity
- gov_id
- financial
typical_systems:
- Contractor portal
- Access control
typical_third_parties:
- Manpower agencies
typical_lawful_basis:
- s7i
- s7d
flags:
- processor
context_tags:
- gov_id
specific_obligations:
- "[[OBL-LB-04]]"
- "[[OBL-LB-06]]"
- "[[OBL-SEC-07]]"
- "[[OBL-RET-02]]"
- "[[OBL-RGT-01]]"
- "[[OBL-PRC-01]]"
- "[[OBL-PRC-02]]"
- "[[OBL-PRC-03]]"
- "[[OBL-PRC-04]]"
sector_overlay: ''
tags:
- dpdp/process-catalogue
- sector/cmn
---

# CMN-HR-09 - Contract / gig / outsourced workforce

**Sector:** All sectors (common functions) | **Department:** Human Resources

> **Assessor note:** Principal employer vs agency roles - often independent DFs.

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Contractor onboarding via agency
2. Gate pass & ID
3. Wage compliance verification

| Dimension | Typical values |
|---|---|
| Data principals | Contract worker |
| Data categories | identity, gov_id, financial |
| Systems | Contractor portal, Access control |
| Third parties | Manpower agencies |
| Lawful basis (typical) | [[s7i]], [[s7d]] |
| Engine flags | processor |
| Risk context | gov_id |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-04]] s.7(c)-(e) legal source identified
- [[OBL-LB-06]] s.7(i) employment use bounded
- [[OBL-SEC-07]] Security clauses in processor contracts
- [[OBL-RET-02]] Processors erase too
- [[OBL-RGT-01]] Publish means & identifiers for rights
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
