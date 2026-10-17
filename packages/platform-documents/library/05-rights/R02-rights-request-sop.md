---
id: R02
title: Data Principal Rights Request SOP (Access, Correction, Erasure, Nomination)
category: 5. Data principal rights handling
audience: Rights desk, Grievance Officer, DPO office, system owners, processors
publish: internal
legal_basis: [DPDPA s.6(4), s.8(3),(7),(9), s.11, s.12, s.13, s.14, s.15; Rules r.9, r.14(1)–(5)]
applies_when: always
flags: [Is-SDF, Processes-Children-Data, Uses-Consent-Manager, Sector]
version: 1.0
review_cycle: annually
---

<!-- INCLUDE doc-control -->

# Rights Request SOP

## 1. Purpose
To fulfil Data Principals' rights under the Act consistently, securely and within defined SLAs, and to keep evidence of every request.

## 2. Rights covered
| Right | Section | Applies to processing based on |
|---|---|---|
| Access to information | s.11 | Consent, or s.7(a) voluntary provision |
| Correction, completion, updating | s.12(1),(2) | Consent, or s.7(a) |
| Erasure | s.12(1),(3) | Consent, or s.7(a) |
| Grievance redressal | s.13 | All processing (see R01) |
| Nomination | s.14 | All |
| Withdrawal of consent | s.6(4) | Consent (see C02) |

> **Drafting note:** As a policy choice, [Client-Name] may extend access and correction to legitimate-use processing too (e.g. employees under s.7(i)). The default here is `Extend-Rights-To-Legitimate-Use = [Extend-Rights-To-Legitimate-Use]`.

## 3. Service levels
| Stage | SLA |
|---|---|
| Acknowledgement | [Rights-Ack-Period] |
| Identity verification complete | [Rights-Verify-Period] |
| Fulfilment: access | [Rights-Access-SLA] |
| Fulfilment: correction / update | [Rights-Correction-SLA] |
| Fulfilment: erasure | [Rights-Erasure-SLA] |
| Nomination registered | [Nomination-SLA] |
| Overall outer limit (where the request is also a grievance) | [Grievance-Resolution-Period] (≤ 90 days, Rule 14(3)) |

> **Drafting note:** The Act and Rules don't set separate deadlines for access, correction or erasure. Rule 14(3) caps the grievance response at 90 days. Recommended defaults: acknowledge in 2 working days; fulfil in 15–30 days. Use the stricter figure where a sector rule applies.

## 4. Intake and verification
1. **Channels:** rights portal [Rights-Portal-URL], email [Grievance-Officer-Email], app [App-Rights-Path], branch / desk (Form R03), post<!-- IF Uses-Consent-Manager -->, Consent Manager<!-- END IF -->.
2. **Identification (Rule 14(1)(b), 14(5)):** the Data Principal identifies themselves with a published identifier, such as [Identifier-Types]. Verify by OTP to the registered mobile or email, or by logging in to the account. Ask for extra proof only for high-risk requests: access to L4 data, erasure, a change of contact details, or a request from a representative.
3. **Representatives:**
   - Parent or lawful guardian of a child: VPC record or proof of guardianship (N05).
   - Lawful guardian of a person with disability: court, designated-authority or local-level-committee order (Rule 11).
   - Nominee: registered nomination plus a death certificate or proof of incapacity (§5.5).
   - Authorised agent: a signed authorisation, and verification of the Data Principal.
4. Log the request in the rights log with ticket ID, type, channel, timestamps and verification method.
5. **Do not ask for more personal data than verification requires.** Verification data is discarded once it has been used, except for the record of the verification itself.

## 5. Fulfilment procedures

### 5.1 Access (s.11)
Provide, in clear and plain language:
- (a) a **summary of the personal data** being processed and of the **processing activities** (generated from the RoPA, G06, and the system extracts);
- (b) the **identities of all other Data Fiduciaries and Data Processors** with whom the data has been shared, with a **description of the personal data shared** (from the vendor register and the data-sharing log);
- (c) any other information prescribed.

