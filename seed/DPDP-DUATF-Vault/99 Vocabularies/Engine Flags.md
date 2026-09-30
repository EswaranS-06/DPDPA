---
type: vocabulary
tags:
- dpdp/vocabulary
---

# Engine Flags

Set these on `processing_activity.flags`. They are what the engine reads.

| Flag | Meaning | Domain |
|---|---|---|
| `children` | Activity processes personal data of anyone under 18 (knowingly or likely). | [[D07 Children & Persons with Disability]] |
| `pwd` | Activity processes data of a person with disability acting through a lawful guardian. | [[D07 Children & Persons with Disability]] |
| `processor` | A Data Processor processes data on behalf of the entity in this activity. | [[D13 Processor & Third-Party Management]] |
| `cross_border` | Data is stored, accessed or processed outside India (incl. vendor support access). | [[D14 Cross-Border Transfer & Localisation]] |
| `third_schedule` | Entity is in a Third Schedule class (e-commerce >= 2 cr, gaming >= 50 lakh, social media >= 2 cr users). | [[D11 Retention & Erasure]] |
| `decision_or_disclosure` | Data is used to make a decision affecting the DP or is disclosed to another Data Fiduciary. | [[D08 Data Quality]] |
| `legacy_data` | Activity holds data collected on consent before DPDP commencement. | [[D05 Notice]] |
| `online_presence` | Entity offers a website/app through which DPs interact (R9, R14 publication). | [[D12 Rights & Grievance]] |
| `consent_manager_used` | DPs may give/withdraw consent via a registered Consent Manager. | [[D06 Consent Lifecycle]] |
| `tracking_ads` | Tracking, behavioural monitoring, profiling or targeted advertising. | [[D07 Children & Persons with Disability]] |
| `marketing` | Promotional communications (SMS/voice/email/WhatsApp). | [[D06 Consent Lifecycle]] |
| `research` | Research, archiving or statistical processing. | [[D17 State & Research Processing]] |
