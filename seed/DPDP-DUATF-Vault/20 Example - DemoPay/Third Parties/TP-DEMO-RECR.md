---
type: third_party
tp_id: TP-DEMO-RECR
name: Recruitment agency
third_party_type: Recruitment agency
processing_role:
- data_fiduciary
- data_processor
country: India
dpa_status: none
dpa_r6_security: false
breach_notify_sla_hours: null
tags:
- dpdp/third-party
---

# TP-DEMO-RECR - Recruitment agency

## Inbound flows
```dataview
TABLE from_system, activity, transfer_type FROM -"90 Templates" WHERE type = "data_flow" AND to = [[TP-DEMO-RECR]]
```
