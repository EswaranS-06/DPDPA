---
id: G05
title: Data Protection Impact Assessment (DPIA) — Template & Completed Example
category: 3. Internal governance policies
audience: DPO, process owners, product, security, legal
publish: internal (SDF: summary of significant observations to Board via S01)
legal_basis: [DPDPA s.8(4),(5), s.9, s.10(2)(c)(i); Rules r.6, r.13(1),(3)]
applies_when: always (mandatory for high-risk processing; annual for SDF)
flags: [Is-SDF, Processes-Children-Data, Cross-Border-Transfer, Uses-Automated-Decisions]
version: 1.0
review_cycle: per project; re-assess on material change; SDF every 12 months
---

<!-- INCLUDE doc-control -->

# Data Protection Impact Assessment

> **Drafting note:** For SDFs, s.10(2)(c)(i) describes a DPIA as a process "comprising a description of the rights of Data Principals and the purpose of processing", together with an "assessment and management of the risk to the rights of the Data Principals". This template covers those three elements explicitly (Parts C, D, E–F). For non-SDFs a DPIA is not mandated by name, but it is the most practical way to show compliance with s.8(4) and s.8(5).

## PART A: Screening (decide if a full DPIA is needed)
| # | Question | Y/N |
|---|---|---|
| 1 | Large-scale processing (> [DPIA-Scale-Threshold] Data Principals)? | |
| 2 | Children's data, or data of persons with disability? | |
| 3 | Health, financial, biometric, genetic, precise location or government-ID data? | |
| 4 | Profiling, scoring or automated decisions with significant effects? | |
| 5 | Systematic monitoring (CCTV, employee monitoring, tracking)? | |
| 6 | New technology (AI/ML, IoT, facial recognition)? | |
| 7 | Combining data sets from different sources or purposes? | |
| 8 | Transfer outside India? | |
| 9 | A new Data Processor with access to L4 data? | |
| 10 | Processing that may prevent people from exercising rights or using a service? | |
**Any "Y" → full DPIA.** Screening outcome: [DPIA-Screening-Outcome] · Screened by: [DPIA-Screened-By] · Date: [DPIA-Screening-Date]

## PART B: Project overview
| Field | Detail |
|---|---|
| DPIA reference | [DPIA-Ref] |
| Project / processing activity | [DPIA-Project-Name] |
| RoPA ID(s) | [DPIA-RoPA-IDs] |
| Business owner | [DPIA-Business-Owner] |
| DPIA lead | [DPIA-Lead] |
| Systems / vendors involved | [DPIA-Systems] |
| Planned go-live | [DPIA-Go-Live] |

## PART C: Description of processing and purpose
1. **Nature:** collection sources, operations, technologies, data flow (attach a diagram).
2. **Scope:** data categories (itemised, with G03 levels), number of Data Principals, geographic scope, retention, frequency.
3. **Context:** Data Principals' relationship with the Company, their reasonable expectations, vulnerable groups, prior concerns.
4. **Purpose(s):** the specified purposes and the benefit to the Data Principal and to the Company.
5. **Legal basis per purpose:** consent / s.7 clause / s.17 exemption, with justification.

## PART D: Description of Data Principal rights and how they are enabled
| Right | How enabled for this processing | Gaps |
|---|---|---|
| Notice (s.5, Rule 3) | | |
| Consent & withdrawal (s.6) | | |
| Access (s.11) | | |
| Correction / erasure (s.12) | | |
| Grievance (s.13) | | |
| Nomination (s.14) | | |
| Children's protections (s.9) | | |

## PART E: Necessity and proportionality
- Is each data item necessary? Could the purpose be achieved with less, or with anonymised data?
- Is the retention period justified?
- Are accuracy measures in place (s.8(3))?
- How are processors controlled (s.8(2))?
- What safeguards apply to any cross-border transfer?

## PART F: Risk assessment
Likelihood (1 Rare – 5 Almost certain) × Impact on Data Principal (1 Minimal – 5 Severe) = Score. **Low 1–6 · Medium 7–14 · High 15–25.**

