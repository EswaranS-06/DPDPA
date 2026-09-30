---
type: data_element
element_id: DE-FIN-009
title: Insurance policy details
category: financial
personal_data: true
context_tags:
- financial
note: ''
tags:
- dpdp/data-element
---

# DE-FIN-009 - Insurance policy details

Category: `financial` | Context: financial



## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-FIN-009 Insurance policy details]])
```
