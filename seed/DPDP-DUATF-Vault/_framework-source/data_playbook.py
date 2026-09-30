"""Methodology & playbook content (markdown bodies)."""

METHODOLOGY = r"""
# Engagement Methodology - DPDP Unified Assessment & Tracking Framework (DUATF)

The framework runs as **7 stages**. Stages 2-4 loop: every new discovery (a system, a vendor, a WhatsApp group) goes back into the graph and the engine re-computes what applies.

```mermaid
flowchart LR
  S0[0 Mobilise] --> S1[1 Scope & Profile]
  S1 --> S2[2 Discover & Map]
  S2 --> S3[3 Apply Engine]
  S3 --> S4[4 Test Controls]
  S4 --> S2
  S4 --> S5[5 Risk & Roadmap]
  S5 --> S6[6 Remediate]
  S6 --> S7[7 Operate & Monitor]
  S7 --> S2
```

| Stage | Goal | Key activities | Framework objects produced | Exit criteria |
|---|---|---|---|---|
| **0 Mobilise** | Sponsor, team, access | Kick-off, RACI, PBC list issued, vault cloned | Programme, Assessment Cycle, Roles | Sponsor sign-off; SPOCs per department named |
| **1 Scope & Profile** | Know what law applies to *this* entity | Entity scoping questionnaire, role decision tree, sector overlay selection, exemption screen | Entity Profile, Exemption register, Sector overlay links | Profile approved by Legal |
| **2 Discover & Map** | Reconstruct reality as a graph | Department workshops (question bank), system inventory, vendor reconciliation, shadow-data scan, walk-throughs | Processes, Activities, Data Events, Purposes, Systems, Third Parties, Data Flows | >= 90% of in-scope departments mapped; every activity has purpose + basis + system |
| **3 Apply engine** | Derive applicable obligations | Set activity flags; run `engine/dpdp_engine.py`; review N/A decisions | Applicable Requirement lists per activity | Legal reviews engine output & overrides |
| **4 Test controls** | Evidence-based rating | Map obligations -> controls; test (inquiry + one stronger test); rate 0-4 | Control Tests, Evidence, Findings | All P1/P2/P3 (Rs 200-250 cr) obligations tested |
| **5 Risk & roadmap** | Prioritise | Score findings (L x I), group into remediation workstreams, align to Nov-2026 / May-2027 dates | Risks, Remediation plan | Management accepts roadmap |
| **6 Remediate** | Close gaps | Workstreams: notice & consent, rights, retention, vendor DPAs, security, breach | Remediation actions, retest evidence | Findings closed after retest |
| **7 Operate** | BAU compliance | Rights log, breach register, consent ledger, vendor reviews, DPIA calendar, regulatory change log | Operations trackers | KPIs reported quarterly |

## Indicative effort (first cycle)

| Organisation size | Departments | Typical activities | Stage 1-5 duration | Team |
|---|---|---|---|---|
| Small (< 200 staff, 1 product) | 5-8 | 30-60 | 4-6 weeks | 2 |
| Mid (200-2,000 staff, few products) | 8-15 | 80-200 | 8-12 weeks | 3-4 |
| Large / regulated (> 2,000, multi-entity) | 15-40 | 250-800 | 14-24 weeks (per entity waves) | 5-10 |

## Assessment rules of thumb
1. **Inquiry alone never rates above 1.** A rating of 3+ requires inspection, observation, re-performance or data analytics.
2. **Test the front line.** Watch a receptionist, branch officer or field agent collect data. Paper and verbal channels are where notice fails.
3. **Re-perform the rights.** Submit a real access, erasure and withdrawal request through a public channel and time it.
4. **Follow the data out.** For every activity, ask "who else sees this?" until you reach the last recipient. Vendors of vendors count.
5. **One finding, one owner, one activity.** Never "Section 8 non-compliant".
6. **Record N/A with a reason.** Every not-applicable decision must link to the flag or exemption that caused it.
"""

