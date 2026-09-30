---
type: guide
---

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
