---
id: X02
title: Conditional Flags & Template Applicability
publish: internal
version: 1.0
---

# Conditional Flags

The UI asks these questions before it collects any data. Each answer switches templates on or off and opens or closes the `<!-- IF ... -->` blocks inside them.

## 1. Flag definitions

| Flag | Type | Question to ask | Default |
|---|---|---|---|
| `Is-SDF` | bool | Has the client been notified, or does it belong to a notified class, as a Significant Data Fiduciary (s.10)? | false |
| `SDF-Anticipated` | bool | Does the client expect SDF notification (high volume / sensitive data / risk to sovereignty / electoral democracy)? It turns on "readiness" language. | false |
| `Processes-Children-Data` | bool | Does the client knowingly process personal data of anyone under 18? | false |
| `Children-Exemption-Class` | enum: `None`, `Healthcare`, `Allied-Health`, `Educational-Institution`, `Creche-Daycare`, `Child-Transport`, `Other` | Does the client fall in a Fourth Schedule Part A class? | None |
| `Processes-Disability-Guardian-Data` | bool | Does the client accept consent from lawful guardians of persons with disability? | false |
| `Uses-Consent-Manager` | bool | Is consent collected or managed through a Board-registered Consent Manager? | false |
| `Cross-Border-Transfer` | bool | Is personal data stored, accessed or processed outside India (incl. cloud regions, group entities, support teams)? | false |
| `Foreign-Contract-Processing` | bool | Does the client process data of non-Indian residents under a contract with a foreign person (s.17(1)(d), e.g. BPO/IT services)? | false |
| `Third-Schedule-Entity` | enum: `None`, `E-Commerce`, `Online-Gaming`, `Social-Media` | Does it meet a Third Schedule threshold (≥2 crore registered users for e-commerce/social media; ≥50 lakh for online gaming)? | None |
| `Uses-Cookies` | bool | Does the website or app use cookies, SDKs, pixels or similar trackers? | true |
| `Has-Mobile-App` | bool | Does the client have a mobile app? | false |
| `Has-Employees` | bool | Do employee/candidate templates apply? | true |
| `Sector` | enum: `General`, `Healthcare`, `BFSI-RBI`, `Securities-SEBI`, `Insurance-IRDAI`, `Education`, `E-Commerce`, `Telecom`, `IT-ITeS`, `Manufacturing`, `Hospitality`, `Other` | Primary sector of the client | General |
| `Uses-Automated-Decisions` | bool | Does the client use algorithmic / AI / automated scoring that affects individuals? | false |
| `Uses-CCTV` | bool | Are premises under CCTV surveillance? | false |
| `Uses-Biometrics` | bool | Does the client use biometric attendance or authentication? | false |
| `Marketing-Communications` | bool | Does the client send promotional communications? | true |
| `Is-Group-Company` | bool | Is the client part of a group that shares data intra-group? | false |
| `Legacy-Data-Exists` | bool | Does the client hold personal data collected with consent before 13 May 2027? | true |
| `Publishes-Regional-Languages` | bool | Will notices be published in Eighth Schedule languages besides English? | true |

### 1.1 Document-level flags (asked only when that template is generated)
| Flag | Type | Used in | Question |
|---|---|---|---|
| `DP-Category` | enum (see §3) + `Custom` | N02 | Which Data-Principal category is this notice for? (render once per category) |
| `Requires-Acknowledgement` | bool | N02 | Add a signature / OTP acknowledgement block? |
| `Rights-Fee-Applies` | bool | N01 | Is any fee charged for rights requests? (default false) |
| `Security-Certifications` | bool | N01 | Mention certifications (ISO 27001 etc.) in the notice? |
| `Pre-May-2027` | bool (auto: render date < 13 May 2027) | N01 | Include the SPDI-Rules transitional note? |
| `DPA-Uncapped-Liability` | bool | V01, V04 | Is processor data-protection liability uncapped? |
| `Arbitration` | bool | V01 | Use arbitration for disputes? |
| `DSA-Joint-Fiduciary` | bool | V02 | Do the parties jointly decide purpose and means? |
| `Keys-Held-In-India` | bool | V05 | Must encryption keys stay with the exporter in India? |
| `Board-Extension-Granted` | bool | B02 | Was a Rule 7(2)(b) extension granted by the Board? |
| `Breach-Not-Involved-Statement` | bool | B03 | State which data was **not** involved? |
| `Breach-Support-Offered` | bool | B03 | Is support (e.g. credit monitoring) offered to affected people? |
| `Partial-Retention` | bool | R04 L-05 | Was some data retained under law after an erasure request? |

## 2. Template applicability matrix

| Template | Always | Activated by |
|---|:-:|---|
| N01 Master Privacy Notice | ✔ | — |
| N02 Purpose-specific Notice | | Client has more than one Data-Principal category, or `Sector == Healthcare` |
| N03 Employee & Candidate Notice | | `Has-Employees` |
| N04 Cookie Notice + Banner | | `Uses-Cookies` |
| N05 Children's / Guardian Notice + VPC | | `Processes-Children-Data` or `Processes-Disability-Guardian-Data` |
| N06 Legacy-Data Notice | | `Legacy-Data-Exists` |
| C01–C02, C04 | ✔ | — |
| C03 Consent Manager Integration | | `Uses-Consent-Manager` |
| G01–G06 | ✔ | — |
| V01 DPA, V03 DDQ, V04 Rider | ✔ | — |
| V02 Data Sharing Agreement | | Sharing with another Data Fiduciary (incl. group entities, `Is-Group-Company`) |
| V05 Cross-Border Clauses | | `Cross-Border-Transfer` |
| R01–R04 | ✔ | — |
| B01–B04 | ✔ | — |
| S01–S03 | | `Is-SDF` (or `SDF-Anticipated` for a readiness version) |
| S04 Algorithmic Due Diligence | | `Is-SDF` or `Uses-Automated-Decisions` |

## 3. Data-Principal categories (multi-select, drives N02)
`Customer`, `Prospect`, `Website-Visitor`, `App-User`, `Patient`, `Attendant-Next-of-Kin`, `Visitor`, `Student`, `Parent-Guardian`, `Vendor-Representative`, `Business-Contact`, `Employee`, `Candidate`, `Contract-Worker`, `Alumni-Ex-Employee`, `Investor-Shareholder`.
