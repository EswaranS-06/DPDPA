---
id: B01
title: Personal Data Breach Response Plan / Incident Response Policy
category: 6. Breach management
audience: Incident Response Team, CISO, DPO, Legal, Communications, all staff (Section 4)
publish: internal
legal_basis: [DPDPA s.2(u), s.8(5),(6), s.32, s.33 & Schedule; Rules r.6, r.7; CERT-In Directions 28 Apr 2022 (IT Act s.70B); sectoral reporting]
applies_when: always
flags: [Sector, Is-SDF, Cross-Border-Transfer]
version: 1.0
review_cycle: annually + after every major incident; tabletop exercise every [Tabletop-Frequency]
---

<!-- INCLUDE doc-control -->

# Personal Data Breach Response Plan

## 1. Purpose
To detect, contain, assess and remediate personal data breaches, and to make the intimations the law requires to affected Data Principals, the Data Protection Board of India and other authorities, **without delay** and within the prescribed timelines.

> **Key point:** The DPDP regime has **no materiality threshold**. **Every** personal data breach must be intimated to the Board and to each affected Data Principal (s.8(6), Rule 7), whatever its size and whether or not harm is likely. A failure to intimate carries a penalty of up to **₹200 crore**. A failure of security safeguards carries up to **₹250 crore**.

## 2. Definitions
- **Personal data breach:** any unauthorised processing of personal data, or accidental disclosure, acquisition, sharing, use, alteration, destruction or loss of access to personal data, that compromises its confidentiality, integrity or availability (s.2(u)).
- **Security incident:** any event that may compromise information systems. Not every incident is a personal data breach, but every incident must be assessed for whether it is one.
- **Awareness:** the point at which [Client-Name] has a reasonable degree of certainty that a personal data breach has occurred. The 72-hour clock under Rule 7(2)(b) starts here. In practice, **the clock starts when any employee or processor reports an indication**: do not wait for confirmation before starting the timer.

## 3. Incident Response Team (IRT)
| Role | Name / designation | Backup | 24×7 contact |
|---|---|---|---|
| Incident Commander (CISO) | [IRT-Commander] | [IRT-Commander-Backup] | [IRT-Commander-Phone] |
| DPO / Privacy Lead | [DPO-Name] | [DPO-Backup] | [DPO-Phone] |
| Legal Counsel | [IRT-Legal] | | |
| IT / SOC Lead | [IRT-SOC-Lead] | | |
| Communications / PR | [IRT-Comms] | | |
| Business owner (of affected process) | As applicable | | |
| Customer Service Lead | [IRT-CS-Lead] | | |
| External: forensics firm | [Forensics-Vendor] | | |
| External: breach counsel / insurer | [Breach-Counsel] / [Cyber-Insurer] (policy [Cyber-Policy-No]) | | |

Authority to file the Board intimation: [Board-Filing-Authority].

## 4. Reporting by staff and processors
Anyone who suspects a breach (a lost laptop, a mis-sent email, a ransomware pop-up, an unusual data export, a vendor alert) must report it **immediately** to **[Incident-Reporting-Channel]** / [Client-Breach-Hotline]. Do not investigate on your own, delete evidence, or contact affected people or the media. Processors report under V01 cl.8 within [Processor-Breach-Notice-Hours] hours.

## 5. Response phases and timeline

| Phase | Key actions | Owner | Target time (from awareness, T0) |
|---|---|---|---|
| **1. Detect & report** | Log in the breach register (B04); assign an ID; start the timer | SOC / DPO | T0 |
| **2. Triage** | Confirm whether personal data is involved; classify severity (§6); convene the IRT | Commander + DPO | ≤ T0 + [Triage-Hours] h |
| **3. Contain** | Isolate systems, revoke credentials, recall mis-sent data, block exfiltration, preserve evidence (forensic images, logs) | SOC / IT | Immediately and ongoing |
| **4. CERT-In report** (if a reportable cyber incident) | Report to CERT-In ([CERTIN-Reporting-Email]) in the prescribed format | CISO | **≤ T0 + 6 h** of noticing |
| **5. Sector regulator** (if applicable) | Report as required (see §7) | Compliance | Per regulator |
| **6. Initial Board intimation** (Rule 7(2)(a)) | Nature, extent, timing, location, likely impact (B02 Part A) | DPO | **Without delay**. Target ≤ T0 + [Board-Initial-Target-Hours] h |
| **7. Data Principal intimation** (Rule 7(1)) | Concise, clear, plain notice to **each** affected Data Principal through the user account or the registered communication mode (B03) | DPO + Comms + CS | **Without delay**. Target ≤ T0 + [DP-Notice-Target-Hours] h |
| **8. Investigate & assess** | Root cause; data categories; number of Data Principals; consequences; person responsible | Forensics / SOC | Ongoing |
| **9. Detailed Board report** (Rule 7(2)(b)) | Updated details; facts, circumstances and reasons; mitigation; findings on the person who caused it; remedial measures; report on DP intimations (B02 Part B) | DPO + Legal | **≤ T0 + 72 h** (or a longer period the Board allows on written request) |
| **10. Recover** | Restore from clean backups; validate integrity; monitor for recurrence | IT | As per BCP |
| **11. Post-incident review** | Lessons learned; control improvements; DPIA/RoPA updates; training | Commander + DPO | ≤ [PIR-Days] days after closure |

