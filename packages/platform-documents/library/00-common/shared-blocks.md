---
id: X03
title: Shared Blocks (Document Control, Definitions, Contact Block)
publish: internal
version: 1.0
---

# Shared Blocks

Several templates reuse the blocks below. The UI should keep one copy of each and insert it wherever a template has `<!-- INCLUDE block-name -->`.

---

## BLOCK: doc-control  (internal policies, SOPs, registers, contracts)

| Field | Value |
|---|---|
| Document title | [Document-Title] |
| Document ID | [Client-Short-Code]-[Document-ID] |
| Version | [Document-Version] |
| Classification | [Document-Classification] |
| Owner | [Document-Owner] |
| Approved by | [Approving-Authority] |
| Approval date | [Approval-Date] |
| Effective date | [Effective-Date] |
| Next review | [Next-Review-Date] |
| Prepared by | [Server-name] (engagement ref. [Engagement-Ref]) for [Client-Name] |

**Revision history**

| Version | Date | Author | Summary of changes | Approved by |
|---|---|---|---|---|
| [Document-Version] | [Effective-Date] | [Document-Owner] | Initial release aligned to DPDP Act, 2023 and DPDP Rules, 2025 | [Approving-Authority] |

---

## BLOCK: public-header  (public notices; no [Server-name])

**[Client-Name]**  
[Document-Title]  
Version [Document-Version] · Effective [Effective-Date] · Last updated [Last-Updated-Date]

---

## BLOCK: definitions

The capitalised terms below carry the meanings given in the Digital Personal Data Protection Act, 2023 ("**Act**") and the Digital Personal Data Protection Rules, 2025 ("**Rules**"):

- **Board**: the Data Protection Board of India established under section 18 of the Act.
- **Child**: an individual who has not completed eighteen years of age.
- **Consent Manager**: a person registered with the Board who acts as a single point of contact enabling a Data Principal to give, manage, review and withdraw consent through an accessible, transparent and interoperable platform.
- **Data Fiduciary**: the person who, alone or with others, determines the purpose and means of processing personal data. For this document it is [Client-Name].
- **Data Principal / you**: the individual to whom the personal data relates. It includes the parent or lawful guardian of a child, and the lawful guardian of a person with disability, acting on that individual's behalf.
- **Data Processor**: a person who processes personal data on behalf of a Data Fiduciary.
- **Data Protection Officer (DPO)**: the individual appointed under section 10(2)(a) of the Act. Where [Client-Name] is not a Significant Data Fiduciary, this means the person designated under section 8(9) of the Act and Rule 9 to answer questions about processing.
- **Grievance Officer**: the officer designated by [Client-Name] to receive and resolve grievances under section 13 of the Act.
- **Personal Data**: any data about an individual who is identifiable by or in relation to that data.
- **Personal Data Breach**: any unauthorised processing of personal data, or accidental disclosure, acquisition, sharing, use, alteration, destruction or loss of access to personal data, that compromises its confidentiality, integrity or availability.
- **Processing**: a wholly or partly automated operation or set of operations performed on digital personal data. It includes collection, recording, organisation, structuring, storage, adaptation, retrieval, use, alignment or combination, indexing, sharing, disclosure by transmission, dissemination or otherwise making available, restriction, erasure or destruction.
- **Specified Purpose**: the purpose set out in the notice given to the Data Principal under section 5 of the Act and Rule 3.
- **Legitimate Use**: the uses listed in section 7 of the Act, under which personal data may be processed without consent.

---

## BLOCK: contact-block  (s.8(9), Rule 9; must also appear in every rights response)

<!-- IF Is-SDF -->
**Data Protection Officer**
[DPO-Name], [DPO-Designation]
[Client-Name], [DPO-Address]
Email: [DPO-Email] · Phone: [DPO-Phone]
<!-- END IF -->
<!-- IF NOT Is-SDF -->
**Privacy Contact (person designated under section 8(9) of the Act)**
[Privacy-Contact-Name], [Privacy-Contact-Designation]
Email: [Privacy-Contact-Email] · Phone: [Privacy-Contact-Phone]
<!-- END IF -->

**Grievance Officer**
[Grievance-Officer-Name], [Grievance-Officer-Designation]
[Client-Name], [Grievance-Officer-Address]
Email: [Grievance-Officer-Email] · Phone: [Grievance-Officer-Phone]
Working hours: [Grievance-Working-Hours]

**Online**
Rights & grievance portal: [Rights-Portal-URL]
Consent preferences: [Consent-Preferences-URL]

---

## BLOCK: board-complaint

If you are not satisfied with how [Client-Name] resolves your grievance, you may file a complaint with the **Data Protection Board of India** through its digital office at [DPB-Complaint-URL], in the manner the Board specifies. Under section 13(3) of the Act, you must first use our grievance redressal mechanism before you approach the Board.

---

## BLOCK: languages

This document is available in English and in the following languages listed in the Eighth Schedule to the Constitution of India: [Notice-Languages]. To read it in another language, select it at [Privacy-Notice-URL] or write to [Grievance-Officer-Email].

> **Drafting note:** Section 5(3) and section 6(3) of the Act require that the Data Principal be given the option to access the notice and consent request in English or any Eighth Schedule language. The Eighth Schedule lists 22 languages: Assamese, Bengali, Bodo, Dogri, Gujarati, Hindi, Kannada, Kashmiri, Konkani, Maithili, Malayalam, Manipuri, Marathi, Nepali, Odia, Punjabi, Sanskrit, Santali, Sindhi, Tamil, Telugu, Urdu. Choose languages based on the client's footprint, and offer translation of other languages on request.
