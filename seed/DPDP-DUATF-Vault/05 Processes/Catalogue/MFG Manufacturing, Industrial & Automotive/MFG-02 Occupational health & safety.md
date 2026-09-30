---
type: process_template
process_id: MFG-02
title: Occupational health & safety
sector: Manufacturing, Industrial & Automotive
department: EHS
activities:
- Pre-employment & periodic medicals
- Incident/injury records
- Hazard exposure monitoring
data_principals:
- Worker
data_categories:
- health
- identity
typical_systems:
- OHC system
typical_third_parties:
- Occupational health vendor
typical_lawful_basis:
- s7i
- s7d
- s7f
flags:
- processor
context_tags:
- health
specific_obligations:
- "[[OBL-LB-04]]"
- "[[OBL-LB-05]]"
- "[[OBL-LB-06]]"
- "[[OBL-SEC-07]]"
- "[[OBL-RET-02]]"
- "[[OBL-RGT-01]]"
- "[[OBL-PRC-01]]"
- "[[OBL-PRC-02]]"
- "[[OBL-PRC-03]]"
- "[[OBL-PRC-04]]"
sector_overlay: "[[SEC-MFG Manufacturing, Industrial & Automotive]]"
tags:
- dpdp/process-catalogue
- sector/mfg
---

# MFG-02 - Occupational health & safety

**Sector:** Manufacturing, Industrial & Automotive | **Department:** EHS

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Pre-employment & periodic medicals
2. Incident/injury records
3. Hazard exposure monitoring

| Dimension | Typical values |
|---|---|
| Data principals | Worker |
| Data categories | health, identity |
| Systems | OHC system |
| Third parties | Occupational health vendor |
| Lawful basis (typical) | [[s7i]], [[s7d]], [[s7f]] |
| Engine flags | processor |
| Risk context | health |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-04]] s.7(c)-(e) legal source identified
- [[OBL-LB-05]] s.7(f)-(h) emergency use bounded
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