> **Drafting note:** If the facts are not clear within 72 hours, file the detailed report with the information available and state what is still under investigation. **Before** the deadline, write to the Board requesting an extension under Rule 7(2)(b), giving reasons. Keep proof of the time of submission.

## 6. Severity classification (drives internal escalation; does not decide whether to notify)
| Severity | Indicators | Escalation |
|---|---|---|
| **S1 Critical** | L4 data (health / financial / ID / children); > [S1-Threshold] Data Principals; ransomware; ongoing exfiltration; media exposure | CEO + Board of Directors informed within [S1-Exec-Hours] h; external forensics engaged |
| **S2 High** | L3 data at scale; credential compromise; vendor breach affecting Company data | CXO informed within [S2-Exec-Hours] h |
| **S3 Medium** | Limited records; contained quickly (e.g. an email to the wrong recipient that was recalled) | DPO + Commander |
| **S4 Low** | Single record; minimal exposure | DPO |
**All severities S1–S4 are intimated to the Board and to affected Data Principals.**

## 7. Parallel reporting obligations (configure per client)
| Authority | Trigger | Timeline | Format / channel |
|---|---|---|---|
| Data Protection Board of India | Any personal data breach | Without delay + detailed report ≤ 72 h | Board digital office: [DPB-Breach-Portal] |
| CERT-In | Cyber incidents listed in the 2022 Directions (e.g. data breach, data leak, unauthorised access, ransomware) | ≤ 6 h of noticing | [CERTIN-Reporting-Email] / portal |
<!-- IF Sector == BFSI-RBI -->
| Reserve Bank of India | Cyber-security incident as per the applicable Master Direction / circular | Per RBI timeline (**VERIFY** current direction) | RBI incident-reporting format |
<!-- END IF -->
<!-- IF Sector == Securities-SEBI -->
| SEBI | Cyber incident under CSCRF | Per CSCRF (**VERIFY**) | SEBI portal |
<!-- END IF -->
<!-- IF Sector == Insurance-IRDAI -->
| IRDAI | Cyber incident under the IRDAI Information & Cyber Security Guidelines | Per guidelines (**VERIFY**) | IRDAI format |
<!-- END IF -->
<!-- IF Sector == Telecom -->
| DoT | As per licence conditions / Telecommunications Act, 2023 rules | **VERIFY** | |
<!-- END IF -->
| Police / cyber-crime cell | Criminal activity (theft, extortion) | As advised by Legal | cybercrime.gov.in / local police |
| Insurer | Policy notification clause | Per policy ([Insurer-Notice-Hours] h) | |
| Contractual counterparties | Where the Company is a processor for others | Per contract | |
<!-- IF Cross-Border-Transfer -->
| Foreign regulators | If data of foreign residents is affected (e.g. under GDPR, 72 h) | Per foreign law | |
<!-- END IF -->

## 8. Communication principles
- One source of truth: the Incident Commander approves all facts. Legal reviews every external statement.
- Data Principal notices are in plain language and in the language of the Data Principal's relationship, and give practical safety steps.
- Don't speculate, don't minimise, and don't blame the Data Principal.
- Set up a dedicated helpline / FAQ for S1/S2 incidents: [Breach-Helpline].

## 9. Evidence and records
Preserve forensic images, logs (which must be kept ≥ 1 year under Rule 6(1)(e)), timelines, decisions with reasons, copies of all intimations and their delivery proof, and Board correspondence. The breach register (B04) is the master record.

## 10. Processor and third-party breaches
A breach at a Data Processor is the Company's breach for the purposes of the Act (s.8(1), s.8(6)). The Company makes the intimations. The processor cooperates under V01 cl.8 and does not notify independently, except where the law requires it.

## 11. After notification: Board proceedings
- Respond to Board inquiries within the time specified, through the Board's digital office.
- Consider offering a **voluntary undertaking** under s.32 (e.g. specific remediation within a timeline). Its acceptance by the Board bars proceedings on the matter, but a breach of the undertaking is itself penalised.
- Mitigating factors the Board considers under s.33(2) include: the nature, gravity and duration of the breach; the type and nature of the personal data; whether it was repetitive; any gain made or loss avoided; the mitigation actions taken and how timely and effective they were; and whether the penalty is proportionate. Document each of these factors during the response.

## 12. Testing and training
A tabletop exercise every [Tabletop-Frequency], covering scenarios such as ransomware, a vendor leak, a mis-sent bulk email, an insider download, and children's data exposure. Annual training for the IRT, and an awareness module for all staff.

## Annexure: Quick-reference checklist (first 72 hours)
- [ ] T0 logged in B04; timer started
- [ ] IRT convened; evidence preserved
- [ ] Contained
- [ ] CERT-In report filed (≤ 6 h), if applicable
- [ ] Initial Board intimation sent (without delay)
- [ ] Affected Data Principals identified; B03 notices sent through the account / registered channel
- [ ] Sector regulator / insurer notified
- [ ] Detailed Board report filed (≤ 72 h), or extension requested in writing before the deadline
- [ ] Helpline / FAQ live (S1/S2)
- [ ] Post-incident review scheduled
