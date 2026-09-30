---
type: data_element
element_id: DE-FIN-008
title: Tax details (TDS, ITR, Form 16)
category: tax
personal_data: true
context_tags:
- financial
note: ''
tags:
- dpdp/data-element
---

# DE-FIN-008 - Tax details (TDS, ITR, Form 16)

Category: `tax` | Context: financial



## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-FIN-008 Tax details (TDS, ITR, Form 16)]])
```