Exclude sharing with authorities that are legally authorised to receive data for preventing, detecting or investigating offences or cyber incidents, or for prosecuting or punishing offences (s.11(2)).
Deliver through the secure portal or in an encrypted file. Use letter **L-03** (R04).

### 5.2 Correction, completion, updating (s.12(2))
1. Check that the evidence is authentic. Under s.15(e), the Data Principal must provide verifiably authentic information.
2. Correct inaccurate or misleading data, complete incomplete data, and update outdated data across all systems of record.
3. Tell Data Processors, and any other Data Fiduciary the data was disclosed to, about the change (s.8(3)).
4. If you decline, give the reason (for example, the data is a historical record that must stay as originally captured, such as a medical entry). Annotate the record with the Data Principal's statement where appropriate.
Letter **L-04**.

### 5.3 Erasure (s.12(3))
1. Erase the data unless keeping it is necessary for the specified purpose, or for compliance with a law in force (s.12(3)).
2. Check the retention schedule (G02) and any legal holds. Erase what can be erased, and restrict what must be kept to its legal purpose.
3. Instruct Data Processors to erase, and collect their confirmations (V01 cl.11).
4. Tell the Data Principal what was erased, what was kept and why, and the impact on service. If erasure means the account is closed, confirm that first.
5. The minimum 1-year log retention under Rule 8(3) continues for the logs.
Letter **L-05** (fulfilled) / **L-06** (partially declined).

### 5.4 Grievance
Follow R01. A rights request that is refused or delayed automatically becomes a grievance ticket.

### 5.5 Nomination (s.14, Rule 14(4))
1. The Data Principal nominates one or more individuals using Form D (R03), through the means set out in [Client-Name]'s terms of service.
2. Record: nominee name, relationship, contact, ID reference, scope (all rights / specific), effective date. Verify the Data Principal by OTP or e-sign.
3. **Nominee activation:** the nominee submits proof of the Data Principal's death or incapacity (a death certificate, or a medical certificate of unsoundness of mind or infirmity of body) plus their own ID. After verification, the nominee may exercise the Data Principal's rights.
4. The Data Principal can change or revoke the nomination at any time.
5. This privacy nomination is separate from financial, insurance or PF nominations. Do not merge the two records.
Letter **L-07**.

## 6. Grounds for refusal or limitation
- The identity cannot be verified after reasonable attempts.
- An exemption applies (s.17), e.g. an ongoing investigation, or enforcement of a legal claim.
- The data must be retained by law (erasure only).
- Providing the data would disclose another person's personal data (redact it instead).
- The request is manifestly repetitive within [Repeat-Request-Window]. Respond, but you may refer to the earlier response.
Every refusal is in writing, gives reasons, and includes the escalation path (R01) and the Board-complaint information.

## 7. Contact information in every response (Rule 9)
Every response must include the business contact information of the <!-- IF Is-SDF -->DPO<!-- END IF --><!-- IF NOT Is-SDF -->person designated to answer questions on processing<!-- END IF -->. The R04 templates include it by default.

## 8. Quality checks before sending
- [ ] Identity verified and recorded
- [ ] All systems searched (checklist: [Systems-Search-Checklist])
- [ ] Recipients list complete (access)
- [ ] Third-party data redacted
- [ ] Processors instructed and acknowledged (correction / erasure)
- [ ] Response in the requested language
- [ ] Contact block included
- [ ] SLA met; if not, the reason is logged

## 9. Records
Rights log entries and response copies are kept for [Rights-Record-Retention]. The monthly MIS feeds the R01 report.

## 10. Requests from authorities
Requests from the State or its instrumentalities, from courts, or from the Central Government under s.36 (Seventh Schedule) are **not** Data Principal requests. Route them to Legal under G01 §12.
