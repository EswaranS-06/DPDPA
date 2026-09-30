---
type: process_template
process_id: HTA-01
title: Reservation & check-in
sector: Hospitality, Travel & Aviation
department: Front Office
activities:
- Booking (direct/OTA)
- ID capture
- Form C for foreigners
- Room key
- Folio
data_principals:
- Guest
- Accompanying guests incl. children
data_categories:
- identity
- gov_id
- contact
- financial
- images_av
typical_systems:
- PMS
- Channel manager
typical_third_parties:
- OTAs
- Channel manager
- PG
- FRRO
typical_lawful_basis:
- s7a
- s7d
flags:
- processor
- children
- cross_border
context_tags:
- gov_id
specific_obligations:
- "[[OBL-LB-03]]"
- "[[OBL-LB-04]]"
- "[[OBL-CHD-01]]"
- "[[OBL-CHD-02]]"
- "[[OBL-CHD-03]]"
- "[[OBL-CHD-04]]"
- "[[OBL-CHD-05]]"
- "[[OBL-CHD-06]]"
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
sector_overlay: "[[SEC-HTA Hospitality, Travel & Aviation]]"
tags:
- dpdp/process-catalogue
- sector/hta
---

# HTA-01 - Reservation & check-in

**Sector:** Hospitality, Travel & Aviation | **Department:** Front Office

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Booking (direct/OTA)
2. ID capture
3. Form C for foreigners
4. Room key
5. Folio

| Dimension | Typical values |
|---|---|
| Data principals | Guest, Accompanying guests incl. children |
| Data categories | identity, gov_id, contact, financial, images_av |
| Systems | PMS, Channel manager |
| Third parties | OTAs, Channel manager, PG, FRRO |
| Lawful basis (typical) | [[s7a]], [[s7d]] |
| Engine flags | processor, children, cross_border |
| Risk context | gov_id |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-03]] s.7(a) voluntary provision conditions
- [[OBL-LB-04]] s.7(c)-(e) legal source identified
- [[OBL-CHD-01]] Verifiable parental consent
- [[OBL-CHD-02]] Verify parent is identifiable adult
- [[OBL-CHD-03]] Age-gating / child identification
- [[OBL-CHD-04]] No detrimental processing
- [[OBL-CHD-05]] No tracking, behavioural monitoring, targeted ads
- [[OBL-CHD-06]] Fourth Schedule exemption conditions
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
