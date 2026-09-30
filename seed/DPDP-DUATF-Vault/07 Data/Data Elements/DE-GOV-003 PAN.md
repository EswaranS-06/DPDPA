---
type: data_element
element_id: DE-GOV-003
title: PAN
category: gov_id
personal_data: true
context_tags:
- gov_id
- financial
note: ''
tags:
- dpdp/data-element
---

# DE-GOV-003 - PAN

Category: `gov_id` | Context: gov_id,financial



## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-GOV-003 PAN]])
```
