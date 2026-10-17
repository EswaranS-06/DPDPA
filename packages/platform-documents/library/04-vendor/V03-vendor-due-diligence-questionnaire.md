---
id: V03
title: Vendor DPDP Due-Diligence Questionnaire (Pre-onboarding)
category: 4. Vendor / third-party documents
audience: Vendors (completed by vendor), assessed by Procurement / DPO / CISO
publish: external (sent to vendor)
legal_basis: [DPDPA s.8(1),(2),(5),(6), s.16; Rules r.6, r.7, r.8(3), r.15]
applies_when: always (before any vendor receives personal data)
flags: [Cross-Border-Transfer, Processes-Children-Data, Sector]
version: 1.0
review_cycle: per vendor at onboarding; refresh per tier (Tier 1 annually, Tier 2 every 2 yrs)
---

# Vendor Data-Protection Due-Diligence Questionnaire

**Issued by:** [Client-Name] · **Vendor:** [Vendor-Name] · **Service:** [Vendor-Services] · **Due date:** [DDQ-Due-Date]
Please answer every question, attach the evidence requested, and have the form signed by an authorised officer. Answering "Not applicable" requires a reason.

## Section A: Vendor profile
| # | Question | Response | Evidence |
|---|---|---|---|
| A1 | Legal name, CIN / registration, registered address, group parent | | Incorporation certificate |
| A2 | Description of services to be provided to [Client-Name] | | |
| A3 | Locations (countries / cities) where our data will be stored, processed or accessed (incl. support teams) | | |
| A4 | Name and contact of your privacy officer / DPO and security officer | | |
| A5 | Has your organisation been notified as a Significant Data Fiduciary, or registered as a Consent Manager? | | |
| A6 | Any data-protection penalty, Board / regulator proceeding, or reportable breach in the last 3 years? Give details. | | |

## Section B: Role and data
| # | Question | Response |
|---|---|---|
| B1 | Will you act only on our instructions (Data Processor), or use data for your own purposes? | |
| B2 | Categories of personal data you will process (itemised); any health, financial, biometric, government-ID or children's data? | |
| B3 | Approximate number of Data Principals / records | |
| B4 | Will you combine our data with other data, or use it for analytics, product improvement or AI/ML training? | |
| B5 | Will you use sub-processors? List them with service, location and data accessed. | |

## Section C: Governance and compliance
| # | Question | Y/N | Evidence |
|---|---|---|---|
| C1 | Do you have a board/management-approved data-protection policy aligned to the DPDP Act, 2023? | | Policy |
| C2 | Do you maintain a record of processing activities? | | Extract |
| C3 | Are staff bound by confidentiality and trained annually on data protection? | | Training records |
| C4 | Do you background-check staff with access to personal data? | | |
| C5 | Do you have a documented process to help clients with Data Principal rights requests within agreed SLAs? | | SOP |
| C6 | Can you stop processing and erase data for an individual on our instruction (e.g. withdrawal of consent)? Within how many hours / days? | | |
| C7 | Do you carry out DPIAs for high-risk processing? | | |

## Section D: Security safeguards (Rule 6)
| # | Question | Y/N | Evidence |
|---|---|---|---|
| D1 | Certifications held (ISO/IEC 27001, 27701, SOC 2 Type II, PCI DSS, CERT-In-empanelled audit)? | | Certificates + scope |
| D2 | Is personal data encrypted in transit (TLS 1.2+) and at rest (AES-256)? Who manages keys? | | |
| D3 | Do you use masking / tokenisation for sensitive fields? | | |
| D4 | Access control: unique IDs, MFA, RBAC, PAM, quarterly access reviews? | | |
| D5 | Are access and processing logs centrally collected, monitored and **kept ≥ 1 year**? | | Log policy |
| D6 | Do you keep ICT logs for 180 days in India, sync to NTP, and report incidents to CERT-In within 6 hours? | | |
| D7 | Backups: frequency, encryption, location, restore testing? | | BCP/DR plan |
| D8 | Vulnerability management: VAPT frequency, critical patch SLA? | | Latest VAPT summary |
| D9 | Secure SDLC; is production data barred from test environments? | | |
| D10 | Endpoint protection, DLP, email security? | | |
| D11 | Physical security of facilities and data centres? | | |

## Section E: Breach management (Rule 7)
| # | Question | Response |
|---|---|---|
| E1 | Do you have an incident-response plan, tested in the last 12 months? | |
| E2 | Within how many hours will you notify us of a breach affecting our data? (Required: ≤ [Processor-Breach-Notice-Hours] hours) | |
| E3 | Can you provide forensic logs and cooperate with our investigation and the Board's? | |
| E4 | Do you carry cyber insurance? Amount and insurer. | |

## Section F: Cross-border
| # | Question | Response |
|---|---|---|
| F1 | Will any data leave India or be accessible from outside India? Countries? | |
| F2 | Can you offer India-only hosting and support? | |
| F3 | Can you stop transfers to a country if the Government restricts it (s.16), or a sector regulator requires localisation? | |
| F4 | Are you subject to foreign laws that could compel disclosure of our data to foreign authorities? How do you handle such requests? | |

## Section G: Retention and erasure
| # | Question | Response |
|---|---|---|
| G1 | Can you apply our retention schedule, including keeping logs for a minimum of 1 year and then erasing? | |
| G2 | Erasure method (incl. backups) and time to erase at contract end? | |
| G3 | Will you provide a signed certificate of erasure? | |

<!-- IF Processes-Children-Data -->
## Section H: Children's data
| # | Question | Response |
|---|---|---|
| H1 | Will you ensure no tracking, behavioural monitoring or targeted advertising directed at children? | |
| H2 | Do your SDKs / tools include advertising or analytics identifiers that can be disabled for child users? | |
<!-- END IF -->

## Declaration
I confirm that the answers are true and complete, and I undertake to tell [Client-Name] promptly of any material change.
Name: ________ Designation: ________ Signature: ________ Date: ________

---
## Assessor section (internal — [Client-Name] only)
| Area | Score (0 Not met / 1 Partially / 2 Met) | Comment |
|---|---|---|
| Governance (C) | | |
| Security (D) | | |
| Breach (E) | | |
| Cross-border (F) | | |
| Retention (G) | | |
| **Risk tier** | ☐ Tier 1 (L4 data / > [Bulk-Threshold-Records] records / cross-border) ☐ Tier 2 ☐ Tier 3 | |
| **Decision** | ☐ Approve ☐ Approve with conditions ☐ Reject | Conditions: |
| Assessed by / Date | | |
