---
type: third_party
tp_id: TP-DEMO-SMS
name: SMS aggregator
third_party_type: SMS/email/WhatsApp provider
processing_role:
- data_processor
country: India
dpa_status: none
dpa_r6_security: false
breach_notify_sla_hours: null
tags:
- dpdp/third-party
---

# TP-DEMO-SMS - SMS aggregator

## Inbound flows
```dataview
TABLE from_system, activity, transfer_type FROM -"90 Templates" WHERE type = "data_flow" AND to = [[TP-DEMO-SMS]]
```
