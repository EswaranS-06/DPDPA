---
id: G02
title: Data Retention & Erasure Policy with Purpose-mapped Retention Schedule
category: 3. Internal governance policies
audience: All process / system owners, IT, Records Management, Data Processors
publish: internal
legal_basis: [DPDPA s.6(6), s.8(7), s.8(8), s.12(3); Rules r.6(1)(e), r.8(1)–(3), Third Schedule, Seventh Schedule; CERT-In Directions 2022; sectoral retention laws]
applies_when: always
flags: [Third-Schedule-Entity, Sector, Is-SDF, Uses-CCTV]
version: 1.0
review_cycle: annually; schedule reviewed on every new RoPA entry
---

<!-- INCLUDE doc-control -->

# Data Retention & Erasure Policy

## 1. Purpose
To keep personal data no longer than its specified purpose needs, or than a law requires, and then to erase it securely and verifiably, both at [Client-Name] and at its Data Processors.

## 2. Scope
All personal data in every format and location: production systems, data warehouses, backups, archives, end-user devices, email, paper records, and data held by Data Processors.

## 3. Principles
1. **Purpose-bound retention.** Every data set in the RoPA has a retention period tied to its purpose and legal basis.
2. **Erase at the earlier trigger.** Data is erased when consent is withdrawn or the purpose is no longer served, whichever is earlier, unless the law requires it to be kept (s.8(7)).
3. **Legal retention overrides.** Where a law requires data to be kept, it is restricted to that legal purpose (legal hold), and not used for anything else.
4. **Minimum security retention.** Personal data, associated traffic data and processing logs are kept for at least **one year from the date of processing**, for the Seventh Schedule purposes and for breach detection and investigation (Rules 6(1)(e), 8(3)). After that they are erased unless another law requires longer.
5. **Processors erase too.** Every Data Processor must erase on instruction and at the end of the contract (V01 cl.11).
6. **Erasure means irreversible.** Deletion, cryptographic erasure or irreversible anonymisation. "Soft-delete" flags do not count as erasure.

## 4. Roles
| Role | Responsibility |
|---|---|
| DPO | Approves the schedule, exceptions and legal holds |
| Process / System Owner | Applies the schedule; certifies erasure each quarter |
| IT / DBA | Implements automated purge jobs and backup expiry |
| Legal | Issues and lifts legal holds; maps statutory periods |
| Vendor Manager | Collects processor erasure certificates |

## 5. Retention triggers
### 5.1 Consent withdrawn
Stop processing within [Withdrawal-Effect-Period] (C02). Erase the purpose-specific data within [Post-Withdrawal-Erasure-Period], unless it is needed for another valid purpose or legal basis.
### 5.2 Purpose fulfilled
The account is closed, the contract has ended, the service is complete, the candidate was not selected, or the employee has exited. Each of these starts the retention period in the schedule (§7).
<!-- IF Third-Schedule-Entity != None -->
### 5.3 Purpose deemed no longer served — Third Schedule (Rule 8(1),(2))
The Company is a **[Third-Schedule-Entity]** entity that meets the Third Schedule threshold (e-commerce / social media ≥ 2 crore registered users in India; online gaming ≥ 50 lakh).
- **Rule.** If a Data Principal has not approached the Company for the specified purpose, or exercised her rights, for **3 years**, her personal data must be erased. The 3 years run from the latest of: the last approach, the last exercise of rights, or the commencement of the Rules.
- **Carve-outs.** Data needed to let the Data Principal access her user account, or to access any virtual token issued by or for the Company that is stored on the platform and can be used to get money, goods or services (for example a wallet balance, gift card or loyalty points).
- **48-hour intimation.** At least **48 hours before** the period ends, notify the Data Principal (R04 letter L-08) that her data will be erased unless she logs in, contacts the Company, or exercises her rights.
- **Implementation.** A dormancy job computes `last_activity = max(last_login, last_order, last_rights_request, rules_commencement)`. It sends the intimation at T-[Erasure-Pre-Notice-Days] days (and in any case ≥ 48 h), and erases at T unless activity resets the clock.
- **Legal-retention override.** Data that a law requires to be kept (e.g. invoices) is moved to a restricted archive.
<!-- END IF -->
### 5.4 Data Principal erasure request
Handled under R02 §5.3.
### 5.5 Legal hold
Litigation, investigation, regulatory inquiry or a Board proceeding suspends erasure for the data concerned until Legal lifts the hold.

