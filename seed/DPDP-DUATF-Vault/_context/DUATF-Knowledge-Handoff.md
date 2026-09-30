---
type: context_handoff
title: DUATF Knowledge & Findings Handoff
exported: 2026-09-25
source: Claude conversation (brainstorm + build, 23-25 Sep 2026)
tags: [dpdp/context]
---

# DUATF - Knowledge & Findings Handoff

This file carries everything established so far about the **DPDP Unified Assessment & Tracking Framework (DUATF)**, so a new session (e.g. Claude Code working in this vault) can continue without re-deriving it. It covers the project context, the verified legal knowledge, the framework design (v1 as built), the validation findings, and the agreed direction (v0.2).

---

## 1. Project context (about the user & the work)

- The user works with a team to build a **universal DPDPA framework**: structure, workflow, mapping and mind map, for use across sectors and domains.
- **Obsidian** is the working tool. Tags and properties drive the structured mind map and graph.
- The user's company is **Xyberu Cybersecurity Services**. It acts as DPDPA auditor/assessor for clients and has its own logo and cover-page branding for client deliverables.
- The user has done **real DPDPA client assessments** and got stuck because real processing is a **graph, not a linear flow**. The framework must work in real client fieldwork.
- The current client engagement is as DPDPA assessor for a Data Fiduciary entity called **"Mallard"**.
- The framework must cover **all sectors**, not only healthcare. Healthcare was the first template-set focus and the original worked example (hospital).
- The user's original research note (the "DPDP Assessment Framework" draft) set the core philosophy:
  - **process-first, law as the mapping layer**;
  - the chain Organisation → Department → Process → Activity → Data Event → ... → Obligation → Control → Evidence → Finding → Remediation;
  - a three-layer split (Legal model / Organisation data model / Assessment model);
  - controlled vocabularies;
  - findings tied to processes, never "Section 8 non-compliant".

---

## 2. Verified legal knowledge (checked against Gazette text via dpdprules.org, Sept 2026)

### 2.1 Instruments & commencement
- **DPDP Act 2023**, Act No. 22 of 2023. Assent 11 Aug 2023. 9 chapters, 44 sections, one penalty Schedule.
- **DPDP Rules 2025**, G.S.R. 846(E). Commencement notification G.S.R. 843(E). Board established the same day. Corrigenda G.S.R. 892(E) changed wording only.
- **Phases** (computed from printed Gazette date 13 Nov 2025; eGazette code and PIB say 14 Nov 2025, which would shift each date by +1 day, so plan to the earlier date):

| Phase | Date | Act | Rules |
|---|---|---|---|
| 1 | 13 Nov 2025 (in force) | s.1(2), 2, 18-26, 35, 38-43, 44(1),(3) | R1, R2, R17-R21 |
| 2 | 13 Nov 2026 | s.6(9), 27(1)(d) | R4 (Consent Manager) |
| 3 | 13 May 2027 | s.3-5, 6(1)-(8),(10), 7-17, 27 (rest), 28-34, 36, 37, 44(2) | R3, R5-R16, R22, R23 |

- As of Sept 2026 **no penalty can be imposed**: s.33 has not commenced and no Board Chair/Members have been appointed on record. **SPDI Rules 2011 / IT Act s.43A still apply** until s.44(2) commences (Phase 3). **CERT-In Directions (28 Apr 2022) apply now.**

### 2.2 Key sections
- **s.3 Applicability:**
  - Covers digital personal data processed in India (collected digitally, or collected offline and digitised).
  - Covers processing outside India connected with offering goods/services to DPs in India.
  - Excludes personal/domestic use, and data made public by the DP or under a legal duty.
  - There is **no size threshold anywhere** in the Act or Rules.
- **s.4:** two grounds only: consent (s.6) or legitimate uses (s.7).
- **s.5 Notice:** must accompany or precede the consent request. Legacy consents (given before commencement) need notice "as soon as reasonably practicable" (s.5(2)). English or any Eighth Schedule language (s.5(3)).
- **s.6 Consent:**
  - (1) free, specific, informed, unconditional, unambiguous, clear affirmative action, necessary data only;
  - (2) infringing terms invalid;
  - (3) plain language + languages + DPO/contact;
  - (4) withdrawal with comparable ease;
  - (5) consequences of withdrawal fall on the DP;
  - (6) cease processing and cause processors to cease within reasonable time;
  - (7)-(9) Consent Managers;
  - (10) burden of proof on the DF.
