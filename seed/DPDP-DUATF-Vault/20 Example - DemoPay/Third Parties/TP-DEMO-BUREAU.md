---
type: third_party
tp_id: TP-DEMO-BUREAU
name: Credit bureau
third_party_type: Credit bureau
processing_role:
- data_fiduciary
country: India
dpa_status: n/a (independent DF under CICRA)
dpa_r6_security: false
breach_notify_sla_hours: null
tags:
- dpdp/third-party
---

# TP-DEMO-BUREAU - Credit bureau

## Inbound flows
```dataview
TABLE from_system, activity, transfer_type FROM -"90 Templates" WHERE type = "data_flow" AND to = [[TP-DEMO-BUREAU]]
```
