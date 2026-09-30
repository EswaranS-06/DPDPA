---
type: data_element
element_id: DE-BIO-001
title: Fingerprint
category: biometric
personal_data: true
context_tags:
- biometric
note: ''
tags:
- dpdp/data-element
---

# DE-BIO-001 - Fingerprint

Category: `biometric` | Context: biometric



## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-BIO-001 Fingerprint]])
```