ROADMAP = r"""
# Readiness Roadmap - aligned to DPDP commencement

> Dates are computed from the printed Gazette date 13 Nov 2025 (eGazette/PIB show 14 Nov 2025). Plan to the earlier date.

| Window | Today -> 13 Nov 2026 (Phase 2) | 13 Nov 2026 -> Feb 2027 | Feb 2027 -> 13 May 2027 (Phase 3) | After 13 May 2027 |
|---|---|---|---|---|
| Governance | Charter, RACI, DPO/contact, policy suite drafted | Policies approved, training launched | Board reporting live | Quarterly KPIs, annual review |
| Scoping & mapping | Entity profile; RoPA for top-risk depts | RoPA complete; vendor inventory reconciled | Register refresh process running | Semi-annual refresh |
| Notice & consent | Notice master template; consent ledger design | Build consent UI & ledger; Consent Manager integration plan | Legacy notice campaign; go-live | Monitor withdrawals, CM events |
| Children & PwD | Identify child/PwD exposure | Age-gating & parental consent build | Disable tracking/ads for child accounts | Periodic tests |
| Security (R6) | Gap vs R6 a-g | Encryption/masking/logging fixes | 1-year log retention verified | Continuous |
| Breach | IR plan with 6h/72h clocks | Templates, DP notification capability | Tabletop exercise | Annual tabletop |
| Retention | Retention schedule reconciled with sector laws | Deletion jobs design | Jobs live (incl. Third Schedule if applicable) | Monthly exception report |
| Rights & grievance | Channels & SOP design | Tooling, identity verification | Rights page live; 90-day SLA tracking | Weekly ageing |
| Vendors | Tier vendors; DPA template | Re-paper top-tier vendors | All processors on DPA | Annual reviews |
| Cross-border | Transfer register | Sector localisation check | Negative-list monitoring | On notification |
| SDF (if likely) | Readiness assessment | DPO/auditor selection | DPIA methodology | Annual DPIA & audit |
"""

SCOPING_Q = r"""
# Entity Scoping Questionnaire (Stage 1)

Answer once per **legal entity**. Group companies are separate Data Fiduciaries.

## A. Territorial & material scope (s.3)
1. Does the entity process personal data of individuals in India? (If yes -> s.3(a).)
2. Is any processing done outside India to offer goods/services to people in India? (s.3(b).)
3. Is any personal data collected on paper and never digitised? List it. It is out of DPDP scope, but other laws and security still apply.
4. Does the entity process data made publicly available by the individual, or under a legal obligation to publish? (s.3(c)(ii) exclusion.)
5. Is any processing for purely personal/domestic purposes (e.g. a sole proprietor's personal phonebook)?

## B. Role (s.2)
6. For each business line, who decides **why** and **how** personal data is processed? (Fiduciary vs processor.)
7. Does the entity process data **on behalf of** clients? List the clients and the services.
8. Are there arrangements where two entities jointly decide purposes (co-branding, co-lending, group shared services)?
9. Does the entity intend to register as a **Consent Manager** (Phase 2 from 13 Nov 2026)?
10. Is the entity a State instrumentality, or does it deliver State schemes (s.7(b), Rule 5)?

## C. SDF likelihood (s.10)
11. How many unique Indian data principals does it hold, and in which categories?
12. Does it process health, financial, children's or biometric data at scale?
13. Could its processing affect electoral democracy, security or public order (e.g. large social/media platform, telecom, critical infrastructure)?
14. Is it already a systemically important regulated entity (D-SIB, SSMI, large telecom)?

## D. Special populations & classes
15. Does it offer services to, or knowingly receive data of, **children (under 18)**?
16. Does it deal with persons with disabilities through lawful guardians?
17. Is it an e-commerce entity with >= 2 crore registered users in India, an online gaming intermediary with >= 50 lakh, or a social media intermediary with >= 2 crore? (Third Schedule.)
18. Is it in a Fourth Schedule Part A class (clinical establishment, healthcare professional, educational institution, creche, child transport)?

## E. Exemptions (s.17)
19. Is any processing only for legal claims, courts/regulators, crime prevention, or a court-approved scheme? (s.17(1)(a),(b),(c),(e).)
20. Does it process **non-India principals' data** under contracts with foreign persons (BPO/IT services)? (s.17(1)(d).)
21. Is it a startup or class notified under s.17(3)? Check the notifications log.
22. Does it do research, archiving or statistics without person-specific decisions? (s.17(2)(b).)

## F. Sector & other laws
23. List sector regulators (RBI, SEBI, IRDAI, DoT, NMC, etc.) and link the sector overlay notes.
24. Is it subject to data localisation under a sector law?
25. CERT-In: is the 6-hour reporting channel set up, and is the PoC designated?

## Output
Create an `entity_profile` note with these properties: `entity_role`, `sdf_status`, `third_schedule`, `children_exposure`, `pwd_exposure`, `sectors`, `exemptions_claimed`, `cross_border`, `online_presence`. These feed the engine.
"""