- **s.7 legitimate uses**, a closed list, no balancing test:
  - (a) voluntarily provided, no objection;
  - (b) State subsidy/benefit/service/licence;
  - (c) State functions/sovereignty/security;
  - (d) legal duty to disclose to State;
  - (e) judgment/decree/order;
  - (f) medical emergency;
  - (g) epidemic/public health;
  - (h) disaster/public order;
  - (i) employment / safeguarding employer.
- **s.8 general obligations:**
  - (1) accountability irrespective of processors;
  - (2) processors only under contract;
  - (3) accuracy where used for decisions or disclosed to another DF;
  - (4) TOMs;
  - (5) security safeguards;
  - (6) breach intimation to Board + each DP;
  - (7) erase on withdrawal or purpose end unless law requires retention; cause processors to erase;
  - (8) deemed purpose-end after inactivity (Rule 8);
  - (9) publish DPO/contact;
  - (10) grievance mechanism;
  - (11) "approach" defined.
- **s.9 children** (under 18) and PwD with lawful guardian:
  - (1) verifiable parental/guardian consent;
  - (2) no detrimental processing;
  - (3) no tracking, behavioural monitoring or targeted ads directed at children;
  - (4)-(5) exemptions.
- **s.10 SDF:**
  - Notified based on volume and sensitivity, risk to rights, sovereignty, electoral democracy, security and public order.
  - Duties: DPO based in India and responsible to the board; independent data auditor; periodic DPIA + audit; other measures.
  - **No SDF notified as of 2026.**
- **s.11-14 rights:** access (summary + recipients), correction/completion/updating/erasure, grievance, nomination. s.11/12 rights attach to consent and s.7(a) processing.
- **s.15 DP duties:** penalty up to Rs 10,000.
- **s.16:** negative list of restricted countries (none notified yet). **s.16(2): stricter sectoral transfer and localisation laws survive** (RBI, IRDAI, SEBI, etc.).
- **s.17 exemptions:**
  - 17(1)(a)-(f): legal claims; courts/regulators; crime; non-India DPs under foreign contract (BPO); court-approved schemes; loan defaulters. These disapply Ch II (**except s.8(1), 8(5)**), Ch III and s.16. On a literal reading this includes s.8(6) breach intimation, which is an interpretation point.
  - 17(2): notified State instrumentalities; research/archiving/statistics (with Second Schedule standards). The Act does not apply.
  - 17(3): notified DFs/startups are exempt from s.5, 8(3), 8(7), 10, 11.
  - 17(4): State is exempt from s.8(7), 12(3), and 12(2) conditionally.
  - 17(5): notified exemptions within 5 years.
- **s.29:** appeal to TDSAT within 60 days. **s.32:** voluntary undertaking. **s.33:** penalty factors. **s.37:** blocking after penalties in 2+ instances. **s.44(3):** RTI s.8(1)(j) amended.

### 2.3 Rules
- **R3 Notice:** standalone; plain language; itemised data; specified purposes + goods/services; communication link/means to withdraw, exercise rights and complain to the Board.
- **R4 Consent Manager** (Phase 2): First Schedule.
  - Part A: Indian company, net worth >= Rs 2 crore, capacity, fit & proper, certified interoperable platform.
  - Part B (13 duties): content not readable by the CM; records >= 7 years, machine-readable for the DP; no sub-contracting; security; fiduciary capacity; conflict-of-interest rules; disclose promoters/shareholding; audit reporting to the Board; Board approval for change of control.
- **R5:** State processing under s.7(b) per Second Schedule.
- **R6 security, minimum set:**
  - (a) encryption/obfuscation/masking/virtual tokens;
  - (b) access control;
  - (c) logs, monitoring, review;
  - (d) continuity/backups;
  - (e) **retain logs & PD 1 year**;
  - (f) processor contract clauses;
  - (g) TOMs.
- **R7 breach:**
  - (1) each affected DP, without delay: description, consequences, mitigation, safety steps, contact;
  - (2)(a) Board without delay: nature, extent, timing, location, impact;
  - (2)(b) **Board within 72 h** (extendable on written request): updated details, circumstances, mitigation, cause, remedial measures, report on DP intimations.
- **R8 retention:**
  - (1) Third Schedule erasure after inactivity;
  - (2) **48-hour pre-erasure notice**;
  - (3) **all DFs retain PD, traffic data & logs >= 1 year** for Seventh Schedule purposes.
