---
id: N05
title: Children's Data Notice, Verifiable Parental Consent (VPC) Mechanism & Lawful-Guardian Consent
category: 1. Data-principal-facing notices
audience: Parents / lawful guardians of children (under 18); lawful guardians of persons with disability
publish: public (notice + consent form); Part C (mechanism specification) internal
legal_basis: [DPDPA s.2(f), s.2(j), s.9(1)–(5); Rules r.10, r.11, r.12, Fourth Schedule]
applies_when: Processes-Children-Data or Processes-Disability-Guardian-Data
flags: [Children-Exemption-Class, Sector, Processes-Disability-Guardian-Data, Uses-CCTV, Has-Mobile-App]
version: 1.0
review_cycle: 12 months; on any new ed-tech / app / vendor
---

> **Drafting note:**
> - **Child** means anyone under **18** (s.2(f)). Consent must come from the parent or lawful guardian, and the Data Fiduciary must observe due diligence to check that the person is an **identifiable adult** (Rule 10(1)).
> - **Absolute prohibitions (s.9(2),(3))**: no processing likely to cause any detrimental effect on a child's well-being, and no tracking, behavioural monitoring or targeted advertising directed at children. The Fourth Schedule exemptions relax s.9(1) and s.9(3) only for the listed classes and purposes. **They never relax s.9(2).**
> - **Schools / ed-tech** (e.g. a school client): an educational institution is exempt from s.9(1) and (3) only for processing **restricted to its educational activities or the safety of enrolled children**. Sharing with a third-party ed-tech or marketing vendor for any other purpose brings back full VPC. Use Part A-School for the institution's own processing, and Part A-General for apps and online services.
> - Fourth Schedule wording below is paraphrased. **VERIFY** it against the Gazette before release.

<!-- INCLUDE public-header -->

---

## PART A-GENERAL: NOTICE TO PARENTS / GUARDIANS (online services, apps, platforms)

# Notice to Parents and Guardians about Your Child's Personal Data

**[Client-Name]** ("we") offers [Child-Service-Description] ("Service"). Because your child is under 18, the law requires us to obtain **your** verifiable consent before we process your child's personal data. This notice explains what we will process and why, so that you can decide.

### 1. What we will collect about your child
| Item | Required / Optional | Purpose |
|---|---|---|
<!-- REPEAT Child-Data-Items -->
| [Data-Item] | [Data-Item-Requirement] | [Data-Item-Purpose] |
<!-- END REPEAT -->

> **Drafting note:** Keep this to the minimum. Typical items: child's first name / display name, age or date of birth, class or grade, learning progress, parent's mobile / email. Avoid precise location, photographs, contact lists and free-text chat unless they are essential.

### 2. What we will collect about you (parent / guardian)
Name, relationship to the child, mobile number / email, and your identity and age confirmation as described in Section 6. We use it only to verify your consent and to communicate with you.

### 3. Why we will process it
| # | Purpose | What it enables |
|---|---|---|
<!-- REPEAT Child-Purposes -->
| [Purpose-ID] | [Purpose-Name] | [Purpose-Service-Description] |
<!-- END REPEAT -->

### 4. What we will never do
- Track or behaviourally monitor your child, or show your child targeted or personalised advertising.
- Process your child's data in any way likely to harm their well-being.
- Sell your child's data, or use it to build marketing profiles.
- Share it beyond the recipients listed in Section 5.

### 5. Who we share it with
[Child-Data-Recipients]

### 6. How we verify you are the parent or guardian (Rule 10)
Before we activate the Service for your child, we verify that you are an adult (18 or above) whose identity can be established. We do this in one of these ways:
1. **If you are already a registered user with us**: we check the reliable identity and age details we already hold about you.
2. **If you are not a registered user**: you verify your identity and age using a **virtual token** issued by an authorised entity, such as **DigiLocker**. We receive only a confirmation that you are an adult (and, where needed, your name). We do not receive your underlying documents.
3. **Alternative**: [VPC-Alternative-Method].

We keep a record of the verification (method, date, time and result) as proof of consent. We do not keep copies of identity documents unless you choose to upload them and we tell you why.

### 7. Retention
We keep your child's data for [Child-Data-Retention] and erase it when your child's account is closed or you withdraw consent, unless a law requires us to keep it.

### 8. Your rights as parent / guardian
You can, at any time: see what we hold about your child; correct or update it; ask us to erase it; **withdraw consent** (the Service will then stop for your child); nominate another person; and raise a grievance. Use [Parent-Dashboard-Path] or write to [Grievance-Officer-Email]. When your child turns 18, we will ask them for their own consent to continue.