ROLE_TREE = r"""
# Role Determination Decision Tree

```mermaid
flowchart TD
  A[Personal data involved?] -->|No| Z[Out of scope]
  A -->|Yes| B[Digital or digitised?]
  B -->|Paper only| Z2[Out of DPDP scope - other laws/security still apply]
  B -->|Yes| C[Does entity decide PURPOSE and MEANS?]
  C -->|Alone| DF[Data Fiduciary]
  C -->|Together with another| JDF[Joint Data Fiduciary - both DFs, allocate duties by agreement]
  C -->|No - acts on instructions of another| D[Uses data for ANY own purpose? e.g. analytics, AI training, marketing]
  D -->|Yes| DF2[Data Fiduciary for that purpose + processor for the rest]
  D -->|No| P[Data Processor - contract under s.8(2)]
  DF --> E[Notified as SDF?]
  E -->|Yes| SDF[Significant Data Fiduciary - add D15]
  DF --> F[Registered Consent Manager?]
  F -->|Yes| CM[Add D18]
```

## Common real-world calls

| Relationship | Usual role | Watch-out |
|---|---|---|
| Cloud IaaS/PaaS | Processor | Support access from abroad = cross-border |
| SaaS (CRM, HRMS) | Processor | Becomes DF if it uses data for its own AI/analytics |
| Payroll outsourcer | Processor | |
| BGV agency | Processor (usually) | May keep its own database -> DF |
| Payment aggregator | Processor for merchant **and** DF under RBI for KYC/AML | Mixed roles |
| Bank <-> insurer (bancassurance) | Independent DFs | Sharing needs basis + notice |
| Insurer <-> TPA | Processor (verify contract) | |
| Hospital <-> visiting consultant | Often joint/independent DF | |
| Employer <-> group insurer | Independent DFs | Employer gives notice to members |
| Group shared services entity | Processor for group cos | Each group company is its own DF |
| Marketplace <-> seller | Independent DFs for order data | Contractually limit seller use |
| Recruitment agency | Independent DF (candidate pool) + processor (client briefs) | |
| Collection agency | Processor | Conduct risk |
| Consultant/auditor | Independent DF (professional) or processor | Depends on engagement |
"""

