---
type: tracker
---

# Vendor Review Calendar

Annual for critical/high tier.

Create entries from the matching template in `90 Templates`.

```dataview
TABLE third_party_type, processing_role, country, dpa_status, risk_tier, last_review
FROM -"90 Templates" WHERE type = "third_party"
SORT file.name DESC
```
