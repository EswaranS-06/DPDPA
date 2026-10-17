---
id: N02
title: Purpose-Specific Privacy Notice (by Data-Principal Category — Customer / Patient / Attendant / Visitor)
category: 1. Data-principal-facing notices
audience: One Data-Principal category per rendered notice
publish: public (point of collection — counter, form, app screen, kiosk, QR poster)
legal_basis: [DPDPA s.5(1), s.5(3), s.6(3), s.7(a),(f),(g); Rules r.3; Fourth Schedule (healthcare, for children)]
applies_when: more than one Data-Principal category, or Sector == Healthcare
flags: [DP-Category, Sector, Processes-Children-Data, Uses-CCTV, Uses-Biometrics, Cross-Border-Transfer]
version: 1.0
review_cycle: 12 months
---

> **Drafting note:** Render one notice for each Data-Principal category (`DP-Category`). Rule 3 requires the notice to be **standalone** and **itemised**, so each rendered notice must make sense on its own, without pointing back to N01 for essential content. Keep it short enough for a single A4 page or one app screen, with a link to N01 for the full detail. In healthcare, the patient notice is usually signed at registration, the attendant notice is printed on the attendant pass / consent form, and the visitor notice appears on a poster at entry (CCTV + visitor log).

<!-- INCLUDE public-header -->

# Privacy Notice for [DP-Category-Label]s

**[Client-Name]** ("we") is the Data Fiduciary for the personal data described below. This notice tells you, in plain language, what we collect from you as a **[DP-Category-Label]**, why we collect it, and how you can control it.

## 1. What personal data we collect

<!-- IF DP-Category == Customer -->
| Item | Required / Optional | Why |
|---|---|---|
| Full name | Required | To identify you and create your account |
| Mobile number | Required | OTP login, order and service updates |
| Email address | Optional | Invoices and service communication |
| Delivery / billing address | Required for orders | To deliver goods and issue invoices |
| Payment details | Required for paid services | Processed by our payment aggregator; we store only a token and the last 4 digits |
| GSTIN | Optional | To issue a GST invoice for a business purchase |
| Order and service history | Generated | To provide support, warranties and returns |
| Device and usage data | Generated | Security, fraud prevention and app performance |
| Marketing preferences | Optional | Only if you opt in |
<!-- END IF -->

<!-- IF DP-Category == Patient -->
| Item | Required / Optional | Why |
|---|---|---|
| Name, age / date of birth, gender, photograph | Required | Identification and patient-safety checks (correct-patient matching) |
| Contact number, address, email | Required | Appointments, reports, follow-up |
| Government ID / ABHA number | Required where law / scheme requires; ABHA optional | Medico-legal registration, insurance, Ayushman Bharat Digital Mission linkage |
| Emergency contact | Required for admission | To reach your family in an emergency |
| Medical history, symptoms, allergies, medications | Required for treatment | Diagnosis and treatment |
| Clinical records: prescriptions, lab and imaging reports, discharge summaries | Generated | Continuity of care and statutory medical records |
| Insurance / TPA / corporate-panel details | Required for cashless claims | Pre-authorisation and claim settlement |
| Payment and billing records | Required | Billing, refunds, statutory accounts |
| Feedback | Optional | Service improvement |
<!-- END IF -->

<!-- IF DP-Category == Attendant-Next-of-Kin -->
| Item | Required / Optional | Why |
|---|---|---|
| Name and relationship to patient | Required | To issue an attendant pass and to record who gave consent on the patient's behalf |
| Mobile number | Required | Clinical updates, billing and discharge communication |
| Government ID (type and last 4 digits) | Required where hospital security policy or law requires | Identity verification for the attendant pass |
| Photograph | Optional / as per security policy | Attendant pass |
| Signature on consent forms | Required where you consent on behalf of a patient | Proof of informed consent |
<!-- END IF -->

<!-- IF DP-Category == Visitor -->
| Item | Required / Optional | Why |
|---|---|---|
| Name, mobile number, person / department visited | Required | Visitor log and premises security |
| Government ID (type and last 4 digits) | As per security policy | Identity verification |
| Photograph | As per security policy | Visitor pass |
| Entry / exit time | Generated | Security and safety |
<!-- IF Uses-CCTV -->
| CCTV footage | Captured automatically in common areas | Safety and security of people and property; investigating incidents |
<!-- END IF -->
<!-- END IF -->

<!-- IF DP-Category == Vendor-Representative -->
| Item | Required / Optional | Why |
|---|---|---|
| Name, designation, business email, phone | Required | Vendor onboarding and communication |
| ID and address proof of authorised signatory | Required for KYC | Contract execution and statutory checks |
| Bank account details (for proprietorships) | Required for payment | Making payments |
| PAN / GSTIN | Required | Tax compliance |
<!-- END IF -->

