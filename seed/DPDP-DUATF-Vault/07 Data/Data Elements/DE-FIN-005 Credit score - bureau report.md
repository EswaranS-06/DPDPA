---
type: data_element
element_id: DE-FIN-005
title: Credit score / bureau report
category: credit_history
personal_data: true
context_tags:
- financial
note: ''
tags:
- dpdp/data-element
---

# DE-FIN-005 - Credit score / bureau report

Category: `credit_history` | Context: financial



## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-FIN-005 Credit score - bureau report]])
```
