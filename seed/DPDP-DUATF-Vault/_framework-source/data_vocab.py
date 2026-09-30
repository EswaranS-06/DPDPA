"""Controlled vocabularies (99 Vocabularies) + data element catalogue."""

FLAGS = [
    ("children", "Activity processes personal data of anyone under 18 (knowingly or likely).", "D07"),
    ("pwd", "Activity processes data of a person with disability acting through a lawful guardian.", "D07"),
    ("processor", "A Data Processor processes data on behalf of the entity in this activity.", "D13"),
    ("cross_border", "Data is stored, accessed or processed outside India (incl. vendor support access).", "D14"),
    ("third_schedule", "Entity is in a Third Schedule class (e-commerce >= 2 cr, gaming >= 50 lakh, social media >= 2 cr users).", "D11"),
    ("decision_or_disclosure", "Data is used to make a decision affecting the DP or is disclosed to another Data Fiduciary.", "D08"),
    ("legacy_data", "Activity holds data collected on consent before DPDP commencement.", "D05"),
    ("online_presence", "Entity offers a website/app through which DPs interact (R9, R14 publication).", "D12"),
    ("consent_manager_used", "DPs may give/withdraw consent via a registered Consent Manager.", "D06"),
    ("tracking_ads", "Tracking, behavioural monitoring, profiling or targeted advertising.", "D07"),
    ("marketing", "Promotional communications (SMS/voice/email/WhatsApp).", "D06"),
    ("research", "Research, archiving or statistical processing.", "D17"),
]

CONTEXT_TAGS = [
    ("health", "Health, medical, disability, mental health, genetic", 5),
    ("financial", "Bank, card, income, credit, transactions", 4),
    ("biometric", "Fingerprint, face template, iris, voiceprint", 5),
    ("gov_id", "Aadhaar, PAN, passport, voter ID, DL", 4),
    ("location", "Precise or continuous location", 3),
    ("cctv", "Video surveillance", 3),
    ("ai", "Automated decision-making / ML / profiling / LLM", 3),
]

ENTITY_ROLES = ["data_fiduciary", "significant_data_fiduciary", "data_processor", "joint_data_fiduciary", "consent_manager", "state_instrumentality"]

DATA_PRINCIPAL_TYPES = ["Customer", "Prospect/lead", "Website/app visitor", "Employee", "Job applicant", "Ex-employee", "Contract/gig worker", "Intern", "Employee dependant", "Nominee", "Guarantor/co-applicant", "Beneficiary/payee", "Minor (child) & parent/guardian", "Person with disability & lawful guardian", "Patient", "Attendant/relative", "Student", "Parent", "Alumni", "Citizen/beneficiary", "Visitor", "Vendor/consultant (individual)", "Vendor contact person", "Business partner contact", "Shareholder/director/KMP", "Donor", "Volunteer", "Subscriber", "Policyholder/insured", "Claimant", "Trial participant", "Healthcare professional", "Driver/delivery partner", "Recipient", "Tenant/resident", "Complainant/whistle-blower", "Referred person", "Social media user", "Non-user (contacts/UGC)"]

CHANNELS = ["Branch/store/front desk", "Website", "Mobile app", "Kiosk", "Call centre/IVR", "Email", "SMS", "WhatsApp/chat", "Field agent (tablet)", "Field agent (paper)", "Physical form/register", "API/partner integration", "Government portal", "Employer/group upload", "Vendor/processor", "Third-party DF (data sharing)", "Social media", "IoT/device", "Biometric device", "CCTV", "Public source"]

COLLECTION_METHODS = ["Direct - self-entered by DP", "Direct - staff-assisted entry", "Paper form then digitised", "Scanned document/OCR", "Verbal / phone", "Automatic (device, cookies, SDK, logs)", "Derived/inferred (analytics, scoring)", "Received from another DF", "Received from processor", "Public source", "Biometric capture", "Recorded (voice/video)"]

EVENT_TYPES = ["collect", "digitise", "verify", "store", "access/view", "use/decision", "profile/infer", "share-internal", "share-processor", "share-DF", "transfer-cross-border", "disclose-authority", "archive", "backup", "correct", "erase/anonymise", "breach"]

