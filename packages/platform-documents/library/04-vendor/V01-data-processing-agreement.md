---
id: V01
title: Data Processing Agreement (Data Fiduciary → Data Processor)
category: 4. Vendor / third-party documents
audience: Procurement, Legal, vendors
publish: contract
legal_basis: [DPDPA s.2(k), s.8(1),(2),(4)–(7), s.16, s.17(1)(d); Rules r.6(1)(f), r.7, r.8(3), r.15]
applies_when: always (every processor / sub-processor)
flags: [Cross-Border-Transfer, Is-SDF, Sector, Processes-Children-Data]
version: 1.0
review_cycle: on contract renewal; template yearly
---

> **Drafting note:** Under s.8(2), a Data Fiduciary may engage a Data Processor only "under a valid contract". The Act places nearly all obligations on the Fiduciary, including liability for its processors' failures (s.8(1)), so this DPA has to carry those obligations down to the processor. Use it as a schedule to the master services agreement, or as a standalone agreement. Rule 8(3) Illustration 2 expressly expects the Fiduciary to make its processor retain logs for at least one year. Processor breach-notice timing must be short enough for the Fiduciary to meet "without delay" (Rule 7) and CERT-In's 6-hour window.

# DATA PROCESSING AGREEMENT

This Data Processing Agreement ("**DPA**") is entered into on [DPA-Date] ("**Effective Date**")

**BETWEEN**
**[Client-Name]**, a [Client-Legal-Entity-Type] incorporated under the laws of India, CIN [Client-CIN], having its registered office at [Client-Registered-Address] (the "**Data Fiduciary**");

**AND**
**[Vendor-Name]**, a [Vendor-Entity-Type], having its registered office at [Vendor-Address] (the "**Data Processor**").

(each a "**Party**", together the "**Parties**").

## RECITALS
A. The Parties have entered into [Principal-Agreement-Name] dated [Principal-Agreement-Date] (the "**Principal Agreement**"), under which the Data Processor provides [Vendor-Services] (the "**Services**").
B. In providing the Services, the Data Processor will process personal data on behalf of the Data Fiduciary.
C. Section 8(2) of the Digital Personal Data Protection Act, 2023 requires such processing to take place under a valid contract. The Parties enter into this DPA to meet that requirement and the requirements of the Digital Personal Data Protection Rules, 2025.

## 1. DEFINITIONS AND INTERPRETATION
1.1 "**Act**" means the Digital Personal Data Protection Act, 2023, and "**Rules**" means the Digital Personal Data Protection Rules, 2025, each as amended, together with any notifications, orders and directions issued under them, including by the Data Protection Board of India ("**Board**").
1.2 "**Personal Data**" means personal data, as defined in the Act, that the Data Processor processes on behalf of the Data Fiduciary under the Principal Agreement. "**Data Principal**", "**processing**", "**personal data breach**" and "**Consent Manager**" have the meanings given in the Act.
1.3 "**Sub-processor**" means any third party, including an affiliate of the Data Processor, that the Data Processor engages to process Personal Data.
1.4 "**Instructions**" means this DPA, the Principal Agreement, and any written instruction the Data Fiduciary issues.
1.5 "**Applicable Data Protection Law**" means the Act, the Rules, the Information Technology Act, 2000 and rules under it<!-- IF Sector == BFSI-RBI -->, RBI directions on outsourcing, IT and data localisation<!-- END IF --><!-- IF Sector == Healthcare -->, applicable health-records laws<!-- END IF -->, and any other law that applies to the processing.
1.6 If this DPA conflicts with the Principal Agreement on the processing of Personal Data, this DPA prevails.

## 2. ROLES AND SCOPE
2.1 The Data Fiduciary determines the purpose and means of processing. The Data Processor processes Personal Data only on behalf of the Data Fiduciary.
2.2 The subject matter, nature, purpose and duration of processing, the categories of Personal Data and the categories of Data Principals are set out in **Annex 1**.
2.3 The Data Processor acknowledges that the Data Fiduciary is responsible under s.8(1) of the Act for processing carried out on its behalf. The Data Processor will therefore comply with this DPA strictly, so that the Data Fiduciary can meet its obligations.

