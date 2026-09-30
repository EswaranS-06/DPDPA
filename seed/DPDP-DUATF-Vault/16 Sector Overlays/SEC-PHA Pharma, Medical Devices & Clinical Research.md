---
type: sector_overlay
sector_code: PHA
title: Pharma, Medical Devices & Clinical Research
covers: Pharma manufacturers, CROs, medical device companies, biobanks
regulators:
- CDSCO/DCGI
- Ethics Committees
- ICMR
- NPPA
- CERT-In
key_principals:
- Trial participant
- Patient in PSP
- Healthcare professional
- Medical representative
- Reporter of adverse events
process_templates:
- "[[PHA-01 Clinical trial conduct]]"
- "[[PHA-02 Pharmacovigilance & adverse events]]"
- "[[PHA-03 HCP engagement & field force CRM]]"
- "[[PHA-04 Patient support programmes]]"
tags:
- dpdp/sector
- sector/pha
---

# SEC-PHA - Pharma, Medical Devices & Clinical Research

**Covers:** Pharma manufacturers, CROs, medical device companies, biobanks

**Regulators:** CDSCO/DCGI, Ethics Committees, ICMR, NPPA, CERT-In

## Sector laws that run alongside DPDP (s.38: DPDP is in addition; s.16(2): stricter transfer rules survive)
| Law / instrument | Why it matters for personal data |
|---|---|
| New Drugs and Clinical Trials Rules 2019 | Trial conduct, informed consent (incl. audio-video consent for vulnerable), record retention |
| ICMR National Ethical Guidelines for Biomedical & Health Research 2017 | Consent, privacy, biobanking |
| Pharmacovigilance Programme of India (PvPI) | Adverse event reports |
| Uniform Code for Pharmaceutical Marketing Practices 2024 | HCP engagement records |
| Medical Devices Rules 2017 | Device vigilance |

## Localisation / cross-border
Trial data often shared with global sponsors - cross-border hotspot.

## Retention anchors (use in Retention Rules; reconciles s.8(7) 'retention required by law')
| Record | Period | Source | Confidence |
|---|---|---|---|
| Clinical trial records | Per NDCT Rules (e.g. >= 5 years after trial completion) | NDCT Rules 2019 | verify |
| Pharmacovigilance case records | Per PvPI / company SOPs | PvPI | verify |

> Confidence `verify` means you must confirm the current text before citing it in a client deliverable.

## DPDP hotspots in this sector
- Trial participants' health & genetic data sent abroad
- Patient support programmes (PSPs) via hubs/vendors
- HCP (doctor) data for marketing
- Medical reps' CRM & call notes
- Adverse event reports from social media

## Where assessments get stuck here
- Global sponsor dictates data model; Indian affiliate is still DF or processor - resolve role
- Research exemption (s.17(2)(b)) does not cover identifiable trial conduct

See also [[Stuck-Point Playbook]].

## Typical data principals
Trial participant, Patient in PSP, Healthcare professional, Medical representative, Reporter of adverse events

## Sector process templates
- [[PHA-01 Clinical trial conduct]] (Clinical)
- [[PHA-02 Pharmacovigilance & adverse events]] (Safety)
- [[PHA-03 HCP engagement & field force CRM]] (Commercial)
- [[PHA-04 Patient support programmes]] (Patient Services)

## Plus common functions
All [[Process Catalogue Index|common-function templates]] (HR, finance, marketing, IT, admin, legal) also apply.
