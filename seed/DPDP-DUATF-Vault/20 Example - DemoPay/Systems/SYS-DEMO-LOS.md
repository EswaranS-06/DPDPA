---
type: system
system_id: SYS-DEMO-LOS
title: Loan Origination System
system_type: Core/line-of-business application
sanctioned: true
owner: ''
hosting: Public cloud - India region
country: India
encryption_at_rest: 'yes'
access_logging: partial
rights_lookup_key: customer_id, PAN
tags:
- dpdp/system
---

# SYS-DEMO-LOS - Loan Origination System

## Activities using this system
```dataview
LIST FROM -"90 Templates" WHERE type = "processing_activity" AND contains(systems, [[SYS-DEMO-LOS]])
```
## Flows from this system
```dataview
TABLE to, transfer_type, country FROM -"90 Templates" WHERE type = "data_flow" AND from_system = [[SYS-DEMO-LOS]]
```
