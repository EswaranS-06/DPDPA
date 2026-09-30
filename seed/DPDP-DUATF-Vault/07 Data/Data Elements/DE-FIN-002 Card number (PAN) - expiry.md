---
type: data_element
element_id: DE-FIN-002
title: Card number (PAN) / expiry
category: payment_card
personal_data: true
context_tags:
- financial
note: Tokenise; never store CVV
tags:
- dpdp/data-element
---

# DE-FIN-002 - Card number (PAN) / expiry

Category: `payment_card` | Context: financial

Tokenise; never store CVV

## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-FIN-002 Card number (PAN) - expiry]])
```
