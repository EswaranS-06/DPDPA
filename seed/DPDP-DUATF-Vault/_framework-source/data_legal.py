"""Layer L1 - Legal knowledge base: DPDP Act 2023, DPDP Rules 2025, Schedules, phases."""

PHASES = {
    1: {"date": "2025-11-13", "label": "Phase 1 - Board & definitions (in force)"},
    2: {"date": "2026-11-13", "label": "Phase 2 - Consent Manager regime (computed date)"},
    3: {"date": "2027-05-13", "label": "Phase 3 - All substantive obligations (computed date)"},
}
DATE_NOTE = ("Computed from printed Gazette date 13 Nov 2025 + 12/18 months. eGazette code and PIB "
             "release use 14 Nov 2025, which would shift computed dates by +1 day. Treat as "
             "interpretation until officially confirmed.")

CHAPTERS = {
    "I": "Preliminary",
    "II": "Obligations of Data Fiduciary",
    "III": "Rights and Duties of Data Principal",
    "IV": "Special Provisions",
    "V": "Data Protection Board of India - Establishment",
    "VI": "Powers, Functions and Procedure of Board",
    "VII": "Appeal and Alternate Dispute Resolution",
    "VIII": "Penalties and Adjudication",
    "IX": "Miscellaneous",
}

# (section, title, chapter, phase, summary, rules)
SECTIONS = [
    (1, "Short title and commencement", "I", 1, "Act may be brought into force on different dates for different provisions (s.1(2)); commenced via G.S.R. 843(E).", ["R01"]),
    (2, "Definitions", "I", 1, "Defines Data Principal, Data Fiduciary, Data Processor, Consent Manager, child (<18), personal data, digital personal data, processing, personal data breach, Significant Data Fiduciary, Board, etc.", ["R02"]),
    (3, "Application of Act", "I", 3, "Applies to digital personal data processed in India (collected digitally or digitised) and to processing outside India connected with offering goods/services to Data Principals in India. Excludes personal/domestic use and data made publicly available by the Data Principal or under legal obligation.", []),
    (4, "Grounds for processing personal data", "II", 3, "Process only for a lawful purpose: (a) with consent, or (b) for certain legitimate uses (s.7).", []),
    (5, "Notice", "II", 3, "Every consent request accompanied/preceded by notice (data, purpose, how to withdraw/exercise rights, how to complain to Board). Notice for legacy consents given before commencement 'as soon as reasonably practicable'. English or Eighth Schedule language option.", ["R03"]),
    (6, "Consent", "II", 3, "Consent: free, specific, informed, unconditional, unambiguous, clear affirmative action, limited to necessary data. Withdrawal with comparable ease; cease processing (and processors) within reasonable time. Consent Managers (6(7)-(9)); burden of proof on Data Fiduciary (6(10)). NB s.6(9) commences in Phase 2.", ["R03", "R04"]),
    (7, "Certain legitimate uses", "II", 3, "Closed list (a)-(i) of processing without consent: voluntary provision, State benefits, State functions, legal disclosure, court orders, medical emergency, epidemic, disaster/public order, employment.", ["R05"]),
    (8, "General obligations of Data Fiduciary", "II", 3, "Accountability (1), processor contracts (2), accuracy for decisions/disclosure (3), TOMs (4), security safeguards (5), breach intimation (6), erasure (7)-(8), publish contact (9), grievance redressal (10), 'approach' definition (11).", ["R06", "R07", "R08", "R09"]),
    (9, "Processing of personal data of children", "II", 3, "Verifiable consent of parent / lawful guardian; no detrimental processing; no tracking, behavioural monitoring or targeted advertising directed at children; exemptions via Fourth Schedule.", ["R10", "R11", "R12"]),
    (10, "Additional obligations of Significant Data Fiduciary", "II", 3, "Notified by Central Govt based on volume/sensitivity, risk to rights, sovereignty, electoral democracy, security, public order. DPO in India responsible to board, independent data auditor, periodic DPIA and audit, other measures.", ["R13"]),
    (11, "Right to access information about personal data", "III", 3, "Summary of personal data and processing; identities of Data Fiduciaries and Processors it was shared with + description of data shared. Applies to consent and s.7(a) processing.", ["R14"]),
    (12, "Right to correction and erasure of personal data", "III", 3, "Correction, completion, updating and erasure of data processed on consent / s.7(a); erasure unless retention necessary for specified purpose or law.", ["R14"]),
    (13, "Right of grievance redressal", "III", 3, "Readily available means of grievance redressal from Data Fiduciary/Consent Manager; respond within prescribed period (90 days max per Rule 14(3)); exhaust before approaching Board.", ["R14"]),
    (14, "Right to nominate", "III", 3, "Nominate any other individual to exercise rights in the event of death or incapacity.", ["R14"]),
    (15, "Duties of Data Principal", "III", 3, "Comply with law, no impersonation, no suppression of material information, no false/frivolous complaints, furnish verifiably authentic information for correction. Penalty up to Rs 10,000.", []),
    (16, "Processing of personal data outside India", "IV", 3, "Central Govt may restrict transfer to notified countries/territories (negative list). Sectoral laws providing higher protection/restriction on transfer continue to apply (16(2)).", ["R15"]),
    (17, "Exemptions", "IV", 3, "17(1)(a)-(f): legal claims, courts/regulators, crime, non-India principals under foreign contract, court-approved schemes, loan-defaulter assessment -> Ch II (except 8(1),8(5)), Ch III and s.16 disapplied. 17(2): notified State instrumentalities, research/archiving/statistics -> Act disapplied. 17(3): notified DFs incl. startups exempt from s.5, 8(3), 8(7), 10, 11. 17(4): State - 8(7), 12(3), 12(2) conditionally. 17(5): notified exemptions within 5 years.", ["R16"]),
    (18, "Establishment of Board", "V", 1, "Data Protection Board of India established as body corporate.", []),
    (19, "Composition and qualifications for appointment of Chairperson and Members", "V", 1, "Composition and qualifications.", ["R17"]),
    (20, "Salary, allowances and term of office", "V", 1, "Two-year term, re-appointment eligible.", ["R18"]),
    (21, "Disqualifications", "V", 1, "Disqualifications for Chairperson and Members.", []),
    (22, "Resignation by Members and filling of vacancy", "V", 1, "Resignation and vacancy.", []),
    (23, "Proceedings of Board", "V", 1, "Board proceedings; may function digitally.", ["R19", "R20"]),
    (24, "Officers and employees of Board", "V", 1, "Officers and employees.", ["R21"]),
    (25, "Members and officers to be public servants", "V", 1, "Public servants under BNS.", []),
    (26, "Powers of Chairperson", "V", 1, "General superintendence; authorises inquiries.", []),
    (27, "Powers and functions of Board", "VI", 3, "Direct urgent remedial measures on breach, inquire on complaint/reference/breach intimation, impose penalty, (1)(d) inquire into Consent Manager breaches (Phase 2), refer for blocking.", []),
    (28, "Procedure to be followed by Board", "VI", 3, "Digital office; inquiry; powers of civil court for summons, documents; interim orders.", ["R20"]),
    (29, "Appeal to Appellate Tribunal", "VII", 3, "Appeal to TDSAT within 60 days; digital filing; disposal endeavoured within 6 months.", ["R22"]),
    (30, "Orders passed by Appellate Tribunal to be executable as decree", "VII", 3, "Executable as civil court decree.", []),
    (31, "Alternate dispute resolution", "VII", 3, "Board may direct mediation.", []),
    (32, "Voluntary undertaking", "VII", 3, "Board may accept voluntary undertaking at any stage; bars proceedings on its contents unless breached.", []),
    (33, "Penalties", "VIII", 3, "Monetary penalties per Schedule after inquiry; factors: nature, gravity, duration, type of data, repetitive nature, gain/loss avoided, mitigation, proportionality, likely impact on the person.", []),
    (34, "Crediting sums realised by way of penalties to Consolidated Fund of India", "VIII", 3, "Penalties to Consolidated Fund.", []),
    (35, "Protection of action taken in good faith", "IX", 1, "Protection for Central Govt, Board and members.", []),
    (36, "Power to call for information", "IX", 3, "Central Govt may call for information from Board, Data Fiduciary or intermediary.", ["R23"]),
    (37, "Power of Central Government to issue directions", "IX", 3, "Blocking of public access on Board reference after penalties in two or more instances.", []),
    (38, "Consistency with other laws", "IX", 1, "Act is in addition to other laws; prevails in case of conflict.", []),
    (39, "Bar of jurisdiction", "IX", 1, "No civil court jurisdiction on matters the Board is empowered to determine.", []),
    (40, "Power to make rules", "IX", 1, "Rule-making power of Central Govt.", []),
    (41, "Laying of rules and certain notifications", "IX", 1, "Laying before Parliament.", []),
    (42, "Power to amend Schedule", "IX", 1, "Central Govt may amend Schedule (penalty cap not above Rs 250 crore).", []),
    (43, "Power to remove difficulties", "IX", 1, "Within 3 years of commencement.", []),
    (44, "Amendments to certain Acts", "IX", 1, "44(1) TRAI Act and 44(3) RTI Act s.8(1)(j) in force (Phase 1). 44(2) omits IT Act s.43A and 87(2)(ob) -> SPDI Rules 2011 continue until Phase 3.", []),
]
SECTION_PHASE_NOTES = {
    6: "s.6(1)-(8),(10) Phase 3; s.6(9) Phase 2",
    27: "s.27 Phase 3 except 27(1)(d) Phase 2",
    44: "44(1),(3) Phase 1; 44(2) Phase 3",
    1: "s.1(2) Phase 1",
}

