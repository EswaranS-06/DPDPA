---
type: process_template
process_id: HLT-08
title: MRD, record requests & research
sector: Healthcare
department: Medical Records
activities:
- Record retrieval
- Copies to patient/insurer/court
- Retrospective research
data_principals:
- Patient
data_categories:
- health
typical_systems:
- MRD
- Archive
typical_third_parties:
- Scanning vendor
- Storage vendor
typical_lawful_basis:
- s7a
- s7e
- ex17_2b
flags:
- processor
- research
context_tags:
- health
specific_obligations:
- "[[OBL-SCP-03]]"
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
- "[[OBL-RES-01]]"
sector_overlay: "[[SEC-HLT Healthcare]]"
tags:
- dpdp/process-catalogue
- sector/hlt
---

# HLT-08 - MRD, record requests & research

**Sector:** Healthcare | **Department:** Medical Records

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Record retrieval
2. Copies to patient/insurer/court
3. Retrospective research

| Dimension | Typical values |
|---|---|
| Data principals | Patient |
| Data categories | health |
| Systems | MRD, Archive |
| Third parties | Scanning vendor, Storage vendor |
| Lawful basis (typical) | [[s7a]], [[s7e]], [[ex17_2b]] |
| Engine flags | processor, research |
| Risk context | health |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-SCP-03]] Document and justify exemptions
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
- [[OBL-RES-01]] Research/statistics exemption conditions

## Discovery prompts
- Which of the activities above exist here, and are there others?
- Confirm the data fields against real forms and screens.
- Confirm every system (incl. Excel/WhatsApp) and every recipient.
- Check whether the lawful basis per purpose is really as typical.
- Check whether the flags hold, especially children, cross-border and processors.
