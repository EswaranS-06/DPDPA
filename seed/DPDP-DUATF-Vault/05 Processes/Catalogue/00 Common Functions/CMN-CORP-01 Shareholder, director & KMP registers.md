---
type: process_template
process_id: CMN-CORP-01
title: Shareholder, director & KMP registers
sector: All sectors (common functions)
department: Corporate Secretarial
activities:
- Register of members
- Director KYC (DIR-3)
- Dividend processing
- AGM/e-voting
data_principals:
- Shareholder
- Director
- KMP
data_categories:
- identity
- gov_id
- financial
- contact
typical_systems:
- RTA systems
- MCA portal
typical_third_parties:
- Registrar & Transfer Agent
- Depositories
typical_lawful_basis:
- s7d
flags:
- processor
context_tags:
- financial
specific_obligations:
- "[[OBL-LB-04]]"
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

# CMN-CORP-01 - Shareholder, director & KMP registers

**Sector:** All sectors (common functions) | **Department:** Corporate Secretarial

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Register of members
2. Director KYC (DIR-3)
3. Dividend processing
4. AGM/e-voting

| Dimension | Typical values |
|---|---|
| Data principals | Shareholder, Director, KMP |
| Data categories | identity, gov_id, financial, contact |
| Systems | RTA systems, MCA portal |
| Third parties | Registrar & Transfer Agent, Depositories |
| Lawful basis (typical) | [[s7d]] |
| Engine flags | processor |
| Risk context | financial |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-04]] s.7(c)-(e) legal source identified
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
