---
id: X04
title: Validation Checklist (Render-time & Legal Sign-off)
publish: internal
version: 1.0
---

# Validation Checklist

The UI runs **Part A** automatically on every render. A consultant from [Server-name] completes **Part B** before a deliverable goes to [Client-Name]. **Part C** lists the points counsel must re-confirm against current law before each delivery.

## PART A: Automated render checks
| # | Check | Rule |
|---|---|---|
| A1 | No unfilled `[Placeholder]` remains in the output | Block release |
| A2 | Every `IF` has a matching `END IF`; every `REPEAT` has a matching `END REPEAT`; every `INCLUDE` resolves | Block release |
| A3 | No drafting note (`> **Drafting note`) and no HTML comment remains in the output | Block release |
| A4 | `[Server-name]` does not appear in any template with `publish: public` or `publish: regulator` | Block release |
| A5 | `Grievance-Resolution-Period` ≤ 90 days | Block release (Rule 14(3)) |
| A6 | `Erasure-Pre-Notice-Days` × 24 ≥ 48 hours, where `Third-Schedule-Entity != None` | Block release (Rule 8(2)) |
| A7 | Every purpose in `Consent-Purposes` has non-empty data items, a service description and retention | Block release (Rule 3(b)) |
| A8 | No `Consent-Purposes` item whose name matches marketing / advertising / personalisation / analytics has `Purpose-Mandatory = Yes` | Warn (s.6(1) "free") |
| A9 | `Is-SDF = true` ⇒ DPO-* placeholders are filled, and S01–S03 are generated | Block release |
| A10 | `Processes-Children-Data = true` ⇒ N05 is generated, and no `Cookies` item in the Marketing category is marked child-safe | Block release (s.9(3)) |
| A11 | `Cross-Border-Transfer = true` ⇒ `Cross-Border-Countries` is filled and V05 is generated | Block release |
| A12 | Processor log retention / data retention values ≥ 1 year where shown | Warn (Rules 6(1)(e), 8(3)) |
| A13 | Contact block present in N01, N02, N05, N06, R01, and every R04 letter | Block release (Rule 9) |
| A14 | `Notice-Languages` contains only Eighth Schedule languages | Warn (s.5(3)) |
| A15 | Dates: `Effective-Date` ≤ `Next-Review-Date`; review cycle ≤ 12 months | Warn |

## PART B: Statutory content checklist per template (consultant sign-off)

### Notices (N01, N02, N05, N06; also C01 §4.1 consent screens)
- [ ] The notice is understandable on its own, independent of other information (Rule 3(a))
- [ ] Clear and plain language; written in the second person; no "including but not limited to"
- [ ] Itemised description of personal data (Rule 3(b)(i))
- [ ] Specified purpose(s), plus a specific description of the goods, services or uses each enables (Rule 3(b)(ii))
- [ ] Link and other means to **withdraw consent**, with ease comparable to giving it (Rule 3(c)(i), s.6(4))
- [ ] Link and other means to **exercise rights** (Rule 3(c)(ii))
- [ ] Link and other means to **complain to the Board** (Rule 3(c)(iii), s.5(1)(iii))
- [ ] DPO / privacy-contact business details (s.6(3), s.8(9), Rule 9)
- [ ] English + Eighth Schedule language option (s.5(3))
- [ ] Legitimate-use processing kept separate from consent processing (s.4, s.7)
- [ ] Retention stated per purpose (best practice; supports s.8(7))
- [ ] Children section consistent with whether children's data is processed (s.9)
- [ ] Cross-border statement matches the RoPA (s.16)

### Consent (C01–C04)
- [ ] One control per purpose; off by default; no bundling (s.6(1))
- [ ] Core service works when optional consents are declined
- [ ] Withdrawal path takes no more steps than giving consent (s.6(4))
- [ ] Processors are made to stop processing after withdrawal (s.6(6))
- [ ] Artefact captures the notice version, language, channel, timestamp and actor (s.6(10))
- [ ] Consent Manager registration verified (if used) (s.6(9), Rule 4)
- [ ] VPC evidence fields present for children (Rule 10)