QUESTION_BANK = r"""
# Discovery Question Bank (Stage 2)

Use in department workshops. Every answer should become a **graph object** (process, activity, data event, purpose, system, third party, flow). The object to create is shown in brackets.

## 1. Universal lifecycle questions (ask for every process)
### Entry
1. What starts this process? Who is the person the data is about? [Data Principal type]
2. Through which channels does data arrive: form, app, phone, email, walk-in, partner, API, employer upload? [Channel]
3. Is anything captured on paper? Who types it in, where, and when? [Data Event: digitise]
4. Which fields are collected? Show me the form or screen. [Data Elements]
5. Is any field optional? Why is each mandatory field needed? [Minimisation]
6. Do you collect data about **other people**, such as family, nominees, references or contacts? [Additional Data Principals]
7. Could any of these people be under 18? How do you know their age? [flag: children]

### Purpose & basis
8. Why do you need this data? List every use, not just the main one. [Purpose x n]
9. Is it used for marketing, analytics, AI/ML, or sharing with group companies? [Secondary purposes]
10. Is there a law or regulator that requires this processing? Which one? [Basis s.7(c)/(d) or sector overlay]
11. What does the person see or hear before giving the data? Show me. [Notice]
12. How do they agree? Tick box, signature, verbal, implied? Where is that recorded? [Consent Record Type]

### Systems & people
13. Which systems store or process this data, including Excel, email, WhatsApp and shared drives? [Systems, incl. shadow]
14. Who can access it (roles, number of users)? Are there privileged/admin users? [Access]
15. Is any of it on personal phones or laptops? [Endpoint/BYOD]

### Sharing
16. Who outside your team receives it: other departments, group companies, vendors, partners, regulators, police? [Data Flow + Third Party]
17. For each recipient: do they act on your instructions or for their own purposes? [Role]
18. Is any recipient or system (incl. support staff) outside India? [flag: cross_border]
19. Is the data used to decide something about the person (approve, reject, price, hire, treat)? Is it sent to another organisation? [flag: decision_or_disclosure]

### Storage, retention, deletion
20. How long do you keep it? Is that driven by a law, a policy or just habit? [Retention Rule]
21. What happens when the purpose ends or the person leaves? Show me a deleted record. [Erasure]
22. Where are backups and archives? Are paper originals kept after scanning? [Backup/Archive]

### Rights & incidents
23. If a person asks "what do you have on me?", can you answer across all systems? [Rights capability]
24. If a person withdraws consent, what stops, and who is told? [Withdrawal propagation]
25. Have you had any data leak, misdirected email, lost device or vendor incident? [Breach history]

## 2. Department-specific add-ons
### HR
- Do you run background checks? What sources are checked (criminal, credit, social media)?
- Do you use biometric attendance or employee monitoring (DLP, screen capture, keystroke)?
- What employee data goes to insurers, payroll providers or auditors?
- Is non-core HR (wellness, surveys, social-media photos) consent-based?
- Are candidate CVs kept after rejection? For how long?

### Sales & marketing
- Where do leads come from? Do you buy lists? Do you have proof of consent from the source?
- Which pixels, SDKs and cookies run on the website/app? (Get the tag-manager export.)
- Are custom audiences uploaded to ad platforms?
- How are opt-outs propagated across email, SMS, WhatsApp and call centre tools?
- Do you run referral programmes that capture a friend's contact details?

### Customer service
- Are calls recorded? Is there a disclosure at the start? How long are recordings kept?
- Are chatbots or LLMs used? Which provider, and where is it hosted?
- Where do privacy complaints land today?

### IT
- Provide the application inventory with owners, hosting location and PD flag.
- Which systems lack access logs? Which lack encryption at rest?
- How is production data used in dev/test?
- Are there data lakes or warehouses? Which purposes feed them? Is there deletion?
- What is the backup retention? Can a single record be deleted from backups?

### Finance & procurement
- Export the vendor master. Mark which vendors receive personal data.
- Which contracts have DPAs, security clauses and breach SLAs?

### Legal & compliance
- List regulators and their reporting obligations (incl. breach clocks).
- List law-enforcement and regulator data requests in the last 12 months.
- Which record-retention laws apply? Get the legal citations.

### Admin & facilities
- CCTV: number of cameras, retention, who views footage, police sharing log, signage.
- Visitor management: what ID is captured? Is it photocopied? Is Aadhaar masked?

### Product & engineering (digital businesses)
- Show the sign-up flow. Is there an age-gate? Are there child users?
- Is there an account deletion flow? Is it actually deleted, or soft-deleted?
- Is there profiling or recommendation? Which model uses which features?
- Is there a list of third-party SDKs with their data collection?
"""