## 3. PROCESSING ON INSTRUCTIONS
3.1 The Data Processor shall process Personal Data only on documented Instructions, including for any transfer outside India, unless a law in India requires otherwise. In that case it shall inform the Data Fiduciary before processing, unless the law prohibits it.
3.2 The Data Processor shall not process Personal Data for its own purposes or for any third party. In particular it shall not sell it, use it for advertising, profiling or analytics, use it to train AI/ML models, or combine it with other data, except as the Instructions expressly permit.
3.3 The Data Processor shall immediately inform the Data Fiduciary if, in its opinion, an Instruction breaches Applicable Data Protection Law.

## 4. CONFIDENTIALITY AND PERSONNEL
4.1 The Data Processor shall ensure that persons authorised to process Personal Data are bound by written confidentiality obligations, receive data-protection training, and have access only on a need-to-know basis.
4.2 The Data Processor shall carry out background checks on personnel with access to [Vendor-L4-Access-Description], proportionate to the risk.

## 5. DATA PRINCIPAL RIGHTS, CONSENT AND ACCURACY
5.1 The Data Processor shall promptly, and in any event within [Processor-Rights-Assist-Days] business days, help the Data Fiduciary respond to requests to exercise rights under ss.11–14 of the Act, including providing details of the data processed and of any Sub-processors.
5.2 If the Data Processor receives a request or grievance directly from a Data Principal, it shall forward it to the Data Fiduciary within [Processor-Forward-Hours] hours and shall not respond unless authorised.
5.3 **Withdrawal of consent.** When the Data Fiduciary notifies the Data Processor that consent has been withdrawn, the Data Processor shall stop processing the affected Personal Data within [Processor-Withdrawal-SLA] (s.6(6)) and shall confirm in writing.
5.4 **Accuracy.** The Data Processor shall implement the corrections, completions and updates the Data Fiduciary communicates within [Processor-Correction-SLA], and shall not alter Personal Data except on Instructions.

## 6. SECURITY SAFEGUARDS
6.1 The Data Processor shall implement and maintain reasonable security safeguards to prevent personal data breaches (s.8(5)). These include, at a minimum, the measures in Rule 6(1) and **Annex 2**:
(a) encryption, obfuscation, masking or virtual tokens mapped to Personal Data;
(b) access control over computer resources;
(c) visibility of access through logs, monitoring and review, so that unauthorised access can be detected, investigated, remediated and prevented from recurring;
(d) backups and continuity measures, so that processing can continue if confidentiality, integrity or availability is compromised;
(e) technical and organisational measures that ensure these safeguards are effectively observed.
6.2 **Log retention.** The Data Processor shall keep Personal Data, associated traffic data and processing logs for **at least one year** from the date of processing, for the purposes in the Seventh Schedule to the Rules and for breach detection and investigation. It shall then erase them as Clause 11 provides, unless a law requires longer retention (Rules 6(1)(e) and 8(3)). <!-- IF Sector != General -->ICT logs shall also be kept in India for 180 days as the CERT-In Directions require.<!-- END IF -->
6.3 The Data Processor shall maintain [Vendor-Required-Certifications] (or equivalent) throughout the term and shall give the Data Fiduciary copies of its certificates and audit reports on request.

## 7. SUB-PROCESSING
7.1 The Data Processor shall not engage a Sub-processor without the Data Fiduciary's prior written authorisation. The authorised Sub-processors at the Effective Date are listed in **Annex 3**.
7.2 The Data Processor shall give at least [Subprocessor-Notice-Days] days' written notice of any intended addition or replacement. The Data Fiduciary may object on reasonable grounds. If the objection is not resolved, the Data Fiduciary may terminate the affected Services without penalty.
7.3 The Data Processor shall impose on each Sub-processor, by written contract, obligations no less protective than those in this DPA. It remains fully liable to the Data Fiduciary for each Sub-processor's performance.

