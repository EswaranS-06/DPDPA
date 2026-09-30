---
type: tracker
---

# Regulatory Change Register

Also see [[Notifications Log]].

Create entries from the matching template in `90 Templates`.

```dataview
TABLE date, instrument, impact, status
FROM -"90 Templates" WHERE type = "regulatory_change"
SORT file.name DESC
```
