---
type: data_element
element_id: DE-FIN-006
title: Transaction history
category: transaction
personal_data: true
context_tags:
- financial
note: ''
tags:
- dpdp/data-element
---

# DE-FIN-006 - Transaction history

Category: `transaction` | Context: financial



## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-FIN-006 Transaction history]])
```
