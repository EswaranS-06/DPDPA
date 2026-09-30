---
type: vocabulary
tags:
- dpdp/vocabulary
---

# Context Tags

Set on `processing_activity.context_tags`. They drive risk scoring, not applicability.

| Tag | Meaning | Impact weight |
|---|---|---|
| `health` | Health, medical, disability, mental health, genetic | 5 |
| `financial` | Bank, card, income, credit, transactions | 4 |
| `biometric` | Fingerprint, face template, iris, voiceprint | 5 |
| `gov_id` | Aadhaar, PAN, passport, voter ID, DL | 4 |
| `location` | Precise or continuous location | 3 |
| `cctv` | Video surveillance | 3 |
| `ai` | Automated decision-making / ML / profiling / LLM | 3 |
