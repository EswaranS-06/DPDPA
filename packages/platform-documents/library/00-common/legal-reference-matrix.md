---
id: X01
title: Legal Reference Matrix — DPDP Act 2023 & DPDP Rules 2025
publish: internal
version: 1.0
---

# Legal Reference Matrix

The source texts are the Digital Personal Data Protection Act, 2023 (No. 22 of 2023), and the Digital Personal Data Protection Rules, 2025, notified as G.S.R. 846(E) dated 13 Nov 2025. Commencement was notified by G.S.R. 843(E). This matrix maps each statutory requirement to the template section that satisfies it. The UI validator (`validation-checklist.md`) is built from this table.

Legend: **M** = mandatory, **C** = conditional, **BP** = best practice / defensibility (not a strict statutory mandate). **VERIFY** = check the wording against the Gazette copy before client release.

## A. Commencement

| Provision | In force from |
|---|---|
| Act ss.1(2), 2, 18–26, 35, 38–43, 44(1),(3); Rules 1, 2, 17–21 | 13 Nov 2025 |
| Act s.6(9), s.27(1)(d); Rule 4, First Schedule | 13 Nov 2026 |
| Act ss.3–5, 6(1)–(8),(10), 7–17, 27 (rest), 28–34, 36, 37, 44(2); Rules 3, 5–16, 22, 23 | 13 May 2027 |
| IT Act s.43A + SPDI Rules 2011 | Apply **until** 13 May 2027 (omitted by Act s.44(2)) |

## B. Definitions used across templates (Act s.2)

| Term | Section | Note |
|---|---|---|
| Child | 2(f) | Individual under 18 years |
| Consent Manager | 2(g) | Person registered with the Board; single point of contact for giving, managing, reviewing and withdrawing consent through an accessible, transparent, interoperable platform |
| Data Fiduciary | 2(i) | Determines purpose and means of processing |
| Data Principal | 2(j) | Individual; includes parent/lawful guardian of a child, and lawful guardian of a person with disability |
| Data Processor | 2(k) | Processes on behalf of a Data Fiduciary |
| Digital personal data | 2(n) | Personal data in digital form (and non-digital data that is later digitised, s.3(a)(ii)) |
| Personal data | 2(t) | Data about an individual who is identifiable by or in relation to such data |
| Personal data breach | 2(u) | Unauthorised processing, or accidental disclosure, acquisition, sharing, use, alteration, destruction or loss of access, that compromises confidentiality, integrity or availability |
| Processing | 2(x) | Wholly or partly automated operations: collection, recording, organisation, structuring, storage, adaptation, retrieval, use, alignment or combination, indexing, sharing, disclosure by transmission, dissemination or otherwise making available, restriction, erasure or destruction |
| Significant Data Fiduciary | 2(z) | Notified under s.10(1) |

## C. Obligation → template map