If you are not satisfied with our response, you may complain to the Data Protection Board of India at [DPB-Complaint-URL].

### 9. Contact
<!-- INCLUDE contact-block -->

---

### PARENTAL CONSENT FORM (Form P-1)
Child's name / display name: ____________  Age / Date of birth: ________
Parent / guardian name: ____________  Relationship: ☐ Mother ☐ Father ☐ Lawful guardian (court / authority order ref.: ________)
Mobile / email: ____________

I confirm that I am the parent / lawful guardian of the child named above and that I am 18 years or older. Having read the notice (version [Document-Version]), I give consent to:
- [ ] [Child-Purpose-1-Label] *(required for the Service)*
- [ ] [Child-Purpose-2-Label] *(optional)*

Verification method: ☐ Existing account ☐ DigiLocker / authorised virtual token ☐ [VPC-Alternative-Method]
Verification reference: [VPC-Reference]  Date & time: [VPC-Timestamp]

---

## PART A-SCHOOL: NOTICE TO PARENTS (educational institutions)

<!-- IF Children-Exemption-Class == Educational-Institution -->
# Student Data Privacy Notice for Parents and Guardians

**[Client-Name]** ("the School") processes personal data of students and their parents and guardians to deliver education and keep students safe.

### 1. What we collect
| Category | Items |
|---|---|
| Student identity | Name, date of birth, gender, photograph, admission number, APAAR / UDISE+ ID, Aadhaar (where required by government scheme), blood group |
| Parent / guardian | Names, relationship, contact numbers, email, address, occupation (optional), income certificate (for fee concession / RTE quota only) |
| Academic | Attendance, assessments, report cards, homework, learning-platform activity, teacher remarks, co-curricular records |
| Health & safety | Allergies, medical conditions, immunisation, emergency contact, incident records |
| Safety & transport | Bus route, pick-up / drop details, authorised pick-up persons<!-- IF Uses-CCTV -->, CCTV footage on campus and in buses<!-- END IF -->, GPS location of school buses |
| Fees | Fee payments, concessions, scholarship records |
| Images | Photos and videos at school events (see Section 3) |

### 2. Why we process it, and our basis
| Purpose | Basis |
|---|---|
| Admission, enrolment, teaching, assessment, report cards, promotion, transfer certificates | Educational activities of the School: exempt from separate verifiable consent and from the tracking restriction, to the extent restricted to educational activities (Fourth Schedule, Part A) |
| Child safety on campus and in transport, including attendance alerts, CCTV and bus GPS | Safety of enrolled children (Fourth Schedule, Part A); tracking of transport limited to the journey to and from school |
| Health care in school (school nurse / doctor) | Health services to the child, to the extent necessary (Fourth Schedule, Part A) |
| Reporting to CBSE / state board / UDISE+ / government scholarship portals | Legal obligation / State function (s.7, Fourth Schedule, Part B) |
| Student email account for school communication | Fourth Schedule, Part B (email communication only) |
| Fee collection | Contractual necessity and statutory accounts |
| **Publishing photos or videos on the website, social media or brochures** | **Your verifiable consent (optional)** |
| **Sharing with third-party ed-tech or learning apps beyond core teaching** | **Your verifiable consent (per app)** |
| **Alumni relations, newsletters, fundraising** | **Your consent (optional)** |

