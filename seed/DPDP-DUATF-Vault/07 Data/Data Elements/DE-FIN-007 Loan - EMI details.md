---
type: data_element
element_id: DE-FIN-007
title: Loan / EMI details
category: financial
personal_data: true
context_tags:
- financial
note: ''
tags:
- dpdp/data-element
---

# DE-FIN-007 - Loan / EMI details

Category: `financial` | Context: financial



## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-FIN-007 Loan - EMI details]])
```
