---
id: G01
title: Data Protection Policy (Internal, Board-approved)
category: 3. Internal governance policies
audience: All employees, directors, contractors and Data Processors of the client
publish: internal (Board approval required)
legal_basis: [DPDPA s.3–s.17, s.33, Schedule; Rules r.3–r.16, r.23]
applies_when: always
flags: [Is-SDF, Processes-Children-Data, Cross-Border-Transfer, Uses-Consent-Manager, Third-Schedule-Entity, Sector, Foreign-Contract-Processing]
version: 1.0
review_cycle: annually, and on any amendment to the Act / Rules / notifications
---

<!-- INCLUDE doc-control -->

# Data Protection Policy

## 1. Policy statement
[Client-Name] ("the Company") is committed to processing personal data lawfully, fairly and transparently, and to protecting the rights of every Data Principal whose personal data it handles. This Policy sets out how the Company complies with the Digital Personal Data Protection Act, 2023 ("Act"), the Digital Personal Data Protection Rules, 2025 ("Rules") and related sector requirements. It was approved by the [Approving-Authority] on [Approval-Date].

## 2. Scope
### 2.1 Applies to
- All digital personal data, and all non-digital personal data that is later digitised, processed by or for the Company, in India or outside India where the processing relates to offering goods or services to Data Principals in India.
- All business units, locations, subsidiaries adopting this Policy ([Adopting-Entities]), employees, directors, interns, contractors, and the Data Processors acting for the Company.
### 2.2 Does not apply to
Personal data processed by an individual for personal or domestic purposes; personal data that the Data Principal, or a person under a legal obligation, has made publicly available; and anonymised data that cannot identify an individual, subject to G03 controls against re-identification.

## 3. Definitions and exemptions
### 3.1 Definitions
<!-- INCLUDE definitions -->
### 3.2 Company's role
The Company acts as a **Data Fiduciary** for [Fiduciary-Activities]<!-- IF Foreign-Contract-Processing --> and as a **Data Processor** for client data processed under contracts with persons outside India ([Processor-Activities])<!-- END IF -->.
### 3.3 Exemptions (s.17)
The Company relies on statutory exemptions only after the DPO has assessed and recorded them in the RoPA (G06). Exemptions that may apply include:
- s.17(1)(a) enforcement of legal rights or claims;
- s.17(1)(c) prevention, detection, investigation or prosecution of offences;
- s.17(1)(f) ascertaining the financial information and assets of a loan defaulter;
<!-- IF Foreign-Contract-Processing -->
- s.17(1)(d) processing in India of personal data of Data Principals outside India under a contract with a person outside India. Under this exemption the Company must still meet s.8(1) (responsibility) and s.8(5) (security safeguards);
<!-- END IF -->
- s.17(1)(e) schemes of compromise, arrangement, merger or amalgamation approved by a competent authority;
- s.17(2)(b) research, archiving or statistical purposes, where the personal data is not used to take any decision specific to a Data Principal and the Second Schedule standards are followed (Rule 16).

## 4. Accountability
The Company is responsible for complying with the Act for all processing it undertakes, or that is undertaken on its behalf by a Data Processor, irrespective of any agreement to the contrary or any failure of a Data Principal to carry out her duties (s.8(1)).

## 5. Governance structure
| Body / role | Responsibilities |
|---|---|
| Board of Directors / [Approving-Authority] | Approves this Policy; receives the annual privacy report<!-- IF Is-SDF -->; the DPO is responsible to it (s.10(2)(a))<!-- END IF --> |
| Privacy Steering Committee ([Steering-Committee-Members]) | Oversees the privacy programme; approves high-risk DPIAs, retention exceptions and cross-border transfers; meets [Steering-Committee-Frequency] |
| <!-- IF Is-SDF -->Data Protection Officer (based in India)<!-- END IF --><!-- IF NOT Is-SDF -->Privacy Officer / designated contact (s.8(9))<!-- END IF --> | Runs the programme day to day: RoPA, DPIAs, rights requests, breach response, training, regulator interface |
| Grievance Officer | Receives and resolves grievances within published timelines (R01) |
| CISO / IT Security | Security safeguards (G04), monitoring, incident response (B01) |
| Business / Process Owners | Keep RoPA entries accurate; apply privacy by design; own retention for their processes |
| Privacy Champions | One per function; first point of contact and awareness |
| Procurement / Vendor Management | Processor due diligence (V03) and contracts (V01/V04) |
| Internal Audit | Independent assurance on this Policy at least annually |
| All personnel | Comply with this Policy; report incidents immediately |

## 6. Processing principles
### 6.1 Lawful grounds
Personal data is processed only for a lawful purpose, either (a) with the Data Principal's consent, or (b) for a legitimate use under s.7. The ground is recorded in the RoPA before processing begins.
### 6.2 Notice and consent
Every consent is preceded or accompanied by a notice that complies with s.5 and Rule 3 (N01–N06, C01). Consent is free, specific, informed, unconditional and unambiguous, given by a clear affirmative action, and limited to the data necessary. Evidence is kept in the consent artefact store (C04).
### 6.3 Purpose limitation and minimisation
Personal data is collected only for specified purposes and only to the extent necessary. Any new purpose needs a RoPA update, a fresh notice and, where consent is the basis, fresh consent.
### 6.4 Accuracy
Where personal data is likely to be used to make a decision that affects the Data Principal, or is disclosed to another Data Fiduciary, the Company makes reasonable efforts to ensure that it is complete, accurate and consistent (s.8(3)).
### 6.5 Storage limitation
Personal data is erased when consent is withdrawn or the specified purpose is no longer served, whichever is earlier, unless the law requires it to be kept. Processors are made to erase it too (s.8(7); G02).
### 6.6 Security
Reasonable security safeguards, including the minimum controls in Rule 6, are implemented (G03, G04).
### 6.7 Transparency and accountability
Notices are published, records are maintained, and compliance can be demonstrated.

