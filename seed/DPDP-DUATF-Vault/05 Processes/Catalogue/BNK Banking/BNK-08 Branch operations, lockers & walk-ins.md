---
type: process_template
process_id: BNK-08
title: Branch operations, lockers & walk-ins
sector: Banking
department: Branch Ops
activities:
- Token/queue
- Locker access registers
- Cash transactions
- CCTV
data_principals:
- Customer
- Visitor
data_categories:
- identity
- images_av
- biometric
typical_systems:
- Queue mgmt
- Locker system
- CCTV
typical_third_parties:
- Security agency
typical_lawful_basis:
- s7a
- s7d
flags: []
context_tags:
- cctv
- biometric
specific_obligations:
- "[[OBL-LB-03]]"
- "[[OBL-LB-04]]"
- "[[OBL-RGT-01]]"
- "[[OBL-RGT-02]]"
- "[[OBL-RGT-03]]"
- "[[OBL-RGT-04]]"
- "[[OBL-RGT-06]]"
sector_overlay: "[[SEC-BNK Banking]]"
tags:
- dpdp/process-catalogue
- sector/bnk
---

# BNK-08 - Branch operations, lockers & walk-ins

**Sector:** Banking | **Department:** Branch Ops

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Token/queue
2. Locker access registers
3. Cash transactions
4. CCTV

| Dimension | Typical values |
|---|---|
| Data principals | Customer, Visitor |
| Data categories | identity, images_av, biometric |
| Systems | Queue mgmt, Locker system, CCTV |
| Third parties | Security agency |
| Lawful basis (typical) | [[s7a]], [[s7d]] |
| Engine flags | - |
| Risk context | cctv, biometric |

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
