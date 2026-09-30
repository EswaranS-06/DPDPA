---
type: sector_overlay
sector_code: HLT
title: Healthcare
covers: Hospitals, clinics, diagnostics labs, telemedicine, health-tech apps, pharmacies
regulators:
- MoHFW
- NMC
- State health departments / Clinical Establishments authorities
- NHA (ABDM)
- CERT-In
key_principals:
- Patient
- Attendant/relative
- Minor patient & parent
- Doctor/visiting consultant
- Donor
- Employee
process_templates:
- "[[HLT-01 Registration & appointments]]"
- "[[HLT-02 OPD-IPD consultation & EMR]]"
- "[[HLT-03 Emergency & trauma]]"
- "[[HLT-04 Laboratory & radiology]]"
- "[[HLT-05 Pharmacy dispensing & e-pharmacy]]"
- "[[HLT-06 Billing, insurance & TPA]]"
- "[[HLT-07 Telemedicine & health apps]]"
- "[[HLT-08 MRD, record requests & research]]"
tags:
- dpdp/sector
- sector/hlt
---

# SEC-HLT - Healthcare

**Covers:** Hospitals, clinics, diagnostics labs, telemedicine, health-tech apps, pharmacies

**Regulators:** MoHFW, NMC, State health departments / Clinical Establishments authorities, NHA (ABDM), CERT-In

## Sector laws that run alongside DPDP (s.38: DPDP is in addition; s.16(2): stricter transfer rules survive)
| Law / instrument | Why it matters for personal data |
|---|---|
| Clinical Establishments (Registration & Regulation) Act 2010 & State Acts | Registration, standard treatment, record maintenance |
| IMC (Professional Conduct, Etiquette & Ethics) Regulations 2002 | Maintain indoor patient records 3 years; confidentiality |
| Telemedicine Practice Guidelines 2020 | Consent, records, identity of patient/doctor |
| ABDM Health Data Management Policy | Consent artefacts via HIE-CM, ABHA, federated records |
| PCPNDT Act 1994 & Rules | Form F records for ultrasound; strict confidentiality (retain >= 2 years) |
| MTP Act 1971 & Regulations | Confidentiality of women undergoing termination |
| Mental Healthcare Act 2017 s.23 | Confidentiality of mental health information |
| HIV and AIDS (Prevention & Control) Act 2017 | Informed consent & confidentiality |
| Drugs & Cosmetics Rules 1945 (Schedule H1) | Pharmacy H1 register maintained 3 years |

## Localisation / cross-border
No general localisation; ABDM-integrated systems follow NHA norms; Government hospital data via MeitY-empanelled cloud.

## Retention anchors (use in Retention Rules; reconciles s.8(7) 'retention required by law')
| Record | Period | Source | Confidence |
|---|---|---|---|
| Indoor patient medical records | 3 years from commencement of treatment (min.) | IMC Regs 2002 reg 1.3.1 | high |
| Medico-legal case records | Until case disposal / as per court & State rules (often long) | State rules / court orders | verify |
| PCPNDT Form F & records | 2 years (longer if proceedings) | PCPNDT Rules r.9 | high |
| Schedule H1 drug register | 3 years | Drugs & Cosmetics Rules | high |
| NABH accreditation standards | Retention policy as defined by hospital (commonly 5-10 yrs IPD) | NABH | verify |

> Confidence `verify` means you must confirm the current text before citing it in a client deliverable.

## DPDP hotspots in this sector
- Health context everywhere; emergency (s.7(f)) vs consent
- Children (paediatrics) - Fourth Schedule Part A exemption only for health services
- Labs, radiology, insurers/TPAs, pharmacies, ABDM
- Doctors as consultants (visiting) - independent DFs?
- WhatsApp sharing of reports
- Paper case sheets & MRD

## Where assessments get stuck here
- Registration uses paper then HIS - map both
- Doctors share images on personal phones
- Legacy MRD archives with no index - erasure/access impossible
- Insurance TPA cashless flows - who notifies patient

See also [[Stuck-Point Playbook]].

## Typical data principals
Patient, Attendant/relative, Minor patient & parent, Doctor/visiting consultant, Donor, Employee

## Sector process templates
- [[HLT-01 Registration & appointments]] (Patient Services)
- [[HLT-02 OPD-IPD consultation & EMR]] (Clinical)
- [[HLT-03 Emergency & trauma]] (Clinical)
- [[HLT-04 Laboratory & radiology]] (Diagnostics)
- [[HLT-05 Pharmacy dispensing & e-pharmacy]] (Pharmacy)
- [[HLT-06 Billing, insurance & TPA]] (Finance)
- [[HLT-07 Telemedicine & health apps]] (Digital Health)
- [[HLT-08 MRD, record requests & research]] (Medical Records)

## Plus common functions
All [[Process Catalogue Index|common-function templates]] (HR, finance, marketing, IT, admin, legal) also apply.