- **R9:** publish DPO/contact prominently; mention it in every rights response.
- **R10 child verifiable consent:** parent must be an identifiable adult, verified via reliable details already held, voluntarily provided details, or a virtual token from an authorised entity (incl. DigiLocker).
- **R11 PwD guardian:** appointed by a court, a designated authority (RPwD Act 2016 s.15) or a local level committee (National Trust Act 1999 s.13).
- **R12 + Fourth Schedule** (exemptions from s.9(1),(3)):
  - Part A classes: clinical/mental-health establishments & healthcare professionals (health services); allied healthcare (treatment/referral); **educational institutions** (tracking/monitoring for education or safety only; **edtech companies are not automatically covered**); creche/day care; child transport (location during travel).
  - Part B purposes: powers under law in the child's interest; subsidy/benefit; email account creation; real-time location for safety; preventing harmful content; confirming the DP is not a child.
- **R13 SDF:**
  - (1) DPIA + audit every 12 months from notification;
  - (2) report of significant observations to the Board;
  - (3) algorithmic due diligence;
  - (4) localisation of Govt-specified data + traffic data (committee).
- **R14 rights:**
  - (1) publish means + identifiers on website/app;
  - (3) **grievance response within <= 90 days**;
  - (4) nomination;
  - (5) "identifier" = customer no., application ref, email, mobile, licence no., etc.
- **R15:** cross-border transfer subject to Govt requirements on making data available to a foreign State. There is **no general localisation.**
- **R16:** research exemption subject to Second Schedule. **R22:** TDSAT appeals. **R23 + Seventh Schedule:** Govt information calls; confidentiality direction possible.

### 2.4 Schedules
- **Act Schedule (penalty caps):**
  - (1) s.8(5) security Rs 250 cr;
  - (2) s.8(6) breach intimation Rs 200 cr;
  - (3) s.9 children Rs 200 cr;
  - (4) s.10 SDF Rs 150 cr;
  - (5) s.15 DP duties Rs 10,000;
  - (6) s.32 undertaking: same as the underlying breach;
  - (7) any other Rs 50 cr.
- **Rules Schedules:**
  - 1st: Consent Manager.
  - 2nd: State/research standards.
  - **3rd: e-commerce >= 2 cr users, online gaming >= 50 lakh, social media >= 2 cr. Erase after 3 years from last approach or commencement, whichever is later (except account access & virtual tokens).**
  - 4th: children exemptions.
  - 5th/6th: Board staff.
  - 7th: purposes/authorised persons for info calls + the R8(3) anchor.

### 2.5 Parallel Indian-law duties to track alongside DPDP
- **CERT-In Directions 2022:**
  - 6-hour incident reporting;
  - ICT logs retained 180 days in India;
  - NTP clock sync;
  - PoC designation;
  - cloud/VPN/data-centre providers keep subscriber KYC 5 years.
- **SPDI Rules 2011** until Phase 3.
- **TRAI TCCCPR** (DLT, marketing consent).
- **CCPA Dark Patterns Guidelines 2023** (consent UI).
- **Sector anchors:**
  - RBI payment data localisation (2018);
  - PMLA records 5 yrs after relationship;
  - Companies Act books 8 yrs;
  - CGST 72 months;
  - IMC Regs indoor medical records 3 yrs;
  - PCPNDT 2 yrs;
  - Schedule H1 register 3 yrs;
  - IT Rules 2021 user info 180 days after deletion;
  - DoT CDR/IPDR 2 yrs;
  - SEBI PIT database 8 yrs.
  - Many other sector items carry a **"verify"** flag and must be checked before being cited to a client.

---

## 3. DUATF v1 as built (already in this vault)

Generated vault `DPDP-DUATF-Vault` + Excel `DPDP-DUATF-Master-Register.xlsx` (same IDs). Contents:

- **Legal KB:** 44 section notes, 23 rule notes, 8 schedule notes, 19 lawful-basis codes. **99 atomic obligations** (92 DPDP `OBL-*` + 7 linked Indian-law `LNK-*`), each with a trigger, penalty tier, phase, evidence and mapped controls.
- **18 domains:**
  - D01 Governance;
  - D02 Scoping;
  - D03 Inventory;
  - D04 Lawful basis;
  - D05 Notice;
  - D06 Consent;
  - D07 Children/PwD;
  - D08 Data quality;
  - D09 Security;
  - D10 Breach;
  - D11 Retention;
  - D12 Rights;
  - D13 Processors;
  - D14 Cross-border;
  - D15 SDF;
  - D16 Regulatory interface;
  - D17 State/Research;
  - D18 Consent Manager ops.