# (rule, title, phase, sections, summary)
RULES = [
    ("R01", "Short title and commencement", 1, [1], "Rules 1,2,17-21 immediate; Rule 4 after 1 year; Rules 3,5-16,22,23 after 18 months."),
    ("R02", "Definitions", 1, [2], "Defines Act, Board-related terms, user account, verifiable consent (Rule 10/11)."),
    ("R03", "Notice given by Data Fiduciary to Data Principal", 3, [5, 6], "(a) standalone and understandable independently; (b) clear plain language, itemised description of personal data and specified purpose(s) with description of goods/services/uses; (c) communication link / means to withdraw consent (comparable ease), exercise rights and complain to Board."),
    ("R04", "Registration and obligations of Consent Manager", 2, [6], "Registration with Board on First Schedule Part A conditions; ongoing Part B obligations; Board may suspend/cancel."),
    ("R05", "Processing by State for subsidy, benefit, service, certificate, licence or permit", 3, [7], "State processing under s.7(b) per Second Schedule standards."),
    ("R06", "Reasonable security safeguards", 3, [8], "Minimum: (a) encryption/obfuscation/masking/virtual tokens; (b) access control; (c) logs, monitoring, review; (d) continuity/backups; (e) retain logs & personal data 1 year; (f) processor contract clauses; (g) TOMs."),
    ("R07", "Intimation of personal data breach", 3, [8], "(1) to each affected DP without delay: description, consequences, mitigation, safety steps, contact. (2)(a) to Board without delay: description, nature, extent, timing, location, likely impact; (2)(b) within 72 h (or extended): updated details, circumstances, mitigation, cause findings, remedial measures, report on DP intimations."),
    ("R08", "Time period for specified purpose deemed no longer served", 3, [8], "(1) Third Schedule classes: erase after period of inactivity; (2) 48-hour prior intimation; (3) retain personal data, traffic data and logs min. 1 year for Seventh Schedule purposes."),
    ("R09", "Contact information of person to answer questions about processing", 3, [8], "Publish prominently on website/app and mention in every response to a communication for exercise of rights: DPO (if SDF) or person able to answer questions."),
    ("R10", "Verifiable consent for processing personal data of child", 3, [9], "Due diligence that parent is identifiable adult via reliable details already held, voluntarily provided details, or virtual token from authorised entity (incl. DigiLocker)."),
    ("R11", "Verifiable consent for person with disability who has lawful guardian", 3, [9], "Verify guardian appointed by court, designated authority (RPwD Act 2016 s.15) or local level committee (National Trust Act 1999 s.13)."),
    ("R12", "Exemptions from obligations for children's data", 3, [9], "s.9(1) and 9(3) do not apply to Fourth Schedule Part A classes / Part B purposes, subject to conditions."),
    ("R13", "Additional obligations of Significant Data Fiduciary", 3, [10], "(1) DPIA + audit every 12 months; (2) report of significant observations to Board; (3) algorithmic/technical due diligence; (4) localisation of data specified by Central Govt (committee) incl. traffic data."),
    ("R14", "Rights of Data Principals", 3, [11, 12, 13, 14], "(1) publish means & identifiers; (2) request to DF; (3) grievance response within period not exceeding 90 days, publish, implement TOMs; (4) nomination; (5) 'identifier' definition."),
    ("R15", "Transfer of personal data outside India", 3, [16], "Transfer subject to requirements by Central Govt general/special order re making data available to foreign State or entities under its control."),
    ("R16", "Exemption for research, archiving or statistical purposes", 3, [17], "s.17(2)(b) applies if processing follows Second Schedule standards."),
    ("R17", "Appointment of Chairperson and other Members", 1, [19], "Search-cum-selection committees."),
    ("R18", "Salary, allowances and terms of service", 1, [20], "Per Fifth Schedule."),
    ("R19", "Procedure for meetings of Board and authentication of orders", 1, [23], "Meeting procedure."),
    ("R20", "Functioning of Board as digital office", 1, [23, 28], "Techno-legal measures; digital receipt of complaints, hearings."),
    ("R21", "Terms of appointment of officers and employees of Board", 1, [24], "Per Sixth Schedule."),
    ("R22", "Appeal to Appellate Tribunal", 3, [29], "Digital filing; fee as per TDSAT procedure."),
    ("R23", "Calling for information from Data Fiduciary or intermediary", 3, [36], "(1) furnish information for Seventh Schedule purposes to authorised person within time; (2) may prohibit disclosure of the request where it may prejudice sovereignty/security."),
]