<!-- IF DP-Category == Custom -->
| Item | Required / Optional | Why |
|---|---|---|
<!-- REPEAT Category-Data-Items -->
| [Data-Item] | [Data-Item-Requirement] | [Data-Item-Purpose] |
<!-- END REPEAT -->
<!-- END IF -->

We do **not** collect anything that is not listed above.

## 2. Why we use it, and on what basis

| # | Purpose | What it enables for you | Legal basis | How long we keep it |
|---|---|---|---|---|
<!-- REPEAT Category-Purposes -->
| [Purpose-ID] | [Purpose-Name] | [Purpose-Service-Description] | [Legal-Basis] | [Purpose-Retention] |
<!-- END REPEAT -->

> **Drafting note (healthcare defaults):**
> P1 Registration & identification: Consent / s.7(a). Keep for the period of the medical record.
> P2 Diagnosis & treatment: Consent. In an emergency, s.7(f) (medical treatment or health services during a threat to life or immediate threat to health).
> P3 Statutory medical records & reporting of notifiable diseases: s.7(d)/(g) and the applicable Clinical Establishments rules. Retain per state law or NMC norms (often 3 years OPD / longer for IPD and medico-legal cases; confirm per state).
> P4 Insurance / TPA claims: Consent.
> P5 Billing & accounts: s.7(a) + statutory books (8 years).
> P6 Teleconsultation reminders / health camps / newsletters: separate optional consent.
> P7 Research or case studies: separate **opt-in** consent, de-identified wherever possible (Rule 16 / Second Schedule standards for research).
> P8 CCTV: s.7(a) or consent; retention typically 30–90 days.
> Never bundle P6 or P7 with treatment consent.

## 3. Your choices

<!-- REPEAT Category-Optional-Consents -->
- [ ] **[Purpose-Name]**: [Purpose-Service-Description]. *(Optional. Saying no does not affect [Core-Service-Name].)*
<!-- END REPEAT -->

These boxes are **unticked by default**. You can change your choices at any time (see Section 6).

## 4. Who we share it with

[Category-Recipients]

> **Drafting note:** Examples for patients: treating doctors and consultants (internal); diagnostic partner labs (Data Processor or independent DF); insurers / TPAs (independent DF); government health authorities for notifiable diseases (s.7(d)/(g)); ABDM Health Information Exchange, with your consent through the ABHA app / Health Information Exchange & Consent Manager; pharmacy (internal). For visitors: security agency (Data Processor).

<!-- IF Cross-Border-Transfer -->
Some data may be processed outside India, in [Cross-Border-Countries], for [Cross-Border-Purposes], in compliance with section 16 of the Act and Rule 15.
<!-- END IF -->

<!-- IF DP-Category == Patient -->
## 5. Special notes for patients
- **Consent on your behalf.** If you cannot give consent yourself (for example if you are unconscious), treatment may proceed under the medical-emergency legitimate use (section 7(f) of the Act). Your next of kin may give or withdraw consent for other purposes on your behalf.
- **Minor patients.** For patients under 18, a parent or lawful guardian gives consent. The Rules exempt clinical establishments and healthcare professionals from the verifiable-parental-consent requirement **only to the extent necessary** to provide health services to the child and protect the child's health (Fourth Schedule).
- **Medical records.** You may ask for copies of your medical records, as clinical-establishment law provides, in addition to your rights under the Act. We cannot erase medical records that the law requires us to keep for a minimum period.
<!-- END IF -->

## 6. Your rights and how to use them

- **Withdraw consent** at any time, as easily as you gave it: [Category-Withdrawal-Method] or [Consent-Preferences-URL]. Processing before withdrawal remains lawful. If you withdraw consent that a service depends on, that service may stop.
- **Access** a summary of your data and who we have shared it with; **correct, complete, update** or **erase** your data; **nominate** someone to act for you: [Rights-Portal-URL] or [Grievance-Officer-Email].
- **Grievances:** contact our Grievance Officer, [Grievance-Officer-Name], at [Grievance-Officer-Email] / [Grievance-Officer-Phone]. We respond within [Grievance-Resolution-Period].
- **Complain to the Data Protection Board of India** at [DPB-Complaint-URL] after using our grievance process.

Contact for questions about your data: [Privacy-Contact-Email]

Full Privacy Notice: [Privacy-Notice-URL] · This notice is available in: [Notice-Languages].

<!-- IF Requires-Acknowledgement -->
---
**Acknowledgement**

I have read and understood this notice<!-- IF DP-Category == Attendant-Next-of-Kin --> and I am giving the consents above for myself and, where indicated, on behalf of the patient [Patient-Name] in my capacity as [Relationship-To-Patient]<!-- END IF -->.

Name: ____________________  Signature / OTP confirmation: ____________________  Date & time: ____________
Notice version: [Document-Version] · Language shown: ________
<!-- END IF -->
