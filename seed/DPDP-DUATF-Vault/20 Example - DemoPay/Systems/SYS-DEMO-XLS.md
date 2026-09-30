---
type: system
system_id: SYS-DEMO-XLS
title: Collections tracker (Excel on shared drive)
system_type: Spreadsheet (shadow)
sanctioned: false
owner: ''
hosting: SaaS - outside India
country: Unknown
encryption_at_rest: 'no'
access_logging: 'no'
rights_lookup_key: loan_no
tags:
- dpdp/system
---

# SYS-DEMO-XLS - Collections tracker (Excel on shared drive)

## Activities using this system
```dataview
LIST FROM -"90 Templates" WHERE type = "processing_activity" AND contains(systems, [[SYS-DEMO-XLS]])
```
## Flows from this system
```dataview
TABLE to, transfer_type, country FROM -"90 Templates" WHERE type = "data_flow" AND from_system = [[SYS-DEMO-XLS]]
```