- **82 controls** with test procedure, evidence, and crosswalk to ISO 27001:2022, ISO 27701:2019 and NIST CSF 2.0. Every obligation maps to at least one control.
- **124 process templates:** 41 common functions + 83 across **20 sector overlays**:
  - financial: Banking, NBFC/Fintech, Insurance, Capital Markets;
  - health: Healthcare, Pharma;
  - consumer & platforms: Education/EdTech, E-commerce, Social/Gaming, Telecom, IT/SaaS/BPO;
  - public & industrial: Government, Manufacturing, Hospitality/Travel, Real Estate, Logistics, Media/OTT, NGO, Utilities, Professional Services.
  - Each overlay lists regulators, laws, localisation, retention anchors, hotspots and stuck points.
- **91 data elements**, 17 vocabularies, 22 templates.
- **Engine** `engine/dpdp_engine.py`:
  - Reads `processing_activity` notes (`lawful_basis`, `flags`, `processing_role`, linked `entity_profile`) and evaluates obligation triggers, with s.17 / SDF / CM / State / processor logic.
  - Writes `11 Assessments/Engine Output/Applicability - <ACT>.md` + CSV.
  - Run from the vault root: `python3 engine/dpdp_engine.py`. Needs PyYAML.
  - **Engine flags:** children, pwd, processor, cross_border, third_schedule, decision_or_disclosure, legacy_data, online_presence, consent_manager_used, tracking_ads, marketing, research.
  - **Context tags** (risk only): health, financial, biometric, gov_id, location, cctv, ai.
- **Playbooks:**
  - Engagement Methodology (stages 0-7);
  - Readiness Roadmap;
  - Entity Scoping Questionnaire;
  - Role Decision Tree;
  - Discovery Question Bank;
  - PBC list (34 items);
  - **Stuck-Point Playbook (SP-01 to SP-25)**;
  - Graph Modelling Guide (IDs: ORG-, DEP-, PRC-, ACT-, EVT-, PUR-, SYS-, TP-, FLW-, NTC-, RET-, OBL-, CTL-, TST-, EVD-, FND-, REM-);
  - Risk Methodology: L x I; bands 17-25 Critical, 10-16 High, 5-9 Medium, 1-4 Low; impact floor from penalty tier.
- **Worked example:** "DemoPay" (fictional digital NBFC): 6 activities, 6 systems, 7 third parties, 13 flows, 5 tests, 4 findings.
- **Validation done on v1:**
  - YAML valid;
  - the only broken links are template placeholders;
  - the Excel formula engine and the Python engine agree (67 applicable obligations for the DemoPay onboarding activity);
  - scenario tests passed for s.17(1), s.17(2), children, SDF, processor and State;
  - the workbook has 7,171 formulas and 0 errors.
- `_framework-source/` holds the Python data modules and generators. Regenerating overwrites framework notes, so **client work goes in `20 Client/`**.

**User feedback on v1:** the registry/vault is **not the main focus**. Focus on getting the **framework logic right**: a clean starting point, validated, then brainstorm gaps and fix them for overall use.

---

## 4. Validation findings - gaps in v0.1/v1 (agreed direction)

Stress test against 6 scenarios:
- **Hospital, partial:** security duplicated per activity.
- **Pure SaaS processor, fail:** no processor track.
- **40-entity bank group, fail:** no entity/group layer.
- **Edtech with children, partial:** child flag is per activity, not per person.
- **50-person startup, fail:** 99 obligations are unusable at that size.
- **Retailer with bundled consent, partial:** basis sits on the activity, not the purpose.