| ID | Risk to Data Principals | Source / threat | L | I | Inherent score | Controls (existing + planned) | Residual L | Residual I | Residual score | Owner | Due |
|---|---|---|---|---|---|---|---|---|---|---|---|
<!-- REPEAT DPIA-Risks -->
| [Risk-ID] | [Risk-Description] | [Risk-Source] | [Risk-L] | [Risk-I] | [Risk-Inherent] | [Risk-Controls] | [Risk-Res-L] | [Risk-Res-I] | [Risk-Residual] | [Risk-Owner] | [Risk-Due] |
<!-- END REPEAT -->

Standard risk prompts: unauthorised access or breach; excessive collection; function creep or secondary use; inaccurate data driving decisions; discrimination or bias from algorithms; inability to withdraw or exercise rights; unlawful cross-border access; harm to children; over-retention; re-identification of anonymised data; vendor failure; lack of transparency.

## PART G: Consultation
Stakeholders consulted (IT security, legal, business, Data Principal representatives or surveys where appropriate), with their inputs and how each was addressed.

## PART H: Outcome and sign-off
| Item | Decision |
|---|---|
| Overall residual risk | [DPIA-Residual-Risk] |
| Recommendation | ☐ Proceed ☐ Proceed with conditions ☐ Do not proceed |
| Conditions / actions | [DPIA-Conditions] |
| DPO opinion | [DPIA-DPO-Opinion] |
| Approved by (Steering Committee for High residual risk) | [DPIA-Approver] · Date [DPIA-Approval-Date] |
| Next review | [DPIA-Next-Review] |

---

## COMPLETED EXAMPLE (illustrative): "Patient App with Teleconsultation & Lab-Report Delivery"

| Field | Detail |
|---|---|
| DPIA ref. | DPIA-2027-004 |
| Processing | Mobile app for appointment booking, video consultation, e-prescriptions and lab-report download |
| Data Principals | ~4 lakh patients/yr, including minors (through a parent account) |
| Data | L4: health records, prescriptions, lab reports, ABHA ID; L3: name, mobile, address; payments tokenised by the PA |
| Purposes / basis | P1 Account (s.7(a)); P2 Teleconsultation (consent); P3 Report delivery (consent); P4 Statutory records (s.7(d)/state rules); P5 Health tips (optional consent) |
| Processors | Cloud hosting (Mumbai region), video-SDK vendor (servers in India + Singapore), SMS gateway, lab LIS vendor |
| Cross-border | Video-SDK relay in Singapore during failover |

**Rights (Part D) gaps found:** no in-app withdrawal for P5 (fixed: toggle added); the access summary did not list the video-SDK vendor (fixed: recipient list auto-generated from the vendor register).

| ID | Risk | L | I | Inherent | Key controls | Residual |
|---|---|---|---|---|---|---|
| R1 | Unauthorised access to lab reports through link sharing | 4 | 5 | 20 High | Signed, expiring URLs (24 h); OTP before download; access logs kept 1 yr | 2×5 = 10 Medium |
| R2 | Minor's records visible to a non-parent adult | 3 | 5 | 15 High | VPC via existing-account / DigiLocker token; healthcare exemption limited to treatment; re-verification on adding a dependant | 1×5 = 5 Low |
| R3 | Video sessions routed abroad without safeguards | 3 | 3 | 9 Medium | India-first routing; Singapore only for failover; DPA with transfer clauses (V05); no recording stored by vendor | 2×3 = 6 Low |
| R4 | Health-tips purpose bundled with treatment consent | 4 | 3 | 12 Medium | Separate unticked toggle; C01 UAT | 1×3 = 3 Low |
| R5 | Over-retention of teleconsult recordings | 3 | 4 | 12 Medium | Recordings off by default; if enabled with consent, auto-deleted after 30 days | 2×3 = 6 Low |

**Outcome:** proceed with conditions (R1 controls live before launch; quarterly access-review of the lab-report bucket). DPO opinion: acceptable residual risk. Approved by the Privacy Steering Committee on 10-Apr-2027. Next review: 10-Apr-2028 or on any new vendor.