PBC_LIST = r"""
# Evidence Request List (PBC - "Provided By Client")

Issue in Stage 0. Track status in `Evidence` notes (`status: requested/received/insufficient/accepted`).

| # | Evidence | Domain | Typical owner |
|---|---|---|---|
| 1 | Organisation chart & list of legal entities | D02 | HR / CS |
| 2 | List of products/services, customer counts, geographies | D02 | Strategy |
| 3 | Existing privacy policy (external) & internal data protection policy | D01 | Legal |
| 4 | Information security policy set & ISO 27001/27701/SOC 2 reports | D09 | CISO |
| 5 | Application/system inventory (owner, hosting, PD flag) | D03 | IT |
| 6 | Data flow diagrams / architecture diagrams | D03 | IT Architecture |
| 7 | Vendor master with contract status | D13 | Procurement |
| 8 | Sample contracts/DPAs for top 20 vendors | D13 | Legal |
| 9 | All customer-facing forms (paper & digital), consent texts, screenshots | D05/D06 | Business |
| 10 | Website/app cookie banner, tag manager export, SDK list | D06/D07 | Digital |
| 11 | Consent storage design / sample consent records | D06 | IT |
| 12 | Marketing opt-out process & DLT registrations | D06 | Marketing |
| 13 | Records retention schedule | D11 | Legal / Records |
| 14 | Deletion/archival job configs, backup retention settings | D11 | IT |
| 15 | Customer grievance process & last 12 months' complaint stats | D12 | Customer Service |
| 16 | Incident response plan, incident register (last 24 months) | D10 | CISO |
| 17 | CERT-In PoC designation & any reports filed | D10 | CISO |
| 18 | Access review evidence for top 5 PD systems | D09 | IT |
| 19 | Encryption configuration evidence (DBs, storage, endpoints) | D09 | IT |
| 20 | Logging/SIEM coverage list & log retention settings | D09 | SOC |
| 21 | Backup & restore test reports | D09 | IT Ops |
| 22 | VAPT reports (latest) & closure status | D09 | Security |
| 23 | DLP policies & incident stats | D09 | Security |
| 24 | Cloud regions / data residency configuration | D14 | IT |
| 25 | List of cross-border transfers & sub-processors | D14 | Privacy / IT |
| 26 | HR forms: application, onboarding, BGV consent, employee handbook | D04 | HR |
| 27 | CCTV policy, camera count, retention, signage photos | D09 | Admin |
| 28 | Visitor management register sample | D09 | Admin |
| 29 | Training materials & completion reports | D01 | HR / L&D |
| 30 | Law enforcement / regulator request log | D16 | Legal |
| 31 | Board/management minutes discussing privacy | D01 | CS |
| 32 | Children/age-gating flow (if applicable) | D07 | Product |
| 33 | Algorithm/model inventory (if AI used) | D15 | Data Science |
| 34 | Sector regulator inspection findings related to data | D16 | Compliance |
"""

