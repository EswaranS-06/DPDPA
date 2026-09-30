---
type: system
system_id: SYS-DEMO-NVR
title: CCTV NVR - Bengaluru office
system_type: Physical security (CCTV/PACS/VMS)
sanctioned: true
owner: ''
hosting: On-prem India
country: India
encryption_at_rest: 'no'
access_logging: 'no'
rights_lookup_key: date/time
tags:
- dpdp/system
---

# SYS-DEMO-NVR - CCTV NVR - Bengaluru office

## Activities using this system
```dataview
LIST FROM -"90 Templates" WHERE type = "processing_activity" AND contains(systems, [[SYS-DEMO-NVR]])
```
## Flows from this system
```dataview
TABLE to, transfer_type, country FROM -"90 Templates" WHERE type = "data_flow" AND from_system = [[SYS-DEMO-NVR]]
```