## 7. Data Principal rights
The Company enables the rights of access (s.11), correction, completion, updating and erasure (s.12), grievance redressal (s.13), nomination (s.14) and withdrawal of consent (s.6(4)). It publishes the means and identifiers required to use them (Rule 14) and the grievance response period of [Grievance-Resolution-Period], which does not exceed 90 days. Procedures: R01–R04, C02.

## 8. Technical and organisational measures
Privacy by design and by default for all new systems, products and vendors. Data classification (G03), access control (G04), encryption, masking and tokenisation, logging and monitoring with at least 1 year of retention, backups, secure SDLC, and vendor security clauses (Rule 6(1)(a)–(g)).

## 9. Children and persons with disability
<!-- IF Processes-Children-Data -->
The Company obtains verifiable consent of the parent or lawful guardian before processing a child's personal data (s.9(1), Rules 10–11). It does not undertake processing likely to have a detrimental effect on a child's well-being, or tracking, behavioural monitoring or targeted advertising directed at children (s.9(2),(3)), except as permitted under the Fourth Schedule for [Children-Exemption-Class]. Procedure: N05.
<!-- END IF -->
<!-- IF NOT Processes-Children-Data -->
The Company does not knowingly process children's personal data. Age-assurance measures are applied in [Age-Assurance-Touchpoints]. Any child's data discovered is escalated to the DPO for erasure or for VPC to be obtained.
<!-- END IF -->

## 10. Data Processors and sharing
Processors are engaged only under a valid written contract (s.8(2); V01) after due diligence (V03). Sharing with another Data Fiduciary is done under a data-sharing agreement (V02). The vendor register is maintained (registers/vendor-register.csv).

## 11. Cross-border transfers
<!-- IF Cross-Border-Transfer -->
Transfers outside India are permitted only to countries that the Central Government has not restricted under s.16(1), in compliance with Rule 15 orders and stricter sectoral laws (s.16(2))<!-- IF Is-SDF -->, and subject to localisation of the data categories specified under Rule 13(4)<!-- END IF -->. Each transfer is approved by the Steering Committee and documented in V05.
<!-- END IF -->
<!-- IF NOT Cross-Border-Transfer -->
Personal data is stored and processed in India. Any proposed transfer outside India needs prior DPO and Steering Committee approval under V05.
<!-- END IF -->

## 12. Requests from government and authorities
Requests for personal data from law-enforcement agencies, regulators, or the Central Government under s.36 (Rule 23 / Seventh Schedule) are routed to [Legal-Head-Role] and the DPO. They are checked for legal authority, and the response is limited to what is lawfully required. Each one is recorded in the authority-request log. Where a request says the Data Principal must not be informed, that instruction is followed.

## 13. Personal data breaches
Every personal data breach, whatever its size, must be reported internally at once to [Incident-Reporting-Channel]. It is intimated to each affected Data Principal and to the Board as required by Rule 7: an initial intimation without delay, and a detailed report within 72 hours. Procedure: B01–B04.

## 14. DPIA and privacy by design
A DPIA (G05) is mandatory before high-risk processing begins. Examples: large-scale processing, children's data, health or financial data, biometrics, profiling or automated decisions, new technologies, systematic monitoring, cross-border transfers, and data matching across sources.<!-- IF Is-SDF --> As a Significant Data Fiduciary, the Company also carries out a periodic DPIA and an independent data audit every 12 months and submits the significant observations to the Board (Rule 13; S01–S03).<!-- END IF -->

<!-- IF Third-Schedule-Entity != None -->
## 15. Purpose deemed no longer served (Rule 8)
As a Third Schedule entity ([Third-Schedule-Entity]), the Company erases the personal data of Data Principals who have not approached it or exercised their rights for three years. They are notified at least 48 hours before erasure (G02 §5.3).
<!-- END IF -->

## 16. Training and awareness
Induction training for all staff within [Training-Induction-Days] days of joining; annual refresher training; role-based training for customer-facing staff, IT, HR, marketing and vendors. Completion is tracked and reported to the Steering Committee.

## 17. Monitoring, audit and reporting
- Quarterly compliance metrics to the Steering Committee: rights-request SLAs, grievance closures, incidents, DPIAs, vendor assessments and training.
- An annual internal audit of compliance with this Policy.
- An annual privacy report to the Board.

## 18. Non-compliance
A breach of this Policy may lead to disciplinary action, up to and including termination, and for contractors to termination of the contract. Under the Schedule to the Act, penalties on the Company can reach ₹250 crore per instance. Personnel who report concerns in good faith are protected under the [Whistleblower-Policy-Name].

## 19. Related documents
N01–N06 Notices · C01–C04 Consent · G02 Retention & Erasure · G03 Data Classification · G04 Access Control · G05 DPIA · G06 RoPA · V01–V05 Vendor documents · R01–R04 Rights · B01–B04 Breach<!-- IF Is-SDF --> · S01–S04 SDF<!-- END IF --> · Information Security Policy · Acceptable Use Policy · Whistleblower Policy.

## 20. Approval
Approved by resolution of the [Approving-Authority] dated [Approval-Date].

____________________
[Approver-Name], [Approver-Designation]