| # | Requirement | Source | Level | Template § |
|---|---|---|---|---|
| 1 | Territorial scope: processing in India; outside India if offering goods/services to Data Principals in India | s.3 | M | N01 §1, §3; G01 §2 |
| 2 | Lawful grounds: consent or legitimate use only, for a lawful purpose | s.4 | M | N01 §5, G06 col "Legal basis", C01 §2 |
| 3 | Notice with or before the consent request: personal data + purpose; manner of exercising s.6(4) and s.13 rights; manner of complaining to the Board | s.5(1) | M | N01, N02, N05, C01 |
| 4 | Notice for consent given before commencement, "as soon as it is reasonably practicable" | s.5(2) | C | N06 |
| 5 | Option to access notice in English or any Eighth Schedule language | s.5(3) | M | N01 §18; C01 §3 (rule 3.6); shared block `languages` |
| 6 | Notice stands alone; clear and plain language; itemised description of personal data; specified purpose + goods/services/uses enabled | Rule 3(a),(b) | M | N01 §4–5; N02 §1–2; C01 §4.1 |
| 7 | Communication link + other means to withdraw consent (ease comparable to giving), exercise rights, complain to Board | Rule 3(c) | M | N01 §9–12, C02 |
| 8 | Consent: free, specific, informed, unconditional, unambiguous, clear affirmative action; limited to necessary data | s.6(1) | M | C01 §3 |
| 9 | Consent conditions infringing the Act are invalid to that extent | s.6(2) | M | C01 §3.4 |
| 10 | Consent request in clear/plain language; English/Eighth Schedule language; DPO / authorised person contact | s.6(3) | M | C01 §4 |
| 11 | Right to withdraw at any time; ease comparable to giving; consequences borne by Data Principal; prior processing stays lawful | s.6(4),(5) | M | C02, N01 §9 |
| 12 | Cease processing (and cause processors to cease) within a reasonable time after withdrawal | s.6(6) | M | C02 §5 (steps 5–7); V01 cl.5.3; V04 DP-6 |
| 13 | Consent via a registered Consent Manager; accountable to Data Principal; registration | s.6(7)–(9), Rule 4, First Schedule | C | C03 |
| 14 | Burden of proof that notice was given and consent obtained lies on the Data Fiduciary | s.6(10) | M | C04 (consent artefact) |
| 15 | Legitimate use: data voluntarily provided by the Data Principal for a specified purpose, where she has not indicated she does not consent | s.7(a) | C | N01 §5.2, C01 §2 |
| 16 | Legitimate uses (a)–(i), incl. employment s.7(i) | s.7 | C | N03 Part B §B2; G06 col. 11 |
| 17 | Data Fiduciary responsible irrespective of any agreement | s.8(1) | M | G01 §4, V01 cl.2 |
| 18 | Engage processor only under a valid contract | s.8(2) | M | V01, V04 |
| 19 | Completeness, accuracy, consistency where data is used for a decision or disclosed | s.8(3) | M | G01 §6.4 |
| 20 | Appropriate technical and organisational measures | s.8(4) | M | G01 §8, G04 |
| 21 | Reasonable security safeguards (minimum controls (a)–(g)) | s.8(5), Rule 6 | M | G04, G03, V01 cl.6, V03 §D |
| 22 | Log + personal-data retention for 1 year for breach detection | Rule 6(1)(e) | M | G02 §6, G04 §9 |
| 23 | Breach intimation to Board and each affected Data Principal | s.8(6), Rule 7 | M | B01–B04 |
| 24 | Erasure on withdrawal or when the purpose is no longer served (unless law requires retention); processors to erase | s.8(7) | M | G02, C02 §6, V01 cl.11 |
| 25 | Purpose deemed no longer served — Third Schedule entities: 3 years from last approach / rights exercise / commencement, with 48-hour prior intimation | s.8(8), Rule 8(1),(2), Third Schedule | C | G02 §5.3, R04 L-08 |
| 26 | Minimum 1-year retention of personal data, traffic data and logs from date of processing (Seventh Schedule purposes) | Rule 8(3) | M | G02 §6 |
| 27 | Publish business contact info of DPO / person able to answer; repeat it in every rights response | s.8(9), Rule 9 | M | N01 §14; R01 Part B; R04 contact-footer (all letters); shared block `contact-block` |
| 28 | Effective grievance redressal mechanism | s.8(10), s.13 | M | R01 |
| 29 | Verifiable parental consent for a child; due diligence that the parent is an identifiable adult | s.9(1), Rule 10 | C | N05, C01 §5 |
| 30 | Verifiable consent from the lawful guardian of a person with disability; verify guardian's appointment | s.9(1), Rule 11 | C | N05 §B |
| 31 | No processing detrimental to a child's well-being; no tracking, behavioural monitoring or targeted advertising directed at children | s.9(2),(3) | C | N05 Part A §4, Part C4; N04 Part 3 §6 |
| 32 | Exemptions for specified classes / purposes (healthcare, education, crèche, transport, etc.) | s.9(4),(5), Rule 12, Fourth Schedule | C | N05 Part A-School, Part C5 (**VERIFY** list) |
| 33 | SDF: DPO based in India, responsible to the Board of Directors, point of contact for grievances | s.10(2)(a) | C | S02 |
| 34 | SDF: independent data auditor | s.10(2)(b) | C | S03 |
| 35 | SDF: periodic DPIA + audit every 12 months; report of significant observations to the Board | s.10(2)(c), Rule 13(1),(2) | C | S01, G05 |
| 36 | SDF: due diligence that technical measures, incl. algorithmic software, do not risk Data Principal rights | Rule 13(3) | C | S04 |
| 37 | SDF: localisation of personal data and traffic data specified by the Central Government | Rule 13(4) | C | S01 §7; V05 Part A row 9 |
| 38 | Right to access information: summary of data, processing activities, identities of other fiduciaries/processors shared with + description of data | s.11 | M | R02 §5.1, R04 L-03 |
| 39 | Right to correction, completion, updating, erasure | s.12 | M | R02 §5.2–5.3 |
| 40 | Grievance redressal; must be exhausted before approaching the Board | s.13 | M | R01 |
| 41 | Right to nominate (death / incapacity) | s.14, Rule 14(4) | M | R02 §5.5, R03 Form D |
| 42 | Publish means of making requests + identifiers required | Rule 14(1),(2),(5) | M | R01 Part B; R03 "Published particulars" |
| 43 | Publish grievance response period (≤ 90 days) and implement measures to meet it | Rule 14(3) (**VERIFY** wording) | M | R01 §7 |
| 44 | Duties of Data Principals (penalty up to ₹10,000) | s.15 | BP (inform) | N01 §13 |
| 45 | Cross-border transfer permitted except to countries restricted by notification; stricter sectoral law prevails | s.16 | C | V05, N01 §8 |
| 46 | Requirements for making data available to a foreign State (by general/special order) | Rule 15 | C | V05 CB-2, CB-5 |
| 47 | Exemptions (legal claims, courts, offences, foreign-contract processing, schemes of arrangement, loan default, etc.) | s.17 | C | G01 §3.3, N01 §5.3 |
| 48 | Research / archiving / statistical exemption subject to Second Schedule standards | s.17(2)(b), Rule 16 | C | G01 §3.3 |
| 49 | Calling for information by Central Government (Seventh Schedule) | s.36, Rule 23 | C | G01 §12, R02 §10 |
| 50 | Voluntary undertaking before the Board | s.32 | C | B01 §11 |