STUCK = r"""
# Stuck-Point Playbook - where real DPDP assessments stall, and how to unblock

Each pattern gives: **Symptom -> Why it happens -> Resolution -> How to model it in the vault.**

### SP-01 "The process owner doesn't know where the data goes"
- **Why:** Knowledge is split between business, IT and vendors.
- **Resolve:** Run a joint session (business + app owner + integration team). Use the integration/API list and firewall rules as ground truth. Map "known" flows first and tag unknowns `confidence: low`.
- **Model:** Set `Data Flow.confidence` to low/medium/high. The dashboard lists low-confidence flows as open discovery items.

### SP-02 One system serves 30 processes; one process uses 8 systems
- **Why:** The world is a graph, not a chain.
- **Resolve:** Never nest systems under processes. Create each **System** once and link from Activities (`systems: [[SYS-...]]`). Findings on a system (e.g. no encryption) propagate to every activity using it.
- **Model:** Use the System note backlinks, and the Dataview "activities per system" query.

### SP-03 Shadow data: Excel exports, WhatsApp groups, personal Gmail
- **Why:** Front-line convenience.
- **Resolve:** Ask directly: "Where else does this data go when the system is slow?" Run DLP/discovery scans. Treat each shadow store as a System with `system_type: Spreadsheet (shadow)` or `Messaging app (shadow)` and `sanctioned: false`.
- **Model:** Create a finding against the system and a remediation (migrate, or sanction and secure).

### SP-04 Legacy data with no consent record
- **Why:** Collected before DPDP, often on paper or by old apps.
- **Resolve:** Under s.5(2), consent-based legacy data can continue after a legacy notice, until the person withdraws. Segment by contactability. Run a notice campaign. If the person is uncontactable and the purpose is over, erase.
- **Model:** Set the flag `legacy_data` on the activity. The engine adds OBL-NOT-06. Track campaign coverage in the remediation note.

### SP-05 "Is this vendor a processor or a fiduciary?"
- **Why:** Contracts are silent; vendors use data for their own analytics/AI.
- **Resolve:** Apply the Role Decision Tree. Mixed roles are allowed: a vendor can be a processor for service delivery and a DF for its own analytics. Put this in the contract.
- **Model:** Set `Third Party.processing_role` (a list is allowed) and add a `role_rationale` field.

### SP-06 Group companies share one CRM / HR system
- **Why:** Shared services.
- **Resolve:** Each legal entity is a separate DF. The shared-services entity is usually a processor. Intra-group sharing needs a basis and notice. Put an intra-group data sharing agreement in place.
- **Model:** Create one Organisation note per entity. Set Flow `transfer_type: intra-group (other legal entity = other DF)`.

### SP-07 Retention conflict: DPDP says erase, sector law says keep
- **Why:** PMLA 5 yrs, Companies Act 8 yrs, GST 72 months, medical records, IT Rules 180 days, etc.
- **Resolve:** s.8(7) and s.12(3) allow retention "for compliance with any law". Keep only the data the law requires, restrict access (archive tier), then erase. Tell the person which data is retained and why.
- **Model:** In the Retention Rule note, fill `legal_basis_for_retention` with the citation from the sector overlay's retention anchors.

### SP-08 Employee data - consent or s.7(i)?
- **Why:** HR habitually takes "consent" in offer letters (not free, because of the power imbalance).
- **Resolve:** Use s.7(i) for core employment purposes. Use genuine, optional consent for non-core purposes (wellness apps, photos on social media, alumni network). Give employees a notice anyway.
- **Model:** Create a separate Purpose note per HR use, each with its own `lawful_basis`.

### SP-09 Marketing bundled with service consent
- **Why:** A single "I agree to T&C and privacy policy" tick box.
- **Resolve:** Unbundle. Service delivery is s.7(a) or consent for the service. Marketing, profiling and sharing each get a separate optional consent.
- **Model:** Create one Purpose note per use. The consent ledger records consent per purpose.

### SP-10 Children appear in a service not meant for children
- **Why:** No age-gate. Parents use kids' details (insurance dependants, edtech, gaming).
- **Resolve:** Risk-based age assurance. Where children are expected, use verifiable parental consent (R10) and turn off tracking and targeted ads. Check the Fourth Schedule exemption strictly.
- **Model:** Set the `children` flag. The engine adds D07 obligations.

### SP-11 Backups can't delete individual records
- **Why:** Immutable/tape backups.
- **Resolve:** Document a "beyond use" approach: backups expire on a fixed cycle, restored data is re-purged against the deletion log, and backups are encrypted and access-restricted.
- **Model:** Add a control rationale to CTL-RET-02, plus an evidence note for the deletion-log re-apply procedure.

### SP-12 Data lake / warehouse breaks purpose limitation and erasure
- **Why:** "Collect everything" analytics.
- **Resolve:** Tag datasets by source purpose. Propagate withdrawal/erasure keys. Pseudonymise. Apply a purpose-compatibility review before new use cases (CTL-LB-04).
- **Model:** Make the data lake a System with `purpose_tags`. Link its flows from each source activity.

### SP-13 Cross-border SaaS everywhere (M365, Salesforce, analytics, LLMs)
- **Why:** SaaS default regions and global support.
- **Resolve:** DPDP uses a negative list (no blanket localisation yet). Keep a transfer register. Check sector localisation (RBI payments, IRDAI, SEBI, Govt). Prefer India regions where available. Record vendor support-access locations.
- **Model:** Set the `cross_border` flag and `Third Party.country`. Rebuild CTL-XB-01 on each notification.

### SP-14 The "Consent Manager" question
- **Why:** Confusion over whether you must integrate.
- **Resolve:** The CM regime starts in Phase 2 (13 Nov 2026) for registration. A DF must honour consent given through a registered CM (s.6(7)). Plan an integration interface, and don't build for a specific CM until CMs are registered.
- **Model:** Set the `consent_manager_used` flag when relevant.

### SP-15 Rights requests can't be answered across systems
- **Why:** No master identity; the same person exists under different IDs.
- **Resolve:** Define identifiers (R14(5)), such as mobile, email and customer ID. Build a system-by-system lookup runbook from the activity register. Automate for the top 5 systems.
- **Model:** Store the lookup key per system in the System note (`rights_lookup_key`).

### SP-16 Paper-to-digital boundary
- **Why:** Paper forms are scanned or typed later, and the originals sit in a store room.
- **Resolve:** Data is in scope once digitised (s.3(a)(ii)). Paper originals are still a security and breach risk. Map the digitisation Data Event, and retain or destroy the paper per the schedule.
- **Model:** Set `digital_state: digitised` and add a Data Event `event_type: digitise`.

### SP-17 Vendor refuses DPA / audit rights
- **Why:** Large SaaS providers use standard terms.
- **Resolve:** Accept the vendor's DPA if it covers the DPDP essentials (instructions, R6 security, breach SLA, erasure, sub-processors, cooperation). Record residual gaps as risk-accepted, and rely on SOC 2/ISO reports.
- **Model:** Use Third Party `dpa_status: vendor_paper_accepted` and link a signed risk acceptance to the finding.

### SP-18 Process owners won't own findings
- **Why:** They see privacy as the DPO's job.
- **Resolve:** Tie each finding to a process and a named owner, with a management-approved RACI. The quarterly dashboard shows open findings by owner.
- **Model:** `Finding.owner` is mandatory. The dashboard groups by owner.

### SP-19 Sector regulator and DPDP breach clocks collide
- **Why:** CERT-In 6h, RBI 2-6h, IRDAI, SEBI, DPDP Board "without delay" + 72h, and affected DPs.
- **Resolve:** Build one breach clock sheet in the IR plan with all applicable clocks triggered from a single awareness timestamp.
- **Model:** The Breach Register template has columns for each regulator.

### SP-20 CCTV everywhere, no policy
- **Resolve:** Signage as notice. Purpose = security (s.7(i) for staff; s.7(a) or consent for visitors — document the rationale). Set a retention period. Keep a log of police sharing. Restrict viewing access. Don't place cameras in private areas.
- **Model:** Use common process CMN-ADM-01 as the template.

### SP-21 "We are too small" / startup assumption
- **Resolve:** The Act has no size threshold. A s.17(3) exemption applies only if notified. Check the notifications log.

### SP-22 Consent from vulnerable / low-literacy populations (NGOs, rural, patients)
- **Resolve:** Give an oral notice in the local language (Eighth Schedule option). Use assisted consent with a witness. Record audio or a thumbprint with the notice version.
- **Model:** Consent Record Type `capture_method: assisted_oral`.

### SP-23 AI/LLM tools used informally by staff
- **Resolve:** Inventory GenAI tools and set an acceptable-use policy. Use enterprise versions with no training on your data, and check the region. Block uploads of personal data to unsanctioned tools with DLP.
- **Model:** System `system_type: LLM/GenAI tool`, with the context tag `ai`.

### SP-24 Scope creep - trying to map everything at once
- **Resolve:** Map in waves by risk: (1) customer onboarding & core product, (2) children/health/financial/biometric activities, (3) HR, (4) marketing, (5) support functions. The engine and dashboard work on partial graphs.

### SP-25 Obligations not yet in force - "why do this now?"
- **Resolve:** Show the commencement countdown. Phase 3 needs 6-9 months of build (consent ledger, deletion jobs, rights tooling). The SPDI Rules and CERT-In directions already apply today.
"""