## 8. PERSONAL DATA BREACH
8.1 The Data Processor shall notify the Data Fiduciary of any personal data breach, or reasonably suspected breach, affecting Personal Data **without undue delay and in any event within [Processor-Breach-Notice-Hours] hours** of becoming aware of it. It shall use the form in **Annex 4**, sent to [Client-Breach-Notification-Email] and [Client-Breach-Hotline].
8.2 The notice shall include, as far as is then known: the nature, extent, timing and location of the breach; the categories and approximate number of Data Principals and records; the likely consequences; the measures taken or proposed; and a contact person. It shall be supplemented as further information becomes available, so that the Data Fiduciary can give its detailed report to the Board within 72 hours (Rule 7(2)(b)).
8.3 The Data Processor shall:
(a) immediately take steps to contain the breach and mitigate its effects;
(b) preserve evidence and logs;
(c) cooperate fully with the Data Fiduciary's investigation;
(d) **not** notify the Board, Data Principals or the media about a breach affecting Personal Data without the Data Fiduciary's prior written consent, except where a law requires it (for example CERT-In reporting). In that case it shall coordinate with the Data Fiduciary in advance.
8.4 The Data Processor shall bear the reasonable costs of breach response, including the cost of notifying Data Principals, to the extent the breach was caused by its breach of this DPA.

## 9. TRANSFERS OUTSIDE INDIA
<!-- IF Cross-Border-Transfer -->
9.1 The Data Processor may transfer Personal Data to, store it in, or access it from, a place outside India only in the countries and for the purposes listed in Annex 1, Part E. Any such transfer must comply with s.16 of the Act, any requirement specified under Rule 15, and Applicable Data Protection Law. The cross-border clauses in [V05-Ref] apply.
<!-- END IF -->
<!-- IF NOT Cross-Border-Transfer -->
9.1 The Data Processor shall store and process Personal Data only in India, and shall not allow it to be accessed from outside India, without the Data Fiduciary's prior written consent.
<!-- END IF -->
9.2 If the Central Government restricts transfer to a country under s.16(1), or a sectoral authority imposes a localisation requirement, the Data Processor shall stop transferring to that country within the period the Data Fiduciary reasonably specifies.

## 10. AUDIT AND INFORMATION
10.1 The Data Processor shall make available all information needed to demonstrate compliance with this DPA. It shall allow and contribute to audits and inspections by the Data Fiduciary or an auditor the Data Fiduciary appoints<!-- IF Is-SDF --> (including the independent data auditor under s.10(2)(b) of the Act)<!-- END IF -->, on [Audit-Notice-Days] days' notice, or immediately after a breach. Audits may take place not more than [Audit-Frequency] except where there is cause.
10.2 The Data Processor shall complete the Data Fiduciary's due-diligence questionnaire (V03) at onboarding and [DDQ-Refresh-Frequency] after that.
10.3 The Data Processor shall cooperate with any inquiry or direction of the Board, or any call for information under s.36 of the Act, relating to Personal Data.

## 11. RETURN AND ERASURE
11.1 When the Services end, or earlier on the Data Fiduciary's written request (including on withdrawal of consent or when the specified purpose is no longer served under s.8(7)), the Data Processor shall, at the Data Fiduciary's option, return all Personal Data in [Return-Format] and/or erase it, including from backups and Sub-processors, within [Processor-Erasure-Days] days. This is subject only to Clause 6.2 and to any retention a law in India requires.
11.2 The Data Processor shall give a written **certificate of erasure**, signed by an authorised officer, within [Processor-Erasure-Certificate-Days] days.

## 12. LIABILITY AND INDEMNITY
12.1 The Data Processor shall indemnify the Data Fiduciary against all losses, penalties imposed by the Board or any authority, compensation, costs (including reasonable legal fees and the cost of notifying Data Principals) and claims arising from: (a) any breach of this DPA or of Applicable Data Protection Law by the Data Processor or its Sub-processors; or (b) any personal data breach caused by them.
12.2 <!-- IF DPA-Uncapped-Liability -->The Data Processor's liability under this Clause 12 is **not** subject to any limitation or exclusion of liability in the Principal Agreement.<!-- END IF --><!-- IF NOT DPA-Uncapped-Liability -->The Data Processor's liability under this Clause 12 is subject to a separate cap of [DPA-Liability-Cap], which is in addition to, and not part of, the general cap in the Principal Agreement.<!-- END IF -->
12.3 The Data Processor shall maintain cyber-liability insurance of at least [Vendor-Cyber-Insurance-Amount] during the term and for [Insurance-Tail-Years] years afterwards.