## 6. Mandatory minimum retention (security & legal-assistance logs)
| Record | Minimum | Source |
|---|---|---|
| Personal data + associated traffic data + processing logs (all processing, incl. by Processors) | 1 year from the date of processing | Rule 8(3), Seventh Schedule |
| Security logs: access, monitoring, review | 1 year | Rule 6(1)(e) |
| ICT system logs (CERT-In) | 180 days rolling, kept in India | CERT-In Directions 28 Apr 2022 |
| Consent artefacts | [Consent-Record-Retention] | s.6(10) evidence |
| Breach register and Board / DP intimations | [Breach-Record-Retention] | Defensibility |
| Rights requests and grievances | [Rights-Record-Retention] | Defensibility |

## 7. Retention schedule (purpose-mapped)
The CSV layout is in `registers/retention-schedule.csv`.

| Ref | Data set / record | Purpose (RoPA ID) | Legal basis | Retention period | Trigger | Legal reference | Disposal method | Owner |
|---|---|---|---|---|---|---|---|---|
<!-- REPEAT Retention-Schedule -->
| [Retention-Ref] | [Retention-Data-Set] | [Retention-Purpose-ID] | [Retention-Legal-Basis] | [Retention-Period] | [Retention-Trigger] | [Retention-Legal-Reference] | [Retention-Disposal-Method] | [Retention-Owner] |
<!-- END REPEAT -->

> **Drafting note: starter rows to adapt.** Confirm statutory periods with the client's legal team before use.
> - Books of account and vouchers: 8 years from end of FY (Companies Act s.128(5)).
> - GST records: 72 months from the due date of the annual return (CGST Act s.36).
> - Income-tax records: per IT Act s.44AA / Rule 6F, and until assessment and reassessment windows close.
> - Payroll, PF and ESI registers: as the Labour Codes and EPF/ESI rules require, typically 5–8 years.
> - KYC records (BFSI): 5 years after the business relationship ends (PMLA Rules r.3 / RBI KYC MD).
> - Medical records: OPD ~3 years, IPD ~5 years; medico-legal records until the case is disposed of. Confirm against state Clinical Establishments rules, MCI/NMC regulations and ABDM norms.
> - CCTV: 30–90 days, unless an incident is flagged.
> - Unsuccessful candidates: 6–12 months (with consent).
> - Marketing leads: until consent is withdrawn or [Lead-Inactivity-Period] of inactivity.
> - Website analytics: 14–26 months.
> - Call recordings: 90 days to 1 year, unless a sector rule requires longer.
> - Visitor logs: 90 days to 1 year.
> - Grievance and complaint records: 3 years after closure.

## 8. Erasure methods
| Medium | Approved method |
|---|---|
| Databases / applications | Hard delete + purge from replicas; or irreversible anonymisation (documented technique; re-identification test) |
| Data warehouse / lakes | Partition drop / row delete + vacuum; propagate to derived tables |
| Backups | Retained to backup expiry ([Backup-Retention-Period]), then overwritten; restored data must be re-purged before use |
| Encrypted stores | Crypto-shredding (destroy keys) |
| End-user devices / media | NIST SP 800-88 clear / purge / destroy; certificate of destruction |
| Paper | Cross-cut shredding / pulping by an approved vendor; certificate |
| Processor-held data | Deletion or return per V01 cl.11, with a written certificate within [Processor-Erasure-Certificate-Days] days |

## 9. Verification and records
- Each quarter, system owners certify erasure runs (job logs and record counts).
- The erasure log keeps: data set, criteria, number of records, date, method and approver. It holds **no** personal data of the erased records beyond an identifier hash where needed to prove the erasure.
- Internal Audit samples the logs every year.

## 10. Exceptions
Any deviation from the schedule needs written DPO approval with a reason, a duration and a review date, and is recorded in the exceptions register.
