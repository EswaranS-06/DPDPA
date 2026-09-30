---
type: tracker
---

# Authority Request Register

R23 & law-enforcement requests; restricted confidentiality.

Create entries from the matching template in `90 Templates`.

```dataview
TABLE received_on, authority, legal_basis, confidentiality_direction, responded_on
FROM -"90 Templates" WHERE type = "authority_request"
SORT file.name DESC
```