## 13. TERM AND TERMINATION
13.1 This DPA continues for as long as the Data Processor processes Personal Data.
13.2 The Data Fiduciary may terminate the Principal Agreement, wholly or in part, immediately by written notice if the Data Processor materially breaches this DPA, suffers a serious personal data breach, or is subject to a direction of the Board that prevents processing.
13.3 Clauses 6.2, 8, 10, 11 and 12 survive termination.

## 14. GENERAL
14.1 **Governing law and jurisdiction:** the laws of India. Courts at [Jurisdiction-City]<!-- IF Arbitration -->, subject to arbitration under the Arbitration and Conciliation Act, 1996, seated at [Arbitration-Seat]<!-- END IF -->.
14.2 **Changes in law:** the Parties shall amend this DPA in good faith to reflect any amendment to the Act or Rules, or any notification, order or Board direction.
14.3 **Notices:** to the Data Fiduciary's DPO / privacy contact at [Privacy-Contact-Email], and to the Data Processor's privacy contact at [Vendor-Privacy-Contact].

**IN WITNESS WHEREOF** the Parties have executed this DPA on the Effective Date.

| For [Client-Name] | For [Vendor-Name] |
|---|---|
| Name: [Client-Signatory-Name] | Name: [Vendor-Signatory-Name] |
| Designation: [Client-Signatory-Designation] | Designation: [Vendor-Signatory-Designation] |
| Signature: | Signature: |

---

### ANNEX 1: DETAILS OF PROCESSING
| Item | Details |
|---|---|
| A. Subject matter & nature | [Vendor-Services] |
| B. Purpose(s) (RoPA IDs) | [DPA-Purposes] |
| C. Categories of Data Principals | [DPA-DP-Categories] |
| D. Personal Data items (itemised; mark L4) | [DPA-Data-Items] |
| E. Locations of processing / storage / access | [DPA-Locations] |
| F. Duration | Term of the Principal Agreement, plus the retention under Clause 6.2 |
| G. Retention instructions | [DPA-Retention-Instructions] |
| H. Children's data | <!-- IF Processes-Children-Data -->Yes. The Data Processor shall not use children's data for tracking, behavioural monitoring or targeted advertising (s.9(3)).<!-- END IF --><!-- IF NOT Processes-Children-Data -->No<!-- END IF --> |

### ANNEX 2: TECHNICAL AND ORGANISATIONAL MEASURES (minimum)
1. **Governance:** information-security policy; named security and privacy officer; staff training; vendor risk management.
2. **Encryption:** TLS 1.2+ in transit; AES-256 at rest; key management in KMS/HSM; tokenisation or masking of L4 fields.
3. **Access control:** unique IDs; MFA; RBAC; PAM for administrators; quarterly access reviews; access removed within 24 hours of exit.
4. **Logging & monitoring:** centralised logs; SIEM alerting; logs kept for ≥ 1 year; NTP time sync.
5. **Network & endpoint:** firewalls/WAF; EDR; patching within [Critical-Patch-Days] days for critical vulnerabilities; annual VAPT; remediation of high-severity findings.
6. **Secure development:** OWASP-aligned SDLC; code review; no production personal data in test environments.
7. **Continuity:** encrypted backups; restore tests every [Restore-Test-Frequency]; defined RPO/RTO.
8. **Physical security:** controlled access to facilities and data centres.
9. **Incident response:** documented plan; tested annually; 24×7 contact.
10. **Data minimisation & erasure:** NIST SP 800-88-aligned disposal; erasure certificates.

### ANNEX 3: AUTHORISED SUB-PROCESSORS
| Sub-processor | Service | Location | Data accessed | Safeguards |
|---|---|---|---|---|
<!-- REPEAT Sub-Processors -->
| [Subprocessor-Name] | [Subprocessor-Service] | [Subprocessor-Location] | [Subprocessor-Data] | [Subprocessor-Safeguards] |
<!-- END REPEAT -->

### ANNEX 4: PROCESSOR BREACH NOTIFICATION FORM
Processor: ____ · Reporter & contact: ____ · Date/time breach detected: ____ · Date/time occurred (if known): ____ · Nature (confidentiality / integrity / availability): ____ · Systems & location: ____ · Data categories: ____ · Approx. no. of Data Principals / records: ____ · Cause (known / suspected): ____ · Containment done: ____ · Likely consequences: ____ · Next update due: ____
