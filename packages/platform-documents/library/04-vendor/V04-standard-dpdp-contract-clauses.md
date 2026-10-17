---
id: V04
title: Standard DPDP Clauses for Existing Commercial Contracts (Amendment Rider)
category: 4. Vendor / third-party documents
audience: Legal, Procurement
publish: contract
legal_basis: [DPDPA s.6(6), s.8(1),(2),(5)–(7), s.16; Rules r.6, r.7, r.8(3), r.15]
applies_when: retrofitting existing vendor / customer / partner contracts that involve personal data, where a full DPA (V01) is not practical
flags: [Cross-Border-Transfer, Is-SDF]
version: 1.0
review_cycle: yearly
---

> **Drafting note:** This is a short-form amendment that inserts the minimum DPDP clauses into an existing agreement. Use V01 for new or high-risk (Tier 1) vendors. Each clause below is self-contained, so the UI can offer them as a "clause library", picking individual clauses for a given contract.

# AMENDMENT AGREEMENT — DATA PROTECTION RIDER

This Amendment is made on [Rider-Date] between [Client-Name] ("**Company**") and [Vendor-Name] ("**Counterparty**"). It amends [Principal-Agreement-Name] dated [Principal-Agreement-Date] ("**Agreement**"), with effect from [Rider-Effective-Date]. The following clauses are inserted as Clause [Rider-Clause-No] of the Agreement.

---

### Clause DP-1: Definitions and compliance
Terms such as "personal data", "Data Fiduciary", "Data Processor", "Data Principal", "processing" and "personal data breach" have the meanings given in the Digital Personal Data Protection Act, 2023 ("**Act**"). The Counterparty shall comply with the Act, the Digital Personal Data Protection Rules, 2025 ("**Rules**") and all other applicable laws in processing any personal data in connection with this Agreement ("**Company Personal Data**").

### Clause DP-2: Purpose limitation
The Counterparty shall process Company Personal Data **only** to perform its obligations under this Agreement and on the Company's documented instructions. It shall not process Company Personal Data for its own purposes, or for any other purpose (including marketing, profiling, analytics, sale, or training of AI models), and shall not combine it with other data, unless the Company expressly permits this in writing.

### Clause DP-3: Sub-processing restrictions
The Counterparty shall not engage any sub-processor to process Company Personal Data without the Company's prior written approval. Any approved sub-processor must be bound by written terms no less protective than this Rider. The Counterparty remains fully liable for the acts and omissions of its sub-processors. The current approved list is: [Approved-Subprocessors].

### Clause DP-4: Security safeguards
The Counterparty shall implement reasonable security safeguards to prevent personal data breaches. These include, as a minimum: encryption, masking or tokenisation; access controls; logging, monitoring and review of access, with logs kept for at least one year; backups; and technical and organisational measures to ensure these safeguards are followed, as required by Rule 6.

### Clause DP-5: Breach notification
The Counterparty shall notify the Company at [Client-Breach-Notification-Email] of any actual or suspected personal data breach affecting Company Personal Data **without undue delay and in any event within [Processor-Breach-Notice-Hours] hours** of becoming aware of it. The notice shall give the nature, extent, timing, location and likely impact of the breach, and the Counterparty shall send updates as information becomes available. The Counterparty shall contain and mitigate the breach, preserve evidence, and cooperate fully, so that the Company can intimate the Data Protection Board of India and affected Data Principals under Rule 7, including the detailed report due within 72 hours. Except as required by law, the Counterparty shall not notify any third party without the Company's prior written consent.

### Clause DP-6: Consent withdrawal and rights assistance
When the Company notifies it of a withdrawal of consent or a Data Principal request, the Counterparty shall stop processing, correct, or erase the affected Company Personal Data within [Processor-Withdrawal-SLA], and shall confirm in writing. It shall forward any request it receives directly from a Data Principal to the Company within [Processor-Forward-Hours] hours.

### Clause DP-7: Retention, deletion and return on termination
The Counterparty shall keep Company Personal Data only for as long as needed to perform this Agreement, subject to the minimum one-year retention of personal data, traffic data and processing logs under Rule 8(3) and to any other law. When this Agreement expires or terminates, or earlier on request, the Counterparty shall, at the Company's option, return and/or securely erase all Company Personal Data (including copies held by sub-processors and in backups) within [Processor-Erasure-Days] days. It shall give a signed certificate of erasure within [Processor-Erasure-Certificate-Days] days.

### Clause DP-8: Audit rights
The Counterparty shall provide all information reasonably necessary to demonstrate compliance with this Rider. On [Audit-Notice-Days] days' written notice, or immediately after a personal data breach, it shall allow the Company or its appointed auditor<!-- IF Is-SDF --> (including the Company's independent data auditor under section 10(2)(b) of the Act)<!-- END IF --> to audit its relevant facilities, systems, records and personnel. The Counterparty shall promptly fix any non-compliance found.

### Clause DP-9: Cross-border transfer
<!-- IF Cross-Border-Transfer -->
The Counterparty may transfer, store or access Company Personal Data outside India only in [Cross-Border-Countries] and only for [Cross-Border-Purposes]. It shall comply with section 16 of the Act, any requirement notified under Rule 15, and any sector-specific localisation requirement. It shall stop any transfer to a country restricted by the Central Government immediately on notification.
<!-- END IF -->
<!-- IF NOT Cross-Border-Transfer -->
The Counterparty shall store, process and access Company Personal Data only within India.
<!-- END IF -->

### Clause DP-10: Indemnity and liability
The Counterparty shall indemnify and hold harmless the Company against all losses, penalties imposed by the Data Protection Board or any other authority, compensation, costs and expenses arising from the Counterparty's (or its sub-processors') breach of this Rider or of the Act. <!-- IF DPA-Uncapped-Liability -->The limitation of liability in the Agreement shall not apply to this Clause.<!-- END IF --><!-- IF NOT DPA-Uncapped-Liability -->Liability under this Clause is subject to a separate cap of [DPA-Liability-Cap].<!-- END IF -->

### Clause DP-11: Termination for data-protection breach
The Company may terminate this Agreement immediately by written notice if the Counterparty commits a material breach of this Rider or suffers a serious personal data breach attributable to it.

### Clause DP-12: Change in law
The Parties shall negotiate in good faith any amendment needed to reflect changes in the Act or Rules, or in any notification, order or direction of the Central Government or the Data Protection Board.

### Clause DP-13: Survival and precedence
Clauses DP-4, DP-5, DP-7, DP-8 and DP-10 survive termination. If this Rider conflicts with the Agreement on the processing of personal data, this Rider prevails.

---
All other terms of the Agreement remain unchanged.

| For [Client-Name] | For [Vendor-Name] |
|---|---|
| Name / Designation / Signature / Date | Name / Designation / Signature / Date |

---
### Clause library: reciprocal versions
When the **client is the processor** for its customer (B2B SaaS / BPO), use the same clauses in mirrored form. Add a cap on assistance costs and require the instructing Data Fiduciary to warrant that it has a lawful basis for the processing.<!-- IF Foreign-Contract-Processing --> For processing of foreign Data Principals' data under a contract with a person outside India, note the s.17(1)(d) exemption: Chapter II (except s.8(1) and s.8(5)), Chapter III and s.16 do not apply, so only the responsibility and security-safeguard obligations continue.<!-- END IF -->