| # | Gap | Fix (v0.2) |
|---|---|---|
| G1 | **Obligations anchored at the wrong level** (all on the activity → duplicate findings) | Add `anchor_level` to every obligation: **Entity** (DPO, grievance, breach capability, SDF, rights publication), **Purpose** (basis, notice, consent, withdrawal, retention, s.7 justification), **Principal cohort** (children, PwD, legacy, nominees), **Flow/relationship** (processor contract, cross-border, DF-to-DF sharing, accuracy of disclosure), **System** (R6 security, logging, backup, deletion). Evaluate once per anchor; roll up. |
| G2 | Maturity and compliance mixed | Two results: **Compliance status** (Met / Partially met / Not met / Not yet testable) drives findings; **Maturity 0-4** (optional) drives the roadmap. |
| G3 | No testable acceptance criteria | 3-6 criteria per obligation. For example, s.6(4) withdrawal = same channel + steps <= consent + downstream effect within SLA + ledger record. |
| G4 | No interpretation register | **Interpretation Decisions Log**: question, options, position, rationale, risk if Board disagrees, review date. Open items: "reasonable time" after withdrawal; scope of s.7(a); employee consent vs s.7(i); what counts as "approach" (R8); whether s.17(1) removes breach intimation; child when age unknown. |
| G5 | Entity assumed to be a DF | Three tracks: **Fiduciary / Processor / Consent Manager**. The Processor track covers contracts, R6 clauses, breach SLA, erasure on instruction, sub-processors and the s.17(1)(d) split. Mixed entities run both tracks per activity. |
| G6 | No proportionality | Tiers: **Core (~35)** for every DF; **Extended** (fact-triggered); **SDF** (on notification). Size changes evidence depth, not applicability. |
| G7 | No entity/group layer | **Legal Entity is the root.** A group is a set of entities. Intra-group flow = DF-to-DF unless a shared-services entity acts as processor. |
| G8 | Time ignored | Modes: **Readiness** (before 13 May 2027), **Compliance** (after), **Re-assessment** (triggered by new product, vendor, notification, SDF designation or breach). |
| G9 | No legal verdict per obligation | **Obligation Status Roll-up** per entity: worst status across anchors, with drill-down. |
| G10 | Framework itself not piloted | Pilot protocol (below). |

**DUATF v0.2 core model:**
```text
LEGAL ENTITY (role track: Fiduciary / Processor / CM / State)
 ├─ Scoping gate → tiers on (Core / Extended / SDF)
 ├─ Discovery graph: Purpose ◄─► Activity ◄─► System ◄─► Flow ◄─► Recipient
 │                   Principal cohorts attach to purposes
 ├─ Obligations anchored at: Entity | Purpose | Cohort | Flow | System
 │     each with acceptance criteria + linked interpretation decision
 ├─ Test once per anchor → Compliance status (+ optional maturity)
 ├─ Roll-up → Obligation status per entity → Findings (deduplicated)
 └─ Mode: Readiness | Compliance | Re-assessment trigger
```

**Pilot/validation protocol:** 3 contrasting cases (a real past client, e.g. Mallard-type; a pure processor; a consumer app with children). Measure:
- **coverage:** every operative section reached;
- **duplication:** findings per root cause ≈ 1;
- **consistency:** two assessors reach >= 90% agreement on obligation statuses;
- **effort:** hours per activity vs the current method.

---

## 5. Open questions for the user (to continue the brainstorm)

1. Who runs DUATF: Xyberu consultants assessing clients, or client staff self-assessing? This decides how much judgement goes into rules versus the assessor.
2. The exact moments the user got stuck in the real engagement (2-3 examples). These are the first validation cases for v0.2.
3. What the client receives at the end: gap report, Board-level compliance opinion, roadmap, or ongoing tracking. This shapes roll-up and scoring. (Xyberu-branded deliverables with logo/cover page exist.)

---

## 6. Suggested next steps in this vault (for a Claude Code session)

1. Add `anchor_level` (entity | purpose | cohort | flow | system) and `tier` (core | extended | sdf) to every note in `02 Legal KB/Obligations/`. Keep `trigger`.
2. Add `acceptance_criteria:` (list) to each obligation, starting with the Core tier.
3. Create `02 Legal KB/Interpretation Decisions Log.md` with the G4 items.
4. Add `Legal Entity` + `Group` templates. Add `track` (fiduciary / processor / consent_manager) to the Entity Profile.
5. Move `lawful_basis` from activities onto **Purpose** notes; activities inherit it via `purposes:` links.
6. Update `engine/dpdp_engine.py`:
   - evaluate per anchor;
   - de-duplicate;
   - output an **Obligation Status Roll-up** per entity;
   - support the modes readiness / compliance.
7. Split `Control Test` results into `compliance_status` + `maturity`.
8. Pilot on one real (anonymised) client in `20 Client/`, then measure with the protocol above.

Disclaimer: this is a working compliance framework, not legal advice. Items marked "verify" and all computed dates must be confirmed against the official text.