GRAPH_GUIDE = r"""
# Graph Modelling Guide - how the vault represents reality

## Core idea
**Objects are notes; relationships are links in properties.** Nothing is nested. Obsidian's graph view, backlinks and Dataview queries let you traverse in any direction:
- "Which activities use this system?"
- "Which vendors receive health data?"
- "Which obligations apply to this flow?"
- "Which findings affect children?"

```mermaid
erDiagram
  ORGANISATION ||--o{ DEPARTMENT : has
  DEPARTMENT ||--o{ PROCESS : owns
  PROCESS ||--o{ ACTIVITY : contains
  ACTIVITY ||--o{ DATA_EVENT : sequence
  ACTIVITY }o--o{ PURPOSE : serves
  PURPOSE }o--|| LAWFUL_BASIS : relies_on
  PURPOSE }o--o{ NOTICE : disclosed_in
  PURPOSE }o--o| RETENTION_RULE : governed_by
  ACTIVITY }o--o{ DATA_PRINCIPAL : about
  ACTIVITY }o--o{ DATA_ELEMENT : uses
  ACTIVITY }o--o{ SYSTEM : runs_on
  ACTIVITY }o--o{ DATA_FLOW : emits
  DATA_FLOW }o--|| THIRD_PARTY : to
  DATA_FLOW }o--|| SYSTEM : from
  ACTIVITY }o--o{ OBLIGATION : engine_applies
  OBLIGATION }o--o{ CONTROL : satisfied_by
  CONTROL ||--o{ CONTROL_TEST : tested_by
  CONTROL_TEST }o--o{ EVIDENCE : supported_by
  CONTROL_TEST ||--o{ FINDING : raises
  FINDING }o--|| ACTIVITY : located_in
  FINDING ||--o{ REMEDIATION : fixed_by
  OBLIGATION }o--|| SECTION : from
  OBLIGATION }o--o| RULE : from
```

## ID conventions
| Object | Pattern | Example |
|---|---|---|
| Organisation | ORG-<code> | ORG-ACME |
| Department | DEP-<org>-<code> | DEP-ACME-HR |
| Process | PRC-<org>-<nn> (or catalogue id) | PRC-ACME-012 |
| Activity | ACT-<org>-<dept>-<nnn> | ACT-ACME-HR-004 |
| Data Event | EVT-<activity>-<nn> | EVT-ACT-ACME-HR-004-03 |
| Purpose | PUR-<org>-<nnn> | PUR-ACME-021 |
| System | SYS-<org>-<code> | SYS-ACME-SAPHR |
| Third Party | TP-<org>-<code> | TP-ACME-AWS |
| Data Flow | FLW-<org>-<nnn> | FLW-ACME-044 |
| Notice | NTC-<org>-<code>-v<n> | NTC-ACME-WEB-v3 |
| Retention Rule | RET-<org>-<nnn> | RET-ACME-007 |
| Obligation | OBL-<area>-<nn> (framework) | OBL-SEC-02 |
| Control | CTL-<area>-<nn> (framework) | CTL-SEC-02 |
| Control Test | TST-<cycle>-<control>-<nn> | TST-2026Q4-CTL-SEC-02-01 |
| Evidence | EVD-<org>-<nnnn> | EVD-ACME-0142 |
| Finding | FND-<org>-<nnn> | FND-ACME-031 |
| Remediation | REM-<org>-<nnn> | REM-ACME-031 |

## Rules
1. **Create once, link many.** Systems, third parties, purposes, notices and retention rules are shared objects.
2. **Flags live on the Activity.** The engine reads `lawful_basis` and `flags`. The entity-level role comes from the Entity Profile.
3. **Context tags drive risk, not applicability.** Tags like `health` and `biometric` raise the impact score.
4. **Confidence is explicit.** Every flow and activity has `confidence: low|medium|high` (how sure the mapping is).
5. **Catalogue -> instance.** The process catalogue (`05 Processes/Catalogue`) holds templates. Copy the relevant ones into the client's `Processes` folder and edit them to match reality.
6. **N/A needs a reason.** Record it in the engine output or an override: `overrides: {OBL-XX: "reason"}`.
"""

