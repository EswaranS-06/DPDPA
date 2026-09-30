---
type: data_element
element_id: DE-DEV-006
title: SMS inbox data (read for underwriting)
category: communication_content
personal_data: true
context_tags:
- financial
note: Digital lending restrictions
tags:
- dpdp/data-element
---

# DE-DEV-006 - SMS inbox data (read for underwriting)

Category: `communication_content` | Context: financial

Digital lending restrictions

## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-DEV-006 SMS inbox data (read for underwriting)]])
```