## D. Penalties (Schedule to the Act, s.33)

| Breach | Max penalty |
|---|---|
| Failure to take reasonable security safeguards (s.8(5)) | ₹250 crore |
| Failure to notify the Board / affected Data Principals of a breach (s.8(6)) | ₹200 crore |
| Non-fulfilment of additional obligations re children (s.9) | ₹200 crore |
| Non-fulfilment of SDF additional obligations (s.10) | ₹150 crore |
| Breach of Data Principal duties (s.15) | ₹10,000 |
| Breach of a voluntary undertaking accepted by the Board (s.32) | Up to the extent applicable for the underlying breach |
| Breach of any other provision of the Act or Rules | ₹50 crore |

## E. Parallel / sectoral requirements to reconcile (configure per client)

| Regime | Requirement | Used in |
|---|---|---|
| CERT-In Directions dated 28 Apr 2022 (IT Act s.70B) | Report specified cyber incidents within **6 hours** of noticing; retain ICT logs for 180 days in India; sync clocks to NTP | B01 §7, G04 §9 |
| RBI (regulated entities) | Cyber-incident reporting to RBI (per applicable Master Direction); payment-system data storage in India (RBI circular, 6 Apr 2018) | B01 §7; V05 Part A |
| SEBI (CSCRF) / IRDAI (Information & Cyber Security Guidelines) | Sector incident reporting and data-localisation rules | B01 §7; V05 Part A |
| Clinical Establishments / ABDM / NMC record-keeping | Medical-record retention norms (commonly 3 years for OPD, longer for IPD/medico-legal — confirm per state) | G02 schedule, N02 healthcare block |
| Income-tax, GST, Companies Act, labour laws | Statutory record retention (commonly 8 years for books of account under Companies Act s.128) | G02 schedule |
| IT Act s.43A + SPDI Rules 2011 (until 13 May 2027) | Privacy policy on website, SPDI consent in writing, Grievance Officer, ISO 27001-type reasonable security practices | N01 §19 (transitional note); R01 |

> **Drafting note:** The penalty and sectoral entries above are kept as reference data. Sector-specific timelines change often, so before each delivery confirm the client's current Master Directions and Circulars.