SCHEDULES = [
    ("SCH-ACT", "Schedule to the Act - Penalties", 3, "Penalty caps: (1) s.8(5) security Rs 250 cr; (2) s.8(6) breach intimation Rs 200 cr; (3) s.9 children Rs 200 cr; (4) s.10 SDF Rs 150 cr; (5) s.15 DP duties Rs 10,000; (6) s.32 voluntary undertaking - up to the amount for the underlying breach; (7) any other provision Rs 50 cr."),
    ("SCH1", "First Schedule - Consent Manager registration (Part A) and obligations (Part B)", 2, "Part A: Indian company, capacity, net worth >= Rs 2 crore, fit & proper directors, independent certification of interoperable platform, etc. Part B: platform, content not readable by CM, records of consent/notice/sharing retained >= 7 years in machine-readable form, website/app, no sub-contracting, security, fiduciary capacity, conflict-of-interest controls, disclose promoters/shareholding, audit reporting to Board, Board approval for change of control."),
    ("SCH2", "Second Schedule - Standards for State processing (s.7(b)) and research/archiving/statistics (s.17(2)(b))", 3, "Lawful processing, purpose limitation, necessity/minimisation, reasonable accuracy efforts, retention only as necessary/by law, reasonable security safeguards, intimation to DP (contact, means to exercise rights), accountability of person determining purpose."),
    ("SCH3", "Third Schedule - Retention periods under Rule 8(1)", 3, "E-commerce entity >= 2 crore registered users in India; online gaming intermediary >= 50 lakh; social media intermediary >= 2 crore: 3 years from last approach or commencement of Rules (later), for all purposes except user account access and virtual tokens (wallet/money/goods)."),
    ("SCH4", "Fourth Schedule - Exemptions for children's data (s.9(1),(3))", 3, "Part A classes: clinical/mental health establishments & healthcare professionals (health services); allied healthcare professionals (treatment/referral); educational institutions (tracking/monitoring for education/safety); creche/child day care (safety); child transport (location tracking during travel). Part B purposes: exercise of powers in child's interest under law; subsidy/benefit/service/certificate/licence/permit; creation of email account for communication; real-time location for safety; prevent access to harmful information; confirm DP is not a child."),
    ("SCH5", "Fifth Schedule - Terms of service of Chairperson and Members", 1, "Board service terms."),
    ("SCH6", "Sixth Schedule - Terms of officers and employees of Board", 1, "Board staff terms."),
    ("SCH7", "Seventh Schedule - Purposes and authorised persons for calling for information (Rule 8(3), 23)", 3, "Purposes include use by State in interest of sovereignty/integrity/security, performance of function under law, and assessment for notifying SDF; authorised persons specified per purpose. Also the purpose anchor for Rule 8(3) 1-year log retention."),
]