DIGITAL_STATES = [("digital", "Collected digitally - in scope"), ("digitised", "Collected on paper, later digitised - in scope from digitisation"), ("paper_only", "Never digitised - out of DPDP scope (still other laws/security)")]

TRANSFER_TYPES = ["internal (same entity)", "intra-group (other legal entity = other DF)", "to processor", "to independent DF", "to joint DF", "to authority/regulator", "cross-border to processor", "cross-border to DF", "public disclosure"]

SYSTEM_TYPES = ["Core/line-of-business application", "ERP", "CRM", "HRMS/Payroll", "Web/app backend", "Database", "Data warehouse/lake", "BI/analytics", "Marketing automation", "Customer support/helpdesk", "Telephony/call recording", "Email & collaboration", "File share/DMS", "Spreadsheet (shadow)", "Messaging app (shadow)", "Paper archive", "Backup/DR", "SIEM/logging", "IoT/device platform", "AI/ML platform", "LLM/GenAI tool", "Physical security (CCTV/PACS/VMS)"]

HOSTING = ["On-prem India", "Colocation India", "Public cloud - India region", "Public cloud - outside India", "SaaS - India hosted", "SaaS - outside India", "SaaS - unknown", "Vendor premises", "Personal device (BYOD)"]

THIRD_PARTY_TYPES = ["Cloud/IaaS", "SaaS", "IT services/MSP", "BPO/call centre", "Payment gateway/aggregator", "Bank", "Insurer/TPA", "Credit bureau", "KYC/verification vendor", "BGV agency", "Marketing/ad-tech", "Analytics/SDK", "SMS/email/WhatsApp provider", "Logistics/courier", "Recruitment agency", "Payroll provider", "Auditor/consultant", "Law firm", "Collection agency", "Group company", "Distributor/dealer/agent", "Government/regulator", "Research partner", "AI/LLM provider", "Security agency", "Printing/scanning/storage vendor"]

TEST_TYPES = [("Inquiry", "Interview control owner - lowest assurance, never alone"), ("Inspection", "Examine documents, configs, records"), ("Observation", "Watch the control operate (e.g. front-desk collection)"), ("Re-performance", "Independently execute (e.g. submit a rights request, withdraw consent)"), ("Technical test", "Scan/config review/network capture (e.g. SDK traffic, encryption)"), ("Data analytics", "Full-population test (e.g. records past retention, consent without notice version)")]

RATINGS = [(0, "Not implemented", "No control exists"), (1, "Initial", "Ad hoc, undocumented, person-dependent"), (2, "Defined", "Documented but not consistently applied / no evidence"), (3, "Implemented", "Consistently applied with evidence for the period"), (4, "Effective", "Tested, monitored, metrics, improving"), ("NA", "Not applicable", "Engine or exemption says not applicable - justification required")]

LIKELIHOOD = [(1, "Rare", "Would require unusual circumstances"), (2, "Unlikely", "Control mostly works; few exposures"), (3, "Possible", "Gap known; exposure moderate"), (4, "Likely", "Gap systemic; many DPs/transactions exposed"), (5, "Almost certain", "Non-compliance occurring now at scale / visible to DPs")]
IMPACT = [(1, "Minimal", "Penalty tier none/admin; few DPs; no sensitive context"), (2, "Minor", "Rs 50 cr tier; limited DPs; low sensitivity"), (3, "Moderate", "Rs 50 cr tier at scale OR sensitive context"), (4, "Major", "Rs 150-200 cr tier (SDF, children, breach intimation) OR health/financial/biometric at scale"), (5, "Severe", "Rs 250 cr tier (security) OR children + sensitive + scale OR regulator/public exposure")]
RISK_BANDS = [(1, 4, "Low"), (5, 9, "Medium"), (10, 16, "High"), (17, 25, "Critical")]

FINDING_STATUS = ["Draft", "Validated with owner", "Accepted - remediation planned", "In remediation", "Ready for retest", "Closed", "Risk accepted (signed)"]

