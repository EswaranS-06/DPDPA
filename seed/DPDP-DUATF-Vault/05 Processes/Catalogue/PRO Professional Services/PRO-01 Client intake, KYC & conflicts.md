---
type: process_template
process_id: PRO-01
title: Client intake, KYC & conflicts
sector: Professional Services
department: Engagements
activities:
- Engagement letter
- KYC (PMLA where applicable)
- Conflict checks
data_principals:
- Client
- Client's beneficial owners
data_categories:
- identity
- gov_id
- financial
typical_systems:
- Practice mgmt
typical_third_parties: []
typical_lawful_basis:
- s7d
- s7a
flags: []
context_tags:
- gov_id
specific_obligations:
- "[[OBL-LB-03]]"
- "[[OBL-LB-04]]"
- "[[OBL-RGT-01]]"
- "[[OBL-RGT-02]]"
- "[[OBL-RGT-03]]"
- "[[OBL-RGT-04]]"
- "[[OBL-RGT-06]]"
sector_overlay: "[[SEC-PRO Professional Services]]"
tags:
- dpdp/process-catalogue
- sector/pro
---

# PRO-01 - Client intake, KYC & conflicts

**Sector:** Professional Services | **Department:** Engagements

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Engagement letter
2. KYC (PMLA where applicable)
3. Conflict checks

| Dimension | Typical values |
|---|---|
| Data principals | Client, Client's beneficial owners |
| Data categories | identity, gov_id, financial |
| Systems | Practice mgmt |
| Third parties | - |
| Lawful basis (typical) | [[s7d]], [[s7a]] |
| Engine flags | - |
| Risk context | gov_id |

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