### Governance (G01–G06)
- [ ] Board / approving authority and date filled in (G01)
- [ ] Rule 6(1)(a)–(g) controls all addressed (G03, G04, V01 Annex 2)
- [ ] 1-year minimum retention of logs and personal data (Rules 6(1)(e), 8(3))
- [ ] Third Schedule dormancy rule addressed, if applicable (Rule 8(1),(2))
- [ ] DPIA covers rights + purposes + risk assessment & management (s.10(2)(c)(i))
- [ ] RoPA populated for every purpose that appears in the notices

### Vendor (V01–V05)
- [ ] Valid contract for every processor (s.8(2))
- [ ] Processor breach-notice hours short enough for "without delay" + 72 h (Rule 7) and CERT-In 6 h
- [ ] Purpose limitation, sub-processing approval, deletion / return, audit rights, cross-border clauses present
- [ ] s.17(1)(d) treatment correct for foreign-client processing (only s.8(1) and s.8(5) apply)

### Rights (R01–R04)
- [ ] Means of making requests + identifiers published (Rule 14(1))
- [ ] Grievance response period published and ≤ 90 days (Rule 14(3))
- [ ] Contact information in every response (Rule 9)
- [ ] Access response lists every Data Fiduciary and Data Processor shared with (s.11(1)(b))
- [ ] Nomination process exists (s.14, Rule 14(4))
- [ ] Exhaustion-before-Board explained (s.13(3))

### Breach (B01–B04)
- [ ] No materiality threshold: every breach is intimated
- [ ] DP intimation has all five elements (Rule 7(1)(a)–(e)), through the user account or the registered mode
- [ ] Board initial intimation: nature, extent, timing, location, likely impact (Rule 7(2)(a))
- [ ] Board detailed report has all six elements within 72 h, plus the extension path (Rule 7(2)(b))
- [ ] CERT-In and sector-regulator timelines configured

### SDF (S01–S04)
- [ ] DPO is based in India, responsible to the Board of Directors, and the grievance point of contact (s.10(2)(a))
- [ ] Independent auditor appointed; independence declared (s.10(2)(b))
- [ ] DPIA + audit within each 12-month cycle; significant observations furnished by the assessor / auditor (Rule 13(1),(2))
- [ ] Algorithmic due diligence recorded (Rule 13(3))
- [ ] Localisation of specified data and traffic data, if notified (Rule 13(4))

## PART C: Points counsel must re-confirm before each delivery (moving parts)
| # | Item | Why |
|---|---|---|
| C1 | Fourth Schedule wording (children's exemptions) | Paraphrased in N05 Part C5 |
| C2 | First Schedule Consent Manager conditions (net worth, record retention period) | Paraphrased in C03 §3 |
| C3 | Rule 14(3) exact wording | A secondary source had garbled text; the 90-day ceiling is consistent across sources |
| C4 | Any s.16 restricted-country notification / Rule 15 orders | None known at drafting (15 Oct 2026) |
| C5 | Any SDF notifications / classes; any Rule 13(4) localisation list | None known at drafting |
| C6 | Board digital-office URLs and any prescribed forms (complaints, breach intimation) | Placeholders `DPB-Complaint-URL`, `DPB-Breach-Portal` |
| C7 | Sector-regulator incident-reporting timelines (RBI / SEBI / IRDAI / DoT) | Change frequently |
| C8 | Statutory retention periods in the G02 starter rows (state medical-record rules, labour codes) | Vary by state and sector |
| C9 | Any MeitY FAQs / Board guidance issued after Nov 2025 on notice format, consent UX or VPC | May refine practice |
| C10 | Amendments to the Act or Rules (e.g. RTI s.8(1)(j) amendment via s.44(3) is already in force) | Change in law |