### 3. Your choices (Form P-2, given at admission and renewable every academic year)
- [ ] Photos and videos of my child may be published in school publications, on the website and on official social media.
- [ ] My child may use the following learning apps: [Edtech-App-List] (each app's privacy terms are attached).
- [ ] I would like to receive alumni / community newsletters.

Saying no does not affect your child's admission, education or any school activity.

### 4. Commitments
We do not allow any vendor to use student data for advertising or profiling. We do not show students targeted advertising. Vendors (bus operators, learning-platform providers, the ERP provider) are bound by written contracts that restrict them to our instructions.

### 5. Retention
Student academic records: [Student-Record-Retention] (as board / state rules require). CCTV: [CCTV-Retention]. Bus GPS location: [Bus-GPS-Retention]. Photos for publication: until consent is withdrawn.

### 6. Rights and contact
As described in Part A-General, Sections 8 and 9. School Privacy Contact: [Privacy-Contact-Name], [Privacy-Contact-Email]. Grievance Officer: [Grievance-Officer-Name], [Grievance-Officer-Email].
<!-- END IF -->

---

## PART B: LAWFUL GUARDIAN OF A PERSON WITH DISABILITY (Rule 11)

<!-- IF Processes-Disability-Guardian-Data -->
Where a person with disability cannot take legally binding decisions even with adequate and appropriate support, consent is given by their **lawful guardian**. Before we accept consent from a person who says they are the lawful guardian, we verify that they were appointed:
- by a **court of law**;
- by a **designated authority** under section 15 of the Rights of Persons with Disabilities Act, 2016; or
- by a **local level committee** under section 13 of the National Trust Act, 1999 (for persons with autism, cerebral palsy, intellectual disability or multiple disabilities).

**Form G-1: Guardian Consent**
Person with disability: ____________  Guardian name: ____________
Appointing authority: ☐ Court ☐ Designated authority (RPwD Act s.15) ☐ Local level committee (National Trust Act s.13)
Order / certificate no.: ________  Date: ________  Copy verified by: ________ (staff ID) on ________
Consents: [Guardian-Consent-Purposes]
<!-- END IF -->

---

## PART C: VPC MECHANISM SPECIFICATION (internal — for product / engineering)

### C1. Age-gating
1. Ask for the user's age or date of birth neutrally at sign-up. Do not pre-fill it, and do not nudge the user towards a particular age.
2. If the user is under 18, or the service is child-directed, block account activation and start the VPC flow. Collect nothing beyond what the VPC needs.
3. Keep an "age assurance" record. Fourth Schedule Part B permits processing to confirm that a user is **not** a child.

### C2. Parent identification flows (mapped to the Rule 10 illustrations)
| Case | Scenario | Verification step |
|---|---|---|
| 1 | Child signs up and names a parent who **is** a registered user | Notify the parent through their existing account; the parent logs in and confirms; check the reliable age/identity data on file |
| 2 | Child signs up and names a parent who is **not** a registered user | Send the parent an invitation link → parent verifies through a DigiLocker / authorised-entity virtual token → the system receives an "adult = true" attribute |
| 3 | Parent signs up for the child and **is** a registered user | Check reliable data on file; parent creates the child profile |
| 4 | Parent signs up for the child and is **not** a registered user | DigiLocker / virtual-token age verification during sign-up |

### C3. Evidence record (stored in the consent artefact, C04)
`vpc_id`, `child_profile_id`, `parent_user_id`, `relationship`, `verification_method` (existing-data / virtual-token / other), `token_issuer`, `token_reference` (hashed), `adult_confirmed` (bool), `timestamp`, `notice_version`, `purposes_consented[]`, `language`, `ip / device` (hashed).

### C4. Controls
- Child profiles: ads SDKs and behavioural analytics disabled; recommendations limited to content and age-appropriateness, never engagement maximisation.
- Re-verify the parent on high-risk changes: email change, adding a paid feature, enabling chat.
- At 18: prompt the now-adult user to give their own consent within [Age-Transition-Window], or erase or restrict their data.
- Retain VPC evidence for the life of the account plus [VPC-Evidence-Retention].

### C5. Fourth Schedule exemption register (**VERIFY** against the Gazette)
| Part | Class / purpose | Scope of exemption from s.9(1) & (3) |
|---|---|---|
| A-1 | Clinical / mental-health establishment, healthcare professional | Provision of health services to the child, to the extent necessary to protect her health |
| A-2 | Allied healthcare professional | Supporting the treatment / referral plan prescribed by a healthcare professional |
| A-3 | Educational institution | Tracking / behavioural monitoring for educational activities, or in the interest of safety of enrolled children |
| A-4 | Crèche / child day-care centre | Tracking / behavioural monitoring in the interest of safety of the children |
| A-5 | Person engaged by an educational institution / crèche to transport children | Tracking the location of children during travel to and from the institution, for safety |
| B-1 | Exercise of a power or function in the child's interest under law | As necessary |
| B-2 | Provision of a subsidy, benefit, service, certificate, licence or permit by the State | As necessary |
| B-3 | Creating a user account for communicating by email | Limited to email communication |
| B-4 | Ensuring information likely to have a detrimental effect on the child is not accessible to her | As necessary |
| B-5 | Confirming that the Data Principal is not a child (age assurance) | As necessary |

Client's claimed exemption: **[Children-Exemption-Class]**. Scope restriction documented in DPIA ref.: [DPIA-Ref].
