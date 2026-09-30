---
type: process_template
process_id: TEL-02
title: Network operations, CDR/IPDR & location
sector: Telecom & Internet Service Providers
department: Network
activities:
- Call/data records
- Cell location
- Lawful interception
data_principals:
- Subscriber
- Other party
data_categories:
- location
- traffic
- communication_metadata
typical_systems:
- Mediation
- LI systems
typical_third_parties:
- LEAs
typical_lawful_basis:
- s7d
- s7c
- ex17_1c
flags:
- decision_or_disclosure
context_tags:
- location
specific_obligations:
- "[[OBL-SCP-03]]"
- "[[OBL-LB-04]]"
- "[[OBL-DQ-01]]"
- "[[OBL-RGT-01]]"
sector_overlay: "[[SEC-TEL Telecom & Internet Service Providers]]"
tags:
- dpdp/process-catalogue
- sector/tel
---

# TEL-02 - Network operations, CDR/IPDR & location

**Sector:** Telecom & Internet Service Providers | **Department:** Network

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Call/data records
2. Cell location
3. Lawful interception

| Dimension | Typical values |
|---|---|
| Data principals | Subscriber, Other party |
| Data categories | location, traffic, communication_metadata |
| Systems | Mediation, LI systems |
| Third parties | LEAs |
| Lawful basis (typical) | [[s7d]], [[s7c]], [[ex17_1c]] |
| Engine flags | decision_or_disclosure |
| Risk context | location |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-SCP-03]] Document and justify exemptions
- [[OBL-LB-04]] s.7(c)-(e) legal source identified
- [[OBL-DQ-01]] Accuracy for decisions & disclosures
- [[OBL-RGT-01]] Publish means & identifiers for rights

## Discovery prompts
- Which of the activities above exist here, and are there others?
- Confirm the data fields against real forms and screens.
- Confirm every system (incl. Excel/WhatsApp) and every recipient.
- Check whether the lawful basis per purpose is really as typical.
- Check whether the flags hold, especially children, cross-border and processors.
