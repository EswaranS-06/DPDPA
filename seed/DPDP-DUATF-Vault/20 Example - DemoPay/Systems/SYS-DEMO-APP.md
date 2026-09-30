---
type: system
system_id: SYS-DEMO-APP
title: DemoPay mobile app & backend
system_type: Web/app backend
sanctioned: true
owner: ''
hosting: Public cloud - India region
country: India
encryption_at_rest: 'yes'
access_logging: 'yes'
rights_lookup_key: mobile, customer_id
tags:
- dpdp/system
---

# SYS-DEMO-APP - DemoPay mobile app & backend

## Activities using this system
```dataview
LIST FROM -"90 Templates" WHERE type = "processing_activity" AND contains(systems, [[SYS-DEMO-APP]])
```
## Flows from this system
```dataview
TABLE to, transfer_type, country FROM -"90 Templates" WHERE type = "data_flow" AND from_system = [[SYS-DEMO-APP]]
```
