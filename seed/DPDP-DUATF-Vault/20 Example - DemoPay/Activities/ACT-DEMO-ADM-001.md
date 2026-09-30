---
type: processing_activity
activity_id: ACT-DEMO-ADM-001
title: Office CCTV
organisation: "[[ORG-DEMO Entity Profile]]"
entity_profile: "[[ORG-DEMO Entity Profile]]"
department: Admin & Facilities
process: "[[CMN-ADM-01 CCTV surveillance]]"
owner: ''
processing_role:
- data_fiduciary
purposes:
- "[[PUR-DEMO-006]]"
lawful_basis:
- s7i
- s7a
data_principals:
- Employee
- Visitor
data_elements:
- "[[DE-AV-001 CCTV footage]]"
digital_state: digital
systems:
- "[[SYS-DEMO-NVR]]"
third_parties: []
data_flows: []
flags: []
context_tags:
- cctv
overrides: {}
confidence: high
status: assessed
tags:
- dpdp/activity
---

# ACT-DEMO-ADM-001 - Office CCTV

Catalogue template: [[CMN-ADM-01 CCTV surveillance]]

## Engine output
![[Applicability - ACT-DEMO-ADM-001]]
