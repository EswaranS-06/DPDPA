---
type: process_template
process_id: CMN-HR-07
title: Employee monitoring & investigations
sector: All sectors (common functions)
department: Human Resources
activities:
- Email/DLP monitoring
- Endpoint & web monitoring
- Disciplinary investigations
- POSH complaints
data_principals:
- Employee
- Complainant
- Witness
data_categories:
- communication_content
- device_online
- employment
- sensitive_allegations
typical_systems:
- DLP
- SIEM
- Case management
typical_third_parties:
- Forensic firms
- External POSH member
typical_lawful_basis:
- s7i
flags:
- decision_or_disclosure
context_tags: []
specific_obligations:
- "[[OBL-LB-06]]"
- "[[OBL-DQ-01]]"
- "[[OBL-RGT-01]]"
sector_overlay: ''
tags:
- dpdp/process-catalogue
- sector/cmn
---

# CMN-HR-07 - Employee monitoring & investigations

**Sector:** All sectors (common functions) | **Department:** Human Resources

> **Assessor note:** POSH Act confidentiality; proportionality of monitoring.

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Email/DLP monitoring
2. Endpoint & web monitoring
3. Disciplinary investigations
4. POSH complaints

| Dimension | Typical values |
|---|---|
| Data principals | Employee, Complainant, Witness |
| Data categories | communication_content, device_online, employment, sensitive_allegations |
| Systems | DLP, SIEM, Case management |
| Third parties | Forensic firms, External POSH member |
| Lawful basis (typical) | [[s7i]] |
| Engine flags | decision_or_disclosure |
| Risk context | - |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-06]] s.7(i) employment use bounded
- [[OBL-DQ-01]] Accuracy for decisions & disclosures
- [[OBL-RGT-01]] Publish means & identifiers for rights

## Discovery prompts
- Which of the activities above exist here, and are there others?
- Confirm the data fields against real forms and screens.
- Confirm every system (incl. Excel/WhatsApp) and every recipient.
- Check whether the lawful basis per purpose is really as typical.
- Check whether the flags hold, especially children, cross-border and processors.
