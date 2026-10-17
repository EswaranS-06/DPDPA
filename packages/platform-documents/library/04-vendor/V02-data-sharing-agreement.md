---
id: V02
title: Data Sharing Agreement (Data Fiduciary ↔ Data Fiduciary, incl. intra-group)
category: 4. Vendor / third-party documents
audience: Legal, partners, group entities
publish: contract
legal_basis: [DPDPA s.4, s.5, s.6, s.8(1),(3),(5)–(7), s.11(1)(b), s.12, s.16; Rules r.3, r.6, r.7]
applies_when: data shared with another Data Fiduciary (partners, co-brands, insurers, lenders, group companies, joint controllers)
flags: [Cross-Border-Transfer, Is-Group-Company, Processes-Children-Data]
version: 1.0
review_cycle: on renewal
---

> **Drafting note:** Use this agreement when the recipient decides its own purposes and means, which makes it an independent or joint Data Fiduciary. Examples: co-branded credit card partners, insurers, referral partners, and group companies using data for their own purposes. Where the recipient acts only on the client's instructions, use V01 instead. The key issue here is that **the disclosing party needs a lawful basis to share**, and the sharing must be covered in its notice. Under s.11(1)(b) the disclosing party must also be able to name the recipient in an access request.

# DATA SHARING AGREEMENT

This Agreement is made on [DSA-Date] between **[Client-Name]** ([Client-Registered-Address]) ("**Disclosing Party**") and **[Recipient-Name]** ([Recipient-Address]) ("**Receiving Party**").

## 1. Purpose of sharing
1.1 The Disclosing Party will share the Personal Data described in **Schedule 1** with the Receiving Party solely for [DSA-Purpose] (the "**Permitted Purpose**").
1.2 Each Party is an independent Data Fiduciary for its own processing, and is solely responsible for its compliance with the Act and Rules.<!-- IF DSA-Joint-Fiduciary --> For [Joint-Processing-Description], the Parties jointly determine purpose and means. They allocate responsibilities as set out in Schedule 2.<!-- END IF -->

## 2. Lawful basis and transparency
2.1 The Disclosing Party warrants that it has a lawful basis under s.4 of the Act to share the Personal Data. Specifically: [DSA-Legal-Basis] (for example, specific consent captured under consent purpose ID [DSA-Consent-Purpose-ID]). It also warrants that its notice to Data Principals identifies this sharing.
2.2 The Receiving Party shall give Data Principals its own notice under s.5 and Rule 3 where it relies on consent, and shall obtain any further consent its own purposes require.
2.3 The Receiving Party shall not process the shared Personal Data for any purpose other than the Permitted Purpose, and shall not share it onward except with its Data Processors under s.8(2), without the Disclosing Party's prior written consent and a lawful basis.

## 3. Consent withdrawal and rights
3.1 Where sharing is based on consent, the Disclosing Party shall notify the Receiving Party of any withdrawal within [DSA-Withdrawal-Notify-SLA]. The Receiving Party shall stop processing for the Permitted Purpose within [DSA-Withdrawal-Effect-SLA], and erase the data unless it has an independent lawful basis to keep it.
3.2 Each Party shall handle rights requests about its own processing. It shall forward to the other Party any request that relates to the other Party's processing within [DSA-Forward-Days] business days, and give reasonable help.
3.3 Corrections and erasures under s.12 shall be communicated to the other Party where the data was shared, so that both sets of data stay accurate (s.8(3)).

## 4. Data quality
The Disclosing Party shall make reasonable efforts to ensure the Personal Data is complete, accurate and consistent at the time of sharing (s.8(3)).

## 5. Security and breach
5.1 Each Party shall maintain reasonable security safeguards no less protective than Rule 6 for the shared data, including encryption in transit using [DSA-Transfer-Mechanism].
5.2 Each Party shall notify the other of any personal data breach affecting the shared data within [DSA-Breach-Notify-Hours] hours. Each remains responsible for its own intimations to the Board and to Data Principals under Rule 7, and the Parties shall coordinate the content of those communications.

## 6. Retention
The Receiving Party shall keep the shared data only for [DSA-Retention], and shall then erase it and confirm erasure in writing, subject to the minimum-retention requirements of Rule 8(3) and to any other law.

## 7. Cross-border
<!-- IF Cross-Border-Transfer -->
Any transfer of shared data outside India by the Receiving Party shall comply with s.16 of the Act, Rule 15 and V05.
<!-- END IF -->
<!-- IF NOT Cross-Border-Transfer -->
The Receiving Party shall not transfer the shared data outside India.
<!-- END IF -->

## 8. Children
<!-- IF Processes-Children-Data -->
Children's data shall be shared only where verifiable parental consent covers the sharing. The Receiving Party shall not use it for tracking, behavioural monitoring or targeted advertising.
<!-- END IF -->
<!-- IF NOT Processes-Children-Data -->
No personal data of children shall be shared under this Agreement.
<!-- END IF -->

## 9. Audit, liability, term
9.1 Each Party shall, on reasonable request, provide evidence of its compliance with this Agreement.
9.2 Each Party shall indemnify the other for losses, penalties and claims arising from its own breach of this Agreement or of the Act.
9.3 Term: [DSA-Term]. On termination, Clause 6 applies.
9.4 Governing law: India; courts at [Jurisdiction-City].

## SCHEDULE 1: Shared data
| Data Principal category | Data items | Frequency | Mechanism | Volume |
|---|---|---|---|---|
| [DSA-DP-Categories] | [DSA-Data-Items] | [DSA-Frequency] | [DSA-Transfer-Mechanism] | [DSA-Volume] |

<!-- IF DSA-Joint-Fiduciary -->
## SCHEDULE 2: Allocation of responsibilities (joint processing)
| Obligation | [Client-Name] | [Recipient-Name] |
|---|---|---|
| Notice & consent | | |
| Rights requests & grievance point of contact | | |
| Security of shared platform | | |
| Breach intimation lead | | |
| Retention & erasure | | |
<!-- END IF -->

| For [Client-Name] | For [Recipient-Name] |
|---|---|
| Name / Designation / Signature | Name / Designation / Signature |