PENALTIES = {
    "P1": ("s.8(5) security safeguards", 250),
    "P2": ("s.8(6) breach intimation", 200),
    "P3": ("s.9 children", 200),
    "P4": ("s.10 SDF", 150),
    "P5": ("s.15 Data Principal duties", 0.0001),
    "P6": ("s.32 voluntary undertaking", None),
    "P7": ("any other provision", 50),
}

LAWFUL_BASES = [
    ("consent", "Consent (s.6)", "s.4(1)(a), s.6"),
    ("s7a", "Voluntarily provided for specified purpose, no objection", "s.7(a)"),
    ("s7b", "State: subsidy, benefit, service, certificate, licence, permit", "s.7(b), R5, Sch2"),
    ("s7c", "State function under law / sovereignty & security", "s.7(c)"),
    ("s7d", "Legal obligation to disclose to State", "s.7(d)"),
    ("s7e", "Compliance with judgment/decree/order", "s.7(e)"),
    ("s7f", "Medical emergency - threat to life/health", "s.7(f)"),
    ("s7g", "Epidemic / threat to public health", "s.7(g)"),
    ("s7h", "Disaster / breakdown of public order", "s.7(h)"),
    ("s7i", "Employment purposes / safeguarding employer", "s.7(i)"),
    ("ex17_1a", "Exempt - enforcing legal right or claim", "s.17(1)(a)"),
    ("ex17_1b", "Exempt - courts, tribunals, regulators", "s.17(1)(b)"),
    ("ex17_1c", "Exempt - prevention/investigation of offences", "s.17(1)(c)"),
    ("ex17_1d", "Exempt - non-India principals under foreign contract (BPO)", "s.17(1)(d)"),
    ("ex17_1e", "Exempt - court-approved merger/demerger/scheme", "s.17(1)(e)"),
    ("ex17_1f", "Exempt - financial info of loan defaulters", "s.17(1)(f)"),
    ("ex17_2a", "Exempt - notified State instrumentality", "s.17(2)(a)"),
    ("ex17_2b", "Exempt - research/archiving/statistics (Sch2)", "s.17(2)(b), R16"),
    ("ex17_3", "Exempt - notified DF / startup (if notified)", "s.17(3)"),
]
