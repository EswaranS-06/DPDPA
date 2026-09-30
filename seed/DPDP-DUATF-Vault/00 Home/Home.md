---
type: dashboard
cssclasses:
- wide
---

# DPDP Unified Assessment & Tracking Framework (DUATF)

Version 1.0 (2026-09-24) | Legal baseline: DPDP Act 2023 + DPDP Rules 2025 (G.S.R. 846(E)) as verified Sept 2026

> **Countdown:** Phase 2 (Consent Managers) `$= Math.ceil((dv.date("2026-11-13") - dv.date("today"))/86400000)` days | Phase 3 (all obligations) `$= Math.ceil((dv.date("2027-05-13") - dv.date("today"))/86400000)` days

## What's inside
| Layer | Contents | Where |
|---|---|---|
| L0 Governance | Methodology, roadmap, RACI | [[Engagement Methodology]], [[Readiness Roadmap 2026-2027]] |
| L1 Legal KB | 44 sections, 23 rules, 8 schedules, 99 atomic obligations (92 DPDP + 7 linked Indian-law duties) | `02 Legal KB` |
| L2 Scoping | Entity questionnaire, role decision tree, exemptions | [[Entity Scoping Questionnaire]], [[Role Determination Decision Tree]] |
| L3 Org data graph | 124 process templates (41 common + 20 sectors), 91 data elements, vocabularies | [[Process Catalogue Index]], [[Sector Index]] |
| L4 Engine | Python applicability engine: activity flags x obligation triggers | `engine/dpdp_engine.py` |
| L5 Controls | 82 controls in 18 domains with ISO 27001/27701 and NIST CSF crosswalk | `10 Control Library` |
| L6 Assessment | Question bank, PBC list, test types, rating scale | [[Discovery Question Bank]], [[Evidence Request List (PBC)]] |
| L7 Risk | L x I with penalty-tier impact | [[Risk Methodology]] |
| L8 Operations | Rights, breach, DPIA, vendor, change, authority registers | `15 Operations` |
| L9 Reporting | This dashboard (Dataview) | below |

**Start here:** [[README - Start Here]] | **When stuck:** [[Stuck-Point Playbook]] | **How the graph works:** [[Graph Modelling Guide]]

---
## Live dashboard (needs Dataview plugin; enable JavaScript queries for the countdown)

### Activities mapped
```dataview
TABLE department, lawful_basis, flags, confidence, status
FROM -"90 Templates" WHERE type = "processing_activity"
SORT department
```

### Findings by severity
```dataview
TABLE rows.file.link AS Findings, length(rows) AS Count
FROM -"90 Templates" WHERE type = "finding" AND status != "Closed"
GROUP BY severity
```

### Open findings by owner
```dataview
TABLE severity, risk_score, target_date, status
FROM -"90 Templates" WHERE type = "finding" AND status != "Closed"
SORT risk_score DESC
```

### Control ratings (current cycle)
```dataview
TABLE control, rating, test_type, test_date
FROM -"90 Templates" WHERE type = "control_test"
SORT rating ASC
```

### Low-confidence mapping (open discovery)
```dataview
LIST FROM -"90 Templates" WHERE (type = "data_flow" OR type = "processing_activity") AND confidence = "low"
```

### Shadow / unsanctioned systems
```dataview
TABLE system_type, owner, hosting FROM -"90 Templates" WHERE type = "system" AND sanctioned = false
```

### Cross-border recipients
```dataview
TABLE third_party_type, processing_role, country, dpa_status FROM -"90 Templates" WHERE type = "third_party" AND country != "India"
```

### Processors without DPA
```dataview
TABLE third_party_type, country FROM -"90 Templates" WHERE type = "third_party" AND contains(processing_role, "data_processor") AND dpa_status = "none"
```

### Evidence expiring in 60 days
```dataview
TABLE valid_until, controls FROM -"90 Templates" WHERE type = "evidence" AND valid_until AND date(valid_until) <= date(today) + dur(60 days)
```