RISK_METHOD = r"""
# Risk Methodology

**Risk score = Likelihood (1-5) x Impact (1-5)**

## Impact drivers (take the highest)
| Driver | Impact floor |
|---|---|
| Obligation penalty tier P1 (Rs 250 cr, security) | 4 |
| P2/P3 (Rs 200 cr, breach intimation / children) | 4 |
| P4 (Rs 150 cr, SDF) | 4 |
| P7 (Rs 50 cr, other) | 2 |
| Context tag health / biometric | +1 (max 5) |
| Children flag | +1 (max 5) |
| > 1 lakh DPs affected | +1 (max 5) |
| Publicly visible (website, app store, press) | +1 (max 5) |

## Likelihood guidance
| Score | Meaning in DPDP context |
|---|---|
| 5 | Non-compliance is happening now at scale (e.g. no notice on the main sign-up) |
| 4 | Systemic gap across channels/systems |
| 3 | Gap in some channels; compensating controls partial |
| 2 | Isolated gap; control mostly works |
| 1 | Theoretical |

## Bands
| Score | Band | Target remediation |
|---|---|---|
| 17-25 | Critical | Before next commencement milestone; exec visibility |
| 10-16 | High | <= 90 days |
| 5-9 | Medium | <= 180 days |
| 1-4 | Low | Next cycle |

Note: Board penalties also weigh nature, gravity, duration, type of data, repetition, gains, mitigation and proportionality (s.33(2)). Record mitigating actions in findings; they reduce exposure.
"""
