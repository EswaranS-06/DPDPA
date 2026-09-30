---
type: process_template
process_id: CMN-IT-05
title: Backup, DR & archival
sector: All sectors (common functions)
department: IT
activities:
- Backups
- DR replication
- Archives/tapes
data_principals:
- Any
data_categories:
- any
typical_systems:
- Backup software
- DR site
- Cloud storage
typical_third_parties:
- Backup vendor
- Cloud
typical_lawful_basis:
- s7a
- s7d
flags:
- processor
- cross_border
context_tags: []
specific_obligations:
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
- "[[OBL-XB-01]]"
- "[[OBL-XB-02]]"
- "[[OBL-XB-03]]"
sector_overlay: ''
tags:
- dpdp/process-catalogue
- sector/cmn
---

# CMN-IT-05 - Backup, DR & archival

**Sector:** All sectors (common functions) | **Department:** IT

> **Assessor note:** Erasure in backups: document expiry-based approach.

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Backups
2. DR replication
3. Archives/tapes

| Dimension | Typical values |
|---|---|
| Data principals | Any |
| Data categories | any |
| Systems | Backup software, DR site, Cloud storage |
| Third parties | Backup vendor, Cloud |
| Lawful basis (typical) | [[s7a]], [[s7d]] |
| Engine flags | processor, cross_border |
| Risk context | - |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

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
- [[OBL-XB-01]] No transfer to restricted countries
- [[OBL-XB-02]] Foreign-State access conditions
- [[OBL-XB-03]] Sectoral localisation prevails

## Discovery prompts
- Which of the activities above exist here, and are there others?
- Confirm the data fields against real forms and screens.
- Confirm every system (incl. Excel/WhatsApp) and every recipient.
- Check whether the lawful basis per purpose is really as typical.
- Check whether the flags hold, especially children, cross-border and processors.
