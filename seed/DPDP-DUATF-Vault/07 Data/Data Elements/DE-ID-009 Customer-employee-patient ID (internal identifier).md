---
type: data_element
element_id: DE-ID-009
title: Customer/employee/patient ID (internal identifier)
category: identity
personal_data: true
context_tags: []
note: Rule 14(5) identifier
tags:
- dpdp/data-element
---

# DE-ID-009 - Customer/employee/patient ID (internal identifier)

Category: `identity` | Context: -

Rule 14(5) identifier

## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-ID-009 Customer-employee-patient ID (internal identifier)]])
```