ELEMENTS = [
    # id, name, category, tags, note
    ("DE-ID-001", "Full name", "identity", "", ""),
    ("DE-ID-002", "Date of birth / age", "identity", "children", "Drives child detection"),
    ("DE-ID-003", "Gender", "demographic", "", ""),
    ("DE-ID-004", "Photograph", "identity", "", "Face image; template = biometric"),
    ("DE-ID-005", "Signature (wet/scanned)", "identity", "", ""),
    ("DE-ID-006", "Father's/mother's/spouse name", "family", "", ""),
    ("DE-ID-007", "Marital status", "demographic", "", ""),
    ("DE-ID-008", "Nationality", "demographic", "", ""),
    ("DE-ID-009", "Customer/employee/patient ID (internal identifier)", "identity", "", "Rule 14(5) identifier"),
    ("DE-GOV-001", "Aadhaar number", "gov_id", "gov_id", "Aadhaar Act: mask, vault, purpose-limited"),
    ("DE-GOV-002", "Virtual ID / Aadhaar reference key / token", "gov_id", "gov_id", ""),
    ("DE-GOV-003", "PAN", "gov_id", "gov_id,financial", ""),
    ("DE-GOV-004", "Passport number & copy", "gov_id", "gov_id", ""),
    ("DE-GOV-005", "Voter ID", "gov_id", "gov_id", ""),
    ("DE-GOV-006", "Driving licence", "gov_id", "gov_id", ""),
    ("DE-GOV-007", "ABHA number", "gov_id", "gov_id,health", ""),
    ("DE-GOV-008", "APAAR ID", "gov_id", "gov_id,children", ""),
    ("DE-GOV-009", "UAN / PF / ESIC numbers", "gov_id", "gov_id", ""),
    ("DE-GOV-010", "GSTIN (proprietor)", "gov_id", "", ""),
    ("DE-GOV-011", "CKYC number", "gov_id", "gov_id", ""),
    ("DE-CON-001", "Mobile number", "contact", "", "Identifier + channel"),
    ("DE-CON-002", "Email address", "contact", "", ""),
    ("DE-CON-003", "Postal address", "contact", "", ""),
    ("DE-CON-004", "Emergency contact", "contact", "", "Third-party DP"),
    ("DE-CON-005", "WhatsApp / social handle", "contact", "", ""),
    ("DE-FIN-001", "Bank account number & IFSC", "financial", "financial", ""),
    ("DE-FIN-002", "Card number (PAN) / expiry", "payment_card", "financial", "Tokenise; never store CVV"),
    ("DE-FIN-003", "UPI ID", "financial", "financial", ""),
    ("DE-FIN-004", "Income / salary / CTC", "financial", "financial", ""),
    ("DE-FIN-005", "Credit score / bureau report", "credit_history", "financial", ""),
    ("DE-FIN-006", "Transaction history", "transaction", "financial", ""),
    ("DE-FIN-007", "Loan / EMI details", "financial", "financial", ""),
    ("DE-FIN-008", "Tax details (TDS, ITR, Form 16)", "tax", "financial", ""),
    ("DE-FIN-009", "Insurance policy details", "financial", "financial", ""),
    ("DE-FIN-010", "Investment holdings", "financial", "financial", ""),
    ("DE-HLT-001", "Diagnosis / medical condition", "health", "health", ""),
    ("DE-HLT-002", "Prescriptions / medication", "health", "health", ""),
    ("DE-HLT-003", "Lab & imaging results", "health", "health", ""),
    ("DE-HLT-004", "Clinical notes / discharge summary", "health", "health", ""),
    ("DE-HLT-005", "Disability status", "health", "health", "Also PwD guardian logic"),
    ("DE-HLT-006", "Mental health / counselling notes", "health", "health", "MHCA 2017 s.23"),
    ("DE-HLT-007", "Pregnancy / reproductive health", "health", "health", "PCPNDT/MTP"),
    ("DE-HLT-008", "HIV / STI status", "health", "health", "HIV Act 2017"),
    ("DE-HLT-009", "Genetic / genomic data", "genetic", "health", ""),
    ("DE-HLT-010", "Vaccination / fitness certificate", "health", "health", ""),
    ("DE-HLT-011", "Wearable data (heart rate, sleep, steps)", "health", "health", ""),
    ("DE-BIO-001", "Fingerprint", "biometric", "biometric", ""),
    ("DE-BIO-002", "Face template / facial recognition", "biometric", "biometric", ""),
    ("DE-BIO-003", "Iris", "biometric", "biometric", ""),
    ("DE-BIO-004", "Voiceprint", "biometric", "biometric", ""),
    ("DE-LOC-001", "Precise GPS location", "location", "location", ""),
    ("DE-LOC-002", "Cell-tower / IP-derived location", "location", "location", ""),
    ("DE-LOC-003", "Travel itinerary / PNR", "travel", "location", ""),
    ("DE-DEV-001", "IP address", "device_online", "", ""),
    ("DE-DEV-002", "Device ID / advertising ID", "device_online", "", ""),
    ("DE-DEV-003", "Cookies & pixel identifiers", "device_online", "", ""),
    ("DE-DEV-004", "Browsing / clickstream", "behavioural", "", ""),
    ("DE-DEV-005", "App usage / session data", "behavioural", "", ""),
    ("DE-DEV-006", "SMS inbox data (read for underwriting)", "communication_content", "financial", "Digital lending restrictions"),
    ("DE-DEV-007", "Phone contacts list", "contact", "", "Non-user PD; prohibited for digital lending"),
    ("DE-DEV-008", "Login credentials / password hash", "credential", "", "SPDI: password = SPD"),
    ("DE-BEH-001", "Preferences & interests", "preferences", "", ""),
    ("DE-BEH-002", "Inferred segments / propensity scores", "inferences", "ai", ""),
    ("DE-BEH-003", "Ratings & reviews given/received", "behavioural", "", ""),
    ("DE-BEH-004", "Purchase history", "transaction", "", ""),
    ("DE-EMP-001", "Job title, department, manager", "employment", "", ""),
    ("DE-EMP-002", "Employment history", "employment_history", "", ""),
    ("DE-EMP-003", "Performance ratings", "performance", "", ""),
    ("DE-EMP-004", "Attendance & leave", "attendance", "", ""),
    ("DE-EMP-005", "Disciplinary records", "employment", "", ""),
    ("DE-EMP-006", "Background verification report", "background_check", "", "May include criminal/court records"),
    ("DE-EMP-007", "Compensation & benefits", "compensation", "financial", ""),
    ("DE-EDU-001", "Educational qualifications & marksheets", "education", "", ""),
    ("DE-EDU-002", "Student academic records & grades", "education", "children", ""),
    ("DE-EDU-003", "Assessment / psychometric results", "assessment_results", "ai", ""),
    ("DE-FAM-001", "Dependants' names & DOB", "family", "children", ""),
    ("DE-FAM-002", "Nominee details", "family", "", ""),
    ("DE-AV-001", "CCTV footage", "images_av", "cctv", ""),
    ("DE-AV-002", "Call recording", "voice", "", ""),
    ("DE-AV-003", "Video KYC recording", "images_av", "biometric,gov_id", ""),
    ("DE-AV-004", "Event / marketing photos & videos", "images_av", "", ""),
    ("DE-COM-001", "Email/chat content", "communication_content", "", ""),
    ("DE-COM-002", "Complaint / grievance text", "communication_content", "", ""),
    ("DE-COM-003", "Call/data records (CDR/IPDR)", "communication_metadata", "location", ""),
    ("DE-SEN-001", "Religion / caste (e.g. for reservation/scheme)", "sensitive_attributes", "", "Not a DPDP category but high-harm; minimise"),
    ("DE-SEN-002", "Sexual orientation / gender identity", "sensitive_attributes", "", "SPDI SPD"),
    ("DE-SEN-003", "Political affiliation", "sensitive_attributes", "", ""),
    ("DE-SEN-004", "Criminal / court records", "sensitive_allegations", "", ""),
    ("DE-SEN-005", "Allegations in investigations/POSH", "sensitive_allegations", "", ""),
    ("DE-VEH-001", "Vehicle registration & telematics", "vehicle", "location", ""),
    ("DE-PRP-001", "Property details / ownership documents", "property", "", ""),
]
