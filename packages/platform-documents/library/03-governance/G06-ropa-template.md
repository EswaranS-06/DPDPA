---
id: G06
title: Records of Processing Activities (RoPA) — Master Processing Register
category: 3. Internal governance policies
audience: DPO, process owners, auditors; source of truth for all other templates
publish: internal
legal_basis: [DPDPA s.4–s.8, s.11(1), s.16, s.17; Rules r.3, r.6, r.8, r.13; (RoPA is not named in the Act but is the evidential backbone for s.6(10), s.8(1), s.11 and Board inquiries)]
applies_when: always
flags: [all]
version: 1.0
review_cycle: continuous; formal attestation by owners every 6 months
---

<!-- INCLUDE doc-control -->

# Records of Processing Activities (RoPA)

> **Drafting note:** The RoPA is the **single data source** for the UI. The purposes, data categories, recipients, retention and cross-border fields here feed N01 §4–8, N02, C01 §4, C02 §6, G02 §7, V01 Annex 1, R02 (access summaries) and B01 (impact analysis). CSV layout: `registers/ropa.csv`. One row = one processing activity (purpose) within a business process.

## 1. Organisation details
| Field | Value |
|---|---|
| Data Fiduciary | [Client-Name], [Client-Registered-Address], CIN [Client-CIN] |
| SDF status | <!-- IF Is-SDF -->Significant Data Fiduciary, notified vide [SDF-Notification-Ref]<!-- END IF --><!-- IF NOT Is-SDF -->Not notified as an SDF<!-- END IF --> |
| DPO / privacy contact | [DPO-Name] / [Privacy-Contact-Name] |
| Grievance Officer | [Grievance-Officer-Name] |
| Register owner | [RoPA-Owner] |
| Last full review | [RoPA-Last-Review] |

## 2. Register columns
| # | Column | Guidance / allowed values |
|---|---|---|
| 1 | RoPA ID | e.g. HR-03, CUS-07 |
| 2 | Business function / process | HR, Sales, Customer Service, Marketing, Finance, IT, Clinical, Admissions… |
| 3 | Processing activity / purpose (specified purpose) | Plain-language purpose as shown in the notice |
| 4 | Goods / services / uses enabled | Rule 3(b)(ii) wording |
| 5 | Process owner | Name / role |
| 6 | Data Principal categories | Customer / patient / employee / candidate / child / visitor… |
| 7 | Personal data items (itemised) | Exact fields |
| 8 | Classification (G03) | L3 / L4 |
| 9 | Children's data? | Y/N; VPC method or Fourth Schedule exemption |
| 10 | Source of data | Directly from DP / third party (name) / generated |
| 11 | Legal basis | Consent / s.7(a)–(i) / s.17 exemption |
| 12 | Notice reference | N01 §x / N02 version / C01 purpose ID |
| 13 | Consent purpose ID | Links to C04 artefacts |
| 14 | Systems / applications | Where the data lives |
| 15 | Internal recipients | Teams with access |
| 16 | Data Processors | Vendor names + DPA ref. |
| 17 | Other Data Fiduciaries receiving data | Name + DSA ref. |
| 18 | Cross-border transfer | Country / vendor / mechanism (V05) |
| 19 | Retention period & trigger | From G02 schedule |
| 20 | Erasure method | G02 §8 |
| 21 | Security measures | Encryption, masking, access, logs (Rule 6) |
| 22 | Automated decision / profiling? | Y/N + description |
| 23 | DPIA required / reference | G05 ref. |
| 24 | Third Schedule applicability | Y/N (Rule 8 dormancy) |
| 25 | Volume (approx. Data Principals) | Number |
| 26 | Rights-handling notes | Any limitations (e.g. statutory records cannot be erased) |
| 27 | Last reviewed / attested by | Date / name |

## 3. Register

| ID | Function | Purpose | Service enabled | Owner | DP categories | Data items | Class | Child? | Source | Legal basis | Notice ref. | Systems | Processors | Other DFs | Cross-border | Retention | DPIA | Reviewed |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
<!-- REPEAT Processing-Activities -->
| [RoPA-ID] | [RoPA-Function] | [Purpose-Name] | [Purpose-Service-Description] | [RoPA-Process-Owner] | [RoPA-DP-Categories] | [Purpose-Data-Items] | [RoPA-Classification] | [RoPA-Child-Data] | [Data-Source] | [Legal-Basis] | [RoPA-Notice-Ref] | [RoPA-Systems] | [RoPA-Processors] | [RoPA-Other-DFs] | [RoPA-Cross-Border] | [Purpose-Retention] | [RoPA-DPIA-Ref] | [RoPA-Last-Review] |
<!-- END REPEAT -->

## 4. Illustrative rows
| ID | Function | Purpose | Legal basis | Data items | Processors | Retention |
|---|---|---|---|---|---|---|
| CUS-01 | Sales | Create and manage customer account | s.7(a) | Name, mobile, email, password hash | Cloud host | Account life + 1 yr logs |
| CUS-02 | Marketing | Promotional emails / SMS | Consent (P-MKT-01) | Name, mobile, email, preferences | Email-service provider, SMS gateway | Until withdrawal |
| CUS-03 | Finance | Invoicing and GST | s.7(a) + statutory | Name, address, GSTIN, order value | ERP vendor | 8 yrs |
| HR-01 | HR | Payroll and statutory contributions | s.7(i) + statutory | Name, PAN, UAN, bank, salary | Payroll processor | 8 yrs post-FY |
| HR-07 | HR | Background verification | Consent | Education, employment, address, court records | BGV vendor | Employment + [Employee-Retention-Post-Exit] |
| SEC-01 | Admin | CCTV at premises | s.7(i) / s.7(a) | Video images | Security agency | [CCTV-Retention] |
| CLN-02 | Clinical | Diagnosis and treatment | Consent; s.7(f) in emergency | Health records | HIS vendor, lab LIS | Per medical-records law |

## 5. Maintenance procedure
1. A new process, system or vendor cannot go live without a RoPA entry and the DPO's sign-off.
2. Owners attest their entries every 6 months.
3. The RoPA is reconciled with data-discovery scans (G03 §6), the vendor register, and the consent purpose catalogue.
4. A change in purpose, data items or recipients triggers a notice review (N01/N02) and a consent review (C01).
