---
id: V05
title: Cross-Border Transfer Clauses & Transfer Assessment
category: 4. Vendor / third-party documents
audience: Legal, DPO, vendors / group entities outside India
publish: contract (clauses) + internal (assessment)
legal_basis: [DPDPA s.16(1),(2), s.17(1)(d); Rules r.13(4), r.15; sectoral localisation (RBI 2018 payment data, SEBI, IRDAI, telecom licence)]
applies_when: Cross-Border-Transfer
flags: [Is-SDF, Sector, Foreign-Contract-Processing]
version: 1.0
review_cycle: on every new destination; whenever MeitY notifies a restriction
---

> **Drafting note:** India uses a **negative-list** model. Transfer is allowed to any country **except** those the Central Government restricts by notification (s.16(1)). As of this template's date, no restricted list has been notified (**VERIFY** before each delivery). Section 16(2) preserves stricter sectoral laws: e.g. the RBI directs that payment-system data be stored only in India; IRDAI and SEBI have their own localisation and records requirements; telecom licences restrict certain subscriber data. Rule 15 lets the Government impose requirements on making personal data available to a foreign State or its agencies. Rule 13(4) lets it mandate localisation of specified data, and of its traffic data, for SDFs.

## PART A: TRANSFER IMPACT ASSESSMENT (internal)
| # | Item | Response |
|---|---|---|
| 1 | Transfer reference | [Transfer-Ref] |
| 2 | Exporter (India entity) | [Client-Name] |
| 3 | Importer (name, country, role: processor / fiduciary / group entity) | [Importer-Name], [Importer-Country], [Importer-Role] |
| 4 | Purpose & RoPA IDs | [Cross-Border-Purposes] |
| 5 | Data categories (L3/L4) and volume | [Transfer-Data-Items] |
| 6 | Mode: storage / remote access / onward transfer | [Transfer-Mode] |
| 7 | Is the destination on a s.16 restricted list? | ☐ No ☐ Yes → **STOP** |
| 8 | Sectoral localisation applicable (RBI / SEBI / IRDAI / telecom / health)? | [Sector-Localisation-Check] |
| 9 | <!-- IF Is-SDF -->Is the data category specified for localisation under Rule 13(4)?<!-- END IF --><!-- IF NOT Is-SDF -->N.A. (not an SDF)<!-- END IF --> | |
| 10 | Any Rule 15 order affecting availability of the data to a foreign State? | [Rule15-Order-Check] |
| 11 | Foreign-government-access risk (importer subject to laws compelling disclosure) and mitigation | [Foreign-Access-Mitigation] |
| 12 | Disclosed in the notice to Data Principals (N01 §8)? | ☐ Yes |
| 13 | Safeguards: encryption with keys held in India? pseudonymisation? access from abroad only? | |
| 14 | Decision / approver / date | |

## PART B: CROSS-BORDER TRANSFER CLAUSES (insert into V01 / V02 / intra-group agreement)

**CB-1 Permitted transfers.** The Importer may receive, store or access Personal Data outside India only in the countries listed in Appendix CB, and only for the purposes stated there. Any new destination needs the Exporter's prior written approval.

**CB-2 Compliance with Indian law.** Every transfer must comply with section 16 of the Digital Personal Data Protection Act, 2023, any requirement the Central Government specifies under Rule 15 of the DPDP Rules, 2025, and any stricter sector-specific law that applies to the Exporter.

**CB-3 Restricted countries.** If the Central Government notifies a restriction on transfer to a country where the Importer processes Personal Data, or any law in India imposes localisation, the Importer shall, within the period the Exporter specifies (and in any event within any statutory deadline): (a) stop the transfer; (b) move the Personal Data to India or to a permitted country; and (c) certify that copies in the restricted country have been erased.

**CB-4 Equivalent protection.** The Importer shall protect the Personal Data to a standard no lower than that required by the Act, the Rules and this Agreement, including the security safeguards, breach notification, retention and erasure, and rights-assistance obligations.

**CB-5 Requests by foreign authorities.** If the Importer receives a request from a foreign government, court or agency for access to the Personal Data, it shall, unless legally prohibited: (a) promptly notify the Exporter; (b) challenge requests that are overbroad or unlawful; (c) disclose only the minimum legally required; and (d) keep a record of such requests. The Importer shall comply with any requirement under Rule 15 on making Personal Data available to a foreign State.

**CB-6 Onward transfers.** The Importer shall not transfer Personal Data to any third party, or to any other country, without the Exporter's prior written consent and equivalent written safeguards.

**CB-7 Encryption and key control.** The Importer shall encrypt Personal Data in transit and at rest.<!-- IF Keys-Held-In-India --> Encryption keys shall be held and managed in India by the Exporter.<!-- END IF -->

**CB-8 Audit and Board cooperation.** The Importer shall allow audits under the Agreement and shall cooperate with any inquiry by the Data Protection Board of India relating to the transferred Personal Data.

**CB-9 Governing law.** These clauses are governed by Indian law. The Importer submits to the jurisdiction of Indian courts for the enforcement of these clauses.

### Appendix CB: Transfer details
| Country | Importer / sub-processor | Purpose | Data categories | Safeguards |
|---|---|---|---|---|
<!-- REPEAT Cross-Border-Transfers -->
| [Transfer-Country] | [Transfer-Importer] | [Transfer-Purpose] | [Transfer-Data-Items] | [Transfer-Safeguards] |
<!-- END REPEAT -->

<!-- IF Foreign-Contract-Processing -->
## PART C: Inbound processing for foreign clients (s.17(1)(d))
Where [Client-Name] processes, in India, personal data of Data Principals **not within India** under a contract with a person outside India, Chapter II of the Act (except s.8(1) and s.8(5)), Chapter III and section 16 do not apply. **Section 8(1)** (responsibility) and **section 8(5)** (reasonable security safeguards) still apply. Client contracts should therefore keep Rule 6-level security clauses and breach cooperation clauses.
<!-- END IF -->
