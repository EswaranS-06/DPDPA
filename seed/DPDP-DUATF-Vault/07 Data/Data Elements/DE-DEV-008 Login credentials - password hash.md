---
type: data_element
element_id: DE-DEV-008
title: Login credentials / password hash
category: credential
personal_data: true
context_tags: []
note: 'SPDI: password = SPD'
tags:
- dpdp/data-element
---

# DE-DEV-008 - Login credentials / password hash

Category: `credential` | Context: -

SPDI: password = SPD

## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-DEV-008 Login credentials - password hash]])
```
