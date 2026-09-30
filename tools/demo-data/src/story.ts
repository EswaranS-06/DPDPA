import type { ClientInput } from '@duatf/feature-compliance-api'
import type { DocumentSpec } from './files'

// The demo story: two fictitious clients of ComplyX, told as dated events so every screen of
// DUATF has something to show. Days are counted from today (negative numbers are in the past).

export type AnswerValue = 'yes' | 'partial' | 'no' | 'not_applicable'
export type Answers = Record<string, readonly [AnswerValue, string]>

export type PersonSpec = {
  key: string
  name: string
  email: string
  role: 'client_dpo' | 'client_viewer' | 'department_owner'
  department?: string
}

export type DepartmentSpec = {
  code: string
  name: string
  head: string
  headEmail: string
  description: string
}

export type EvidenceSpec = {
  key: string
  day: number
  by: string
  title: string
  description?: string
  department: string
  /** Questions of the cycle the evidence is filed against. */
  questions: string[]
  validUntilIn?: number
  document: DocumentSpec
  review?: { day: number; decision: 'accepted' | 'rejected'; note?: string }
}

export type ActionStep =
  | { day: number; step: 'start' | 'wait' | 'submit' | 'verify' | 'close' }
  | { day: number; step: 'reject'; note: string }
  | {
      day: number
      step: 'evidence'
      title: string
      document: DocumentSpec
      review?: { day: number; decision: 'accepted' | 'rejected'; note?: string }
    }

export type ActionSpec = {
  key: string
  /** The finding of this question in the baseline assessment. */
  question: string
  title: string
  description?: string
  owner?: string
  department: string
  dueIn: number
  createdDay: number
  steps: ActionStep[]
}

export type CycleSpec = {
  key: string
  title: string
  createDay: number
  periodStart: number
  periodEnd: number
  dueIn: number
  /** Days on which the first and last domains are answered; domains in between are spread. */
  answerDays: [number, number]
  answers: Answers
  evidence: EvidenceSpec[]
  /** Earlier evidence (by key) filed again against this cycle's questions. */
  links: { day: number; by: string; evidence: string; questions: string[] }[]
  /** Domains whose answers the auditor accepts, and the days over which that happens. */
  review: { domains: 'all' | string[]; days: [number, number] }
  returned: {
    question: string
    day: number
    note: string
    fix?: { day: number; answer: AnswerValue; comment: string }
  }[]
  complete?: { submitDay: number; completeDay: number }
  risks: {
    question: string
    day: number
    likelihood: number
    impact: number
    owner: string
    description: string
  }[]
  acceptances: { question: string; day: number; note: string }[]
  actions: ActionSpec[]
}

export type ClientStory = {
  profile: ClientInput & { code: string; primaryContactEmail: string }
  periodStart: number
  periodEnd: number
  onboardDay: number
  departments: DepartmentSpec[]
  people: PersonSpec[]
  /** Department of each domain, then exceptions by question. */
  domainDepartment: Record<string, string>
  questionDepartment: Record<string, string>
  /** Questions the lead auditor answers while scoping (not applicable to this client). */
  scoping: string[]
  cycles: CycleSpec[]
}

/** Firm staff of ComplyX who run both engagements. */
export const DEMO_STAFF = {
  lead: { name: 'Meera Iyer', email: 'meera.iyer@complyx.example', role: 'lead_auditor' },
  auditor: { name: 'Arjun Nair', email: 'arjun.nair@complyx.example', role: 'auditor' },
} as const

export const LOADER = { name: 'DUATF demo loader', email: 'demo-loader@duatf.local' }

const pdf = (fileName: string, heading: string, lines: string[]): DocumentSpec => ({
  fileName,
  heading,
  lines,
})

const na = (reason: string) => ['not_applicable', reason] as const

// --- Nadall: a multi-speciality hospital, one cycle done and a re-assessment under way ------

const NADALL_NOT_SDF = na('Nadall has not been notified as a Significant Data Fiduciary.')
const NADALL_NOT_CM = na('Nadall is not a Consent Manager.')

const NADALL_BASELINE: Answers = {
  'Q-GOV-01': [
    'partial',
    'The DPO drafted a programme charter in March; the Board has not approved it.',
  ],
  'Q-GOV-02': [
    'partial',
    "IT security and patient confidentiality policies exist; there is no retention, children's data or breach policy.",
  ],
  'Q-GOV-03': [
    'yes',
    'Dr. Kavitha Menon is the privacy contact; her details are on the website and in the patient handbook.',
  ],
  'Q-GOV-04': [
    'no',
    'Only nursing induction mentions confidentiality; no DPDP training for any staff.',
  ],
  'Q-GOV-05': ['no', 'The tele-consultation app went live without any privacy review.'],
  'Q-GOV-06': ['no', 'Privacy is not reported to management or the Board.'],
  'Q-GOV-07': [
    'partial',
    'The medical superintendent screens clinical purposes; marketing and analytics purposes are not screened.',
  ],
  'Q-SCP-01': [
    'yes',
    'Applicability assessed at onboarding: Data Fiduciary; children and persons with disabilities are among its patients.',
  ],
  'Q-SCP-02': [
    'partial',
    'Roles recorded for insurers and the lab partner, not for the PACS or diet-app vendors.',
  ],
  'Q-SCP-03': [
    'no',
    'Reliance on s.7(f) medical emergency and the Fourth Schedule is not recorded.',
  ],
  'Q-SCP-04': [
    'partial',
    'Legal counsel follows MeitY notifications informally; no log or impact assessment.',
  ],
  'Q-MAP-01': [
    'partial',
    'The processing register covers OPD and IPD only; laboratory, pharmacy and HR are missing.',
  ],
  'Q-MAP-02': ['no', 'No data flow diagrams.'],
  'Q-MAP-03': [
    'no',
    'Patient lists are kept in spreadsheets and WhatsApp groups; no discovery has been run.',
  ],
  'Q-MAP-04': ['partial', 'HIS fields are catalogued; health and government ID flags are missing.'],
  'Q-LB-01': [
    'partial',
    'Clinical care has a basis; research contact and health-camp outreach do not.',
  ],
  'Q-LB-02': [
    'no',
    'The registration form collects religion, occupation and income without a stated purpose.',
  ],
  'Q-LB-03': ['yes', 'HR purposes are recorded separately from consent-based ones.'],
  'Q-LB-04': [
    'no',
    'Patient data was reused for a diabetes analytics pilot without a compatibility review.',
  ],
  'Q-NOT-01': ['no', 'No Rule 3 notice; the registration form has a one-line consent clause.'],
  'Q-NOT-02': ['no', 'There is no notice to reconcile.'],
  'Q-NOT-03': ['partial', 'Forms are in English and Tamil; many patients read Malayalam or Hindi.'],
  'Q-NOT-04': ['no', 'Notice and consent versions are not recorded.'],
  'Q-NOT-05': [
    'no',
    'Patients registered before the Act have not been identified or given a notice.',
  ],
  'Q-CON-01': ['partial', 'One bundled consent covers treatment, research contact and SMS offers.'],
  'Q-CON-02': ['no', 'Consents are on paper in the patient file; there is no ledger.'],
  'Q-CON-03': ['no', 'Patients can withdraw consent only by writing to the hospital.'],
  'Q-CON-04': ['no', 'A withdrawal would not reach the SMS vendor or the lab partner.'],
  'Q-CON-05': na('Nadall does not use a registered Consent Manager.'),
  'Q-CON-06': ['partial', 'Health-camp SMS use a DLT header but rely on the bundled consent.'],
  'Q-CHD-01': [
    'partial',
    'Age is taken from the date of birth; guardian details are captured for minors.',
  ],
  'Q-CHD-02': [
    'partial',
    'A guardian signs for a child, but their identity and relationship are not verified.',
  ],
  'Q-CHD-03': ['yes', 'The patient app has no advertising or tracking.'],
  'Q-CHD-04': [
    'partial',
    'Paediatric care relies on the Fourth Schedule exemption for clinical establishments; the reliance is not documented.',
  ],
  'Q-PWD-01': [
    'no',
    'Guardianship is not checked before a guardian consents for a patient with a disability.',
  ],
  'Q-DQ-01': [
    'partial',
    'The TPA desk checks pre-authorisation data; there is no formal accuracy control.',
  ],
  'Q-DQ-02': ['no', 'Corrections in the HIS are not passed to the lab partner or insurers.'],
  'Q-SEC-01': [
    'partial',
    'An ISO 27001 project has started; no personal-data risk assessment yet.',
  ],
  'Q-SEC-02': ['partial', 'The HIS database is encrypted; backups and laptops are not.'],
  'Q-SEC-03': ['no', 'Full Aadhaar numbers are visible on HIS screens and printed on bills.'],
  'Q-SEC-04': [
    'partial',
    'Role-based access in the HIS; no MFA for remote or administrator access.',
  ],
  'Q-SEC-05': ['no', 'Administrator passwords are shared; no vault or session recording.'],
  'Q-SEC-06': ['no', 'HIS access logs stay on the server and nobody reviews them.'],
  'Q-SEC-07': ['partial', 'Logs are kept for 90 days, not one year.'],
  'Q-SEC-08': ['yes', 'Nightly backups with a quarterly restore test.'],
  'Q-SEC-09': ['partial', 'Monthly patching; the last VAPT was in 2024.'],
  'Q-SEC-10': ['no', 'No DLP; staff email reports with patient data to personal accounts.'],
  'Q-SEC-11': ['partial', 'The medical records room is locked; ward files lie in open racks.'],
  'Q-SEC-12': na('Nadall does no software development of its own; the HIS is a vendor product.'),
  'Q-SEC-13': ['yes', 'All servers and devices synchronise to the NPL NTP servers.'],
  'Q-SEC-14': [
    'no',
    "Nursing tablets and doctors' phones have no device management or encryption.",
  ],
  'Q-BRE-01': [
    'no',
    'The incident procedure covers IT outages only; no DPDP breach criteria or notices.',
  ],
  'Q-BRE-02': ['no', 'Incidents are not logged with a personal-data impact assessment.'],
  'Q-BRE-03': ['no', 'There is no way to notify affected patients at scale.'],
  'Q-BRE-04': ['no', 'No breach exercises have been held.'],
  'Q-RET-01': [
    'partial',
    'Medical records follow the Clinical Establishments Rules; other records have no schedule.',
  ],
  'Q-RET-02': [
    'no',
    'Nothing is deleted from the HIS; old CCTV and billing data are kept indefinitely.',
  ],
  'Q-RET-03': na('Nadall is not in a Third Schedule class of Data Fiduciary.'),
  'Q-RET-04': ['no', 'Contracts do not require vendors to return or erase data.'],
  'Q-RET-05': [
    'partial',
    'Paper forms are scanned; the originals are kept with no destruction date.',
  ],
  'Q-RGT-01': [
    'partial',
    'Requests are taken at the medical records counter only; nothing online.',
  ],
  'Q-RGT-02': ['no', 'No procedure for access, correction, erasure or nomination requests.'],
  'Q-RGT-03': ['partial', 'Requesters show ID at the counter; nominees are not verified.'],
  'Q-RGT-04': ['no', 'A summary of processing for one patient cannot be produced.'],
  'Q-RGT-05': ['no', 'Erasure is not possible across the HIS and the vendors.'],
  'Q-TPM-01': ['partial', 'Procurement lists vendors; the data each receives is not recorded.'],
  'Q-TPM-02': ['no', 'No privacy due diligence before vendors are onboarded.'],
  'Q-TPM-03': [
    'no',
    'No data processing agreements with the lab partner, the PACS vendor or the SMS vendor.',
  ],
  'Q-TPM-04': ['no', 'Vendors are never reassessed.'],
  'Q-TPM-05': [
    'partial',
    'Sharing with insurers and TPAs follows IRDAI forms; no DPDP basis is recorded.',
  ],
  'Q-XB-01': [
    'no',
    'The PACS vendor stores images in Singapore; this is not recorded as a transfer.',
  ],
  'Q-XB-02': ['partial', 'Payments stay in India through the bank gateway; imaging data does not.'],
  'Q-SDF-01': NADALL_NOT_SDF,
  'Q-SDF-02': NADALL_NOT_SDF,
  'Q-SDF-03': NADALL_NOT_SDF,
  'Q-REG-01': ['no', 'No register or procedure for Data Protection Board inquiries.'],
  'Q-REG-02': ['partial', 'Legal tracks court deadlines; nothing is set up for Board orders.'],
  'Q-REG-03': [
    'yes',
    'The IT head is the CERT-In point of contact; the channel was tested in January.',
  ],
  'Q-RES-01': [
    'partial',
    'Clinical research goes through the ethics committee; DPDP safeguards are not documented.',
  ],
  'Q-STA-01': ['partial', 'CMCHIS and PM-JAY claims are processed; there is no scheme-wise note.'],
  'Q-CMO-01': NADALL_NOT_CM,
  'Q-CMO-02': NADALL_NOT_CM,
}

const NADALL_REASSESSMENT: Answers = {
  'Q-GOV-01': ['yes', 'The Board approved the programme charter in June.'],
  'Q-GOV-02': ['yes', 'Policy suite v1.0 approved and under document control.'],
  'Q-GOV-03': ['yes', 'Contact details unchanged and published.'],
  'Q-GOV-04': ['partial', 'Training launched in July; 62% of staff have completed it.'],
  'Q-GOV-05': ['partial', 'New systems pass a privacy review; vendor changes do not yet.'],
  'Q-GOV-06': ['yes', 'A quarterly privacy report goes to management since June.'],
  'Q-GOV-07': ['partial', 'Marketing purposes are now screened; analytics are not.'],
  'Q-SCP-01': ['yes', 'Refreshed in August.'],
  'Q-SCP-02': ['yes', 'Roles recorded for every vendor.'],
  'Q-SCP-03': [
    'partial',
    'Exemption register started; the Fourth Schedule entry has no legal owner.',
  ],
  'Q-SCP-04': ['yes', 'Legal keeps a regulatory change log with impact assessments.'],
  'Q-MAP-01': ['yes', 'The register now covers every department.'],
  'Q-MAP-02': ['partial', 'Flows drawn for OPD and IPD; laboratory and pharmacy pending.'],
  'Q-MAP-03': ['no', 'The discovery scan is planned but not run.'],
  'Q-LB-01': ['yes', 'Every purpose has a recorded basis.'],
  'Q-LB-02': ['partial', 'Religion and income removed from the form; occupation still collected.'],
  'Q-LB-03': ['yes', 'Unchanged.'],
  'Q-LB-04': ['partial', 'New uses are reviewed; the diabetes pilot data has not been reviewed.'],
  'Q-NOT-01': ['yes', 'The Rule 3 notice is live at registration, on the website and in the app.'],
  'Q-NOT-02': ['partial', 'Reconciled for OPD; IPD pending.'],
  'Q-NOT-03': ['partial', 'Still English and Tamil only; the DPO accepted this risk.'],
  'Q-NOT-04': ['yes', 'Each consent records the notice version.'],
  'Q-CON-01': ['yes', 'Separate consents for treatment contact, research and offers.'],
  'Q-CON-02': [
    'partial',
    'The ledger is live for new registrations; old consents are still on paper.',
  ],
  'Q-CON-03': ['partial', 'Withdrawal is possible in the app; not yet at the counter or by phone.'],
  'Q-CON-05': na('Nadall does not use a registered Consent Manager.'),
  'Q-CHD-01': ['yes', 'Age and guardian checks are part of registration.'],
  'Q-CHD-02': ['partial', 'Guardian ID is checked for new registrations only.'],
  'Q-CHD-03': ['yes', 'Unchanged.'],
  'Q-CHD-04': ['yes', 'The Fourth Schedule reliance is documented with its limits.'],
  'Q-PWD-01': ['partial', 'Guardianship documents are checked in IPD, not OPD.'],
  'Q-SEC-01': ['partial', 'ISO 27001 risk assessment done; certification planned for next year.'],
  'Q-SEC-02': ['yes', 'Backups and laptops are now encrypted.'],
  'Q-SEC-03': ['partial', 'Aadhaar is masked on OPD screens; bills still print the full number.'],
  'Q-SEC-04': ['yes', 'MFA is enforced for remote and administrator access.'],
  'Q-SEC-05': ['no', 'The password vault is budgeted for next year.'],
  'Q-SEC-06': ['partial', 'Firewall and server logs reach the SIEM; HIS access logs do not.'],
  'Q-SEC-07': ['yes', 'Log retention raised to one year.'],
  'Q-SEC-08': ['yes', 'Restore tests continue every quarter.'],
  'Q-SEC-09': ['yes', 'VAPT done in July 2026; high findings fixed.'],
  'Q-SEC-10': ['no', 'No DLP yet.'],
  'Q-SEC-11': ['partial', 'Ward racks now locked at night; day-time access is not logged.'],
  'Q-SEC-12': na('Nadall does no software development of its own; the HIS is a vendor product.'),
  'Q-SEC-13': ['yes', 'Unchanged.'],
  'Q-SEC-14': ['partial', 'Half of the nursing tablets are enrolled in device management.'],
  'Q-BRE-01': ['yes', 'Incident response plan v1.0 adopted.'],
  'Q-BRE-02': ['partial', 'Incidents are logged; the impact assessment is not always done.'],
  'Q-BRE-03': ['partial', 'Bulk SMS can reach patients; email and app notices are not set up.'],
  'Q-RET-01': ['yes', 'Retention schedule approved for every record type.'],
  'Q-RET-02': ['partial', 'CCTV is overwritten after 30 days; HIS deletion is not possible yet.'],
  'Q-RET-03': na('Nadall is not in a Third Schedule class of Data Fiduciary.'),
  'Q-RGT-01': ['yes', 'Rights requests can be made online, by email and at the counter.'],
  'Q-RGT-02': [
    'partial',
    'SOPs drafted for access and correction; erasure and nomination pending.',
  ],
  'Q-TPM-01': ['yes', 'The vendor inventory records the data each vendor receives.'],
  'Q-TPM-02': ['partial', 'New vendors fill a privacy questionnaire; existing ones have not.'],
  'Q-TPM-03': ['partial', 'DPA signed with the lab partner; the PACS vendor has not signed.'],
  'Q-XB-01': [
    'partial',
    'The transfer register lists the PACS vendor; safeguards are not recorded.',
  ],
  'Q-SDF-01': NADALL_NOT_SDF,
  'Q-SDF-02': NADALL_NOT_SDF,
  'Q-SDF-03': NADALL_NOT_SDF,
  'Q-REG-01': ['partial', 'Inquiry register created; the procedure is in draft.'],
  'Q-REG-03': ['yes', 'Unchanged.'],
  'Q-CMO-01': NADALL_NOT_CM,
  'Q-CMO-02': NADALL_NOT_CM,
}

const nadallAction = (
  key: string,
  question: string,
  title: string,
  owner: string | undefined,
  department: string,
  dueIn: number,
  steps: ActionStep[],
): ActionSpec => ({ key, question, title, owner, department, dueIn, createdDay: -118, steps })

const done = (
  days: { start: number; evidence: number; verify: number; close?: number },
  title: string,
  document: DocumentSpec,
): ActionStep[] => [
  { day: days.start, step: 'start' },
  {
    day: days.evidence,
    step: 'evidence',
    title,
    document,
    review: { day: days.verify, decision: 'accepted' },
  },
  { day: days.evidence, step: 'submit' },
  { day: days.verify, step: 'verify' },
  ...(days.close ? [{ day: days.close, step: 'close' as const }] : []),
]

export const NADALL: ClientStory = {
  profile: {
    code: 'NADALL',
    name: 'Nadall',
    legalName: 'Nadall Healthcare Private Limited',
    industry: 'Healthcare: multi-speciality hospital',
    sectorCode: 'HLT',
    organisationType: 'private_limited',
    website: 'https://nadall.example',
    country: 'India',
    state: 'Tamil Nadu',
    address: 'Demo address, Coimbatore, Tamil Nadu',
    employeeCount: 620,
    dataPrincipalCount: 180000,
    dpoName: 'Dr. Kavitha Menon',
    dpoEmail: 'dpo@nadall.example',
    primaryContactName: 'Ramesh Krishnan',
    primaryContactEmail: 'ceo@nadall.example',
    applicability: 'applicable',
    applicabilityNote:
      'DEMO CLIENT: every person, record and document is fictitious. A 350-bed multi-speciality hospital processing patient health data, including children and persons with disabilities. Not notified as a Significant Data Fiduciary.',
    status: 'active',
  },
  periodStart: -165,
  periodEnd: 60,
  onboardDay: -170,
  departments: [
    {
      code: 'ADM',
      name: 'Administration & Compliance',
      head: 'Dr. Kavitha Menon',
      headEmail: 'dpo@nadall.example',
      description: 'Hospital administration, legal and the DPO office.',
    },
    {
      code: 'REG',
      name: 'Patient Registration & Front Office',
      head: 'Fathima Sheikh',
      headEmail: 'front.office@nadall.example',
      description: 'OPD and IPD registration, the patient help desk and consent forms.',
    },
    {
      code: 'MRD',
      name: 'Medical Records',
      head: 'Ravi Kumar',
      headEmail: 'medical.records@nadall.example',
      description: 'Patient files, scanning, retention and release of records.',
    },
    {
      code: 'IT',
      name: 'IT & Information Security',
      head: 'Suresh Babu',
      headEmail: 'it.head@nadall.example',
      description: 'HIS, PACS, network, devices and security operations.',
    },
    {
      code: 'HR',
      name: 'Human Resources',
      head: 'Anitha Joseph',
      headEmail: 'hr@nadall.example',
      description: 'Staff records, recruitment and training.',
    },
    {
      code: 'PRO',
      name: 'Procurement & Vendors',
      head: 'Joseph Mathew',
      headEmail: 'procurement@nadall.example',
      description: 'Vendor onboarding, contracts and renewals.',
    },
    {
      code: 'BIL',
      name: 'Billing & Insurance',
      head: 'Priya Sundaram',
      headEmail: 'billing@nadall.example',
      description: 'Billing, the TPA desk, insurer and government scheme claims.',
    },
  ],
  people: [
    { key: 'dpo', name: 'Dr. Kavitha Menon', email: 'dpo@nadall.example', role: 'client_dpo' },
    { key: 'ceo', name: 'Ramesh Krishnan', email: 'ceo@nadall.example', role: 'client_viewer' },
    {
      key: 'reg',
      name: 'Fathima Sheikh',
      email: 'front.office@nadall.example',
      role: 'department_owner',
      department: 'REG',
    },
    {
      key: 'mrd',
      name: 'Ravi Kumar',
      email: 'medical.records@nadall.example',
      role: 'department_owner',
      department: 'MRD',
    },
    {
      key: 'it',
      name: 'Suresh Babu',
      email: 'it.head@nadall.example',
      role: 'department_owner',
      department: 'IT',
    },
    {
      key: 'hr',
      name: 'Anitha Joseph',
      email: 'hr@nadall.example',
      role: 'department_owner',
      department: 'HR',
    },
    {
      key: 'pro',
      name: 'Joseph Mathew',
      email: 'procurement@nadall.example',
      role: 'department_owner',
      department: 'PRO',
    },
    {
      key: 'bil',
      name: 'Priya Sundaram',
      email: 'billing@nadall.example',
      role: 'department_owner',
      department: 'BIL',
    },
  ],
  domainDepartment: {
    D01: 'ADM',
    D02: 'ADM',
    D03: 'MRD',
    D04: 'ADM',
    D05: 'REG',
    D06: 'REG',
    D07: 'REG',
    D08: 'MRD',
    D09: 'IT',
    D10: 'IT',
    D11: 'MRD',
    D12: 'REG',
    D13: 'PRO',
    D14: 'IT',
    D15: 'ADM',
    D16: 'ADM',
    D17: 'ADM',
    D18: 'ADM',
  },
  questionDepartment: {
    'Q-GOV-04': 'HR',
    'Q-LB-03': 'HR',
    'Q-MAP-03': 'IT',
    'Q-SEC-11': 'MRD',
    'Q-RET-05': 'MRD',
    'Q-REG-03': 'IT',
    'Q-TPM-05': 'BIL',
    'Q-STA-01': 'BIL',
    'Q-DQ-01': 'BIL',
  },
  scoping: ['Q-SDF-01', 'Q-SDF-02', 'Q-SDF-03', 'Q-CMO-01', 'Q-CMO-02'],
  cycles: [
    {
      key: 'baseline',
      title: 'DPDP readiness baseline 2026',
      createDay: -160,
      periodStart: -165,
      periodEnd: -125,
      dueIn: -120,
      answerDays: [-155, -138],
      answers: NADALL_BASELINE,
      evidence: [
        {
          key: 'charter-draft',
          day: -155,
          by: 'dpo',
          title: 'DPDP programme charter (draft)',
          department: 'ADM',
          questions: ['Q-GOV-01'],
          document: pdf(
            'Nadall DPDP programme charter - draft v0.3.pdf',
            'DPDP programme charter (draft v0.3)',
            [
              'Scope: all processing of personal data by Nadall Healthcare Private Limited.',
              'Accountable executive: Chief Executive Officer. Privacy lead: Dr. Kavitha Menon.',
              'RACI: administration (accountable), IT, medical records, front office and HR (responsible).',
              'Status: draft for Board approval.',
            ],
          ),
          review: { day: -132, decision: 'accepted' },
        },
        {
          key: 'contact-page',
          day: -155,
          by: 'dpo',
          title: 'Privacy contact page (website)',
          department: 'ADM',
          questions: ['Q-GOV-03'],
          document: pdf('Privacy contact page - website capture.pdf', 'Website: privacy contact', [
            'Privacy questions and requests: Dr. Kavitha Menon, dpo@nadall.example.',
            'Published on the website footer and in the patient handbook.',
          ]),
          review: { day: -132, decision: 'accepted' },
        },
        {
          key: 'register-v1',
          day: -153,
          by: 'mrd',
          title: 'Processing register - OPD and IPD',
          department: 'MRD',
          questions: ['Q-MAP-01'],
          document: {
            fileName: 'Processing register - OPD and IPD.xlsx',
            heading: 'Processing register',
            lines: [
              'Activity | Purpose | Basis | Data | Systems | Recipients | Retention',
              'OPD registration | Treatment | Consent | Name, contact, DOB, ID | HIS | Lab partner | 3 years after last visit',
              'IPD admission | Treatment | Consent | Health records, guardian | HIS, paper file | Insurers, TPA | 3 years after discharge',
            ],
          },
          review: { day: -131, decision: 'accepted' },
        },
        {
          key: 'consent-form',
          day: -149,
          by: 'reg',
          title: 'Registration and consent form - OPD',
          department: 'REG',
          questions: ['Q-NOT-01', 'Q-CON-01', 'Q-CHD-02'],
          document: pdf('OPD registration and consent form.pdf', 'OPD registration form', [
            'Patient name, date of birth, address, phone, ID number, religion, occupation, income.',
            'For minors: name and signature of the parent or guardian.',
            'Declaration: I consent to treatment and to Nadall contacting me about research and health offers.',
          ]),
          review: { day: -130, decision: 'accepted' },
        },
        {
          key: 'infosec-policy',
          day: -147,
          by: 'it',
          title: 'Information security policy v3.1',
          department: 'IT',
          questions: ['Q-SEC-01', 'Q-SEC-04'],
          validUntilIn: 200,
          document: pdf(
            'Information security policy v3.1.pdf',
            'Information security policy v3.1',
            [
              'Access to the HIS is role-based and reviewed every six months.',
              'Remote access by VPN; multi-factor authentication to be introduced.',
              'Security incidents are reported to the IT help desk.',
            ],
          ),
          review: { day: -128, decision: 'accepted' },
        },
        {
          key: 'ntp',
          day: -147,
          by: 'it',
          title: 'NTP configuration export',
          department: 'IT',
          questions: ['Q-SEC-13'],
          document: {
            fileName: 'NTP configuration export.txt',
            heading: 'NTP configuration (core switch and servers)',
            lines: [
              'server time.nplindia.org iburst',
              'server samay1.nic.in iburst',
              'Status: synchronised',
            ],
          },
          review: { day: -128, decision: 'accepted' },
        },
        {
          key: 'vapt-2024',
          day: -147,
          by: 'it',
          title: 'VAPT report 2024',
          department: 'IT',
          questions: ['Q-SEC-09'],
          validUntilIn: -280,
          document: pdf(
            'VAPT report 2024.pdf',
            'Vulnerability assessment and penetration test - 2024',
            [
              'Scope: patient portal and HIS web interface.',
              '3 high, 7 medium and 12 low findings; retest pending.',
            ],
          ),
          review: {
            day: -128,
            decision: 'rejected',
            note: 'The report is from 2024; the annual VAPT is overdue.',
          },
        },
        {
          key: 'restore-test',
          day: -133,
          by: 'it',
          title: 'Backup restore test - March 2026',
          department: 'IT',
          questions: ['Q-SEC-08'],
          document: pdf(
            'Backup restore test - March 2026.pdf',
            'Quarterly restore test - March 2026',
            [
              'HIS database restored to the DR server in 2 h 10 min; integrity checks passed.',
              'Next test due in June 2026.',
            ],
          ),
          review: { day: -128, decision: 'accepted' },
        },
        {
          key: 'retention',
          day: -145,
          by: 'mrd',
          title: 'Medical records retention schedule',
          department: 'MRD',
          questions: ['Q-RET-01'],
          document: pdf('Medical records retention schedule.pdf', 'Medical records retention', [
            'OPD records: 3 years from the last visit. IPD records: 3 years from discharge.',
            'Medico-legal cases: until the case is closed.',
          ]),
          review: { day: -127, decision: 'accepted' },
        },
        {
          key: 'vendors',
          day: -143,
          by: 'pro',
          title: 'Vendor list with data shared',
          department: 'PRO',
          questions: ['Q-TPM-01'],
          document: {
            fileName: 'Vendor list with data shared.csv',
            heading: 'Vendor list',
            lines: [
              'Vendor | Service | Personal data | Location',
              'Demo Labs | Laboratory tests | Patient ID, samples, results | India',
              'Demo PACS Cloud | Imaging archive | Images, patient ID | Singapore',
              'Demo SMS | Appointment SMS | Name, phone | India',
            ],
          },
          review: { day: -126, decision: 'accepted' },
        },
        {
          key: 'certin',
          day: -140,
          by: 'it',
          title: 'CERT-In point of contact letter',
          department: 'IT',
          questions: ['Q-REG-03'],
          document: pdf('CERT-In point of contact.pdf', 'CERT-In point of contact', [
            'Point of contact: Suresh Babu, IT & Information Security.',
            'Reporting channel tested on 15 January.',
          ]),
          review: { day: -125, decision: 'accepted' },
        },
      ],
      links: [],
      review: { domains: 'all', days: [-132, -124] },
      returned: [
        {
          question: 'Q-SEC-08',
          day: -134,
          note: 'Attach the latest restore test report before this can be accepted.',
          fix: {
            day: -133,
            answer: 'yes',
            comment: 'Nightly backups; the March 2026 restore test report is attached.',
          },
        },
      ],
      complete: { submitDay: -122, completeDay: -120 },
      risks: [
        {
          question: 'Q-SEC-03',
          day: -119,
          likelihood: 5,
          impact: 5,
          owner: 'Suresh Babu',
          description: 'Full Aadhaar numbers are visible on HIS screens and printed on bills.',
        },
        {
          question: 'Q-SEC-06',
          day: -119,
          likelihood: 4,
          impact: 5,
          owner: 'Suresh Babu',
          description: 'Misuse of patient records would go unnoticed.',
        },
        {
          question: 'Q-BRE-01',
          day: -119,
          likelihood: 4,
          impact: 5,
          owner: 'Suresh Babu',
          description: 'A breach could not be reported to the Board and patients in time.',
        },
        {
          question: 'Q-NOT-01',
          day: -119,
          likelihood: 5,
          impact: 3,
          owner: 'Fathima Sheikh',
          description: 'Patients get no DPDP notice at any point of collection.',
        },
        {
          question: 'Q-CHD-02',
          day: -119,
          likelihood: 4,
          impact: 4,
          owner: 'Fathima Sheikh',
          description: "Guardians' identity and relationship are not verified.",
        },
        {
          question: 'Q-MAP-03',
          day: -119,
          likelihood: 4,
          impact: 4,
          owner: 'Suresh Babu',
          description: 'Unknown copies of patient data in spreadsheets and chat groups.',
        },
        {
          question: 'Q-SEC-14',
          day: -119,
          likelihood: 4,
          impact: 4,
          owner: 'Suresh Babu',
          description: 'A lost tablet would expose patient records.',
        },
        {
          question: 'Q-GOV-06',
          day: -119,
          likelihood: 3,
          impact: 3,
          owner: 'Dr. Kavitha Menon',
          description: 'Management has no view of privacy risk.',
        },
        {
          question: 'Q-XB-01',
          day: -119,
          likelihood: 3,
          impact: 3,
          owner: 'Suresh Babu',
          description: 'Imaging data leaves India without a record or safeguards.',
        },
        {
          question: 'Q-REG-01',
          day: -119,
          likelihood: 2,
          impact: 3,
          owner: 'Dr. Kavitha Menon',
          description: 'A Board inquiry would be handled ad hoc.',
        },
      ],
      acceptances: [
        {
          question: 'Q-NOT-03',
          day: -110,
          note: 'English and Tamil cover 92% of our patients. Hindi and Malayalam notices are planned for 2027-28; staff explain the notice orally meanwhile.',
        },
      ],
      actions: [
        nadallAction(
          'charter',
          'Q-GOV-01',
          'Get Board approval for the DPDP programme charter',
          'dpo',
          'ADM',
          -90,
          done(
            { start: -110, evidence: -95, verify: -93, close: -92 },
            'Board resolution approving the DPDP programme charter',
            pdf('Board resolution - DPDP programme charter.pdf', 'Board resolution', [
              'Resolved that the DPDP programme charter (version 1.0) is approved.',
              'The CEO is the accountable executive; Dr. Kavitha Menon is the privacy lead.',
            ]),
          ),
        ),
        nadallAction(
          'policies',
          'Q-GOV-02',
          'Publish retention, children’s data and breach policies',
          'dpo',
          'ADM',
          -60,
          done(
            { start: -105, evidence: -65, verify: -63, close: -62 },
            'Privacy policy suite v1.0 (approved)',
            pdf('Privacy policy suite v1.0.pdf', 'Privacy policy suite v1.0', [
              'Contents: internal privacy policy, retention, rights handling, breach response, vendor privacy, children and persons with disabilities.',
              'Owner: DPO. Effective date and annual review recorded on each policy.',
            ]),
          ),
        ),
        nadallAction(
          'training',
          'Q-GOV-04',
          'Roll out DPDP training for all staff',
          'hr',
          'HR',
          20,
          [
            { day: -80, step: 'start' },
            {
              day: -12,
              step: 'evidence',
              title: 'Privacy training completion - August 2026',
              document: {
                fileName: 'Privacy training completion - August 2026.xlsx',
                heading: 'Training completion',
                lines: [
                  'Department | Staff | Completed | Completion',
                  'Nursing | 240 | 150 | 63%',
                  'Front office | 45 | 41 | 91%',
                  'Doctors | 110 | 52 | 47%',
                  'Administration | 60 | 49 | 82%',
                ],
              },
            },
            { day: -12, step: 'submit' },
          ],
        ),
        nadallAction(
          'notice',
          'Q-NOT-01',
          'Publish a Rule 3 notice at registration, on the website and in the app',
          'reg',
          'REG',
          -60,
          done(
            { start: -108, evidence: -70, verify: -68, close: -66 },
            'Rule 3 privacy notice - English and Tamil',
            pdf(
              'Rule 3 privacy notice - English and Tamil.pdf',
              'Privacy notice (DPDP Rules 2025, Rule 3)',
              [
                'What we collect and why, itemised by purpose.',
                'How to withdraw consent, exercise your rights and complain to the Data Protection Board.',
                'Available in English and Tamil at every registration desk, on the website and in the app.',
              ],
            ),
          ),
        ),
        nadallAction(
          'translations',
          'Q-NOT-03',
          'Translate the notice into Hindi and Malayalam',
          'reg',
          'REG',
          60,
          [],
        ),
        nadallAction('ledger', 'Q-CON-02', 'Build a consent ledger in the HIS', 'it', 'IT', 30, [
          { day: -90, step: 'start' },
          { day: -40, step: 'wait' },
        ]),
        nadallAction(
          'masking',
          'Q-SEC-03',
          'Mask Aadhaar numbers on HIS screens and bills',
          'it',
          'IT',
          -10,
          [{ day: -85, step: 'start' }],
        ),
        nadallAction(
          'mfa',
          'Q-SEC-04',
          'Enforce MFA for remote and administrator access',
          'it',
          'IT',
          -30,
          done(
            { start: -100, evidence: -35, verify: -33 },
            'MFA enforcement report',
            pdf('MFA enforcement report.pdf', 'Multi-factor authentication', [
              'VPN and HIS administrator accounts: MFA enforced for 100% of users.',
              'Exceptions: none.',
            ]),
          ),
        ),
        nadallAction(
          'siem',
          'Q-SEC-06',
          'Send HIS access logs to the SIEM with alerts',
          'it',
          'IT',
          45,
          [
            { day: -75, step: 'start' },
            {
              day: -30,
              step: 'evidence',
              title: 'SIEM onboarding plan',
              document: pdf('SIEM onboarding plan.pdf', 'SIEM onboarding plan', [
                'Phase 1: firewall and server logs. Phase 2: HIS access logs. Phase 3: alert rules.',
              ]),
              review: {
                day: -28,
                decision: 'rejected',
                note: 'A plan does not show that HIS access logs reach the SIEM.',
              },
            },
            { day: -30, step: 'submit' },
            {
              day: -28,
              step: 'reject',
              note: 'Show HIS access logs arriving in the SIEM and one alert rule.',
            },
          ],
        ),
        nadallAction(
          'vapt',
          'Q-SEC-09',
          'Commission the annual VAPT',
          'it',
          'IT',
          -45,
          done(
            { start: -100, evidence: -50, verify: -48, close: -47 },
            'VAPT report - July 2026',
            pdf(
              'VAPT report - July 2026.pdf',
              'Vulnerability assessment and penetration test - July 2026',
              [
                'Scope: patient portal, HIS web interface, VPN.',
                '0 critical, 1 high (fixed and retested), 5 medium, 9 low.',
              ],
            ),
          ),
        ),
        nadallAction(
          'mdm',
          'Q-SEC-14',
          'Enrol nursing tablets in device management with encryption',
          'it',
          'IT',
          -5,
          [],
        ),
        nadallAction(
          'irplan',
          'Q-BRE-01',
          'Adopt an incident response plan with DPDP breach notices',
          'it',
          'IT',
          -50,
          done(
            { start: -100, evidence: -55, verify: -53, close: -52 },
            'Incident response plan v1.0',
            pdf('Incident response plan v1.0.pdf', 'Incident response plan v1.0', [
              'Severity matrix and personal-data breach criteria.',
              'Notice to the Data Protection Board and affected patients (Rule 7); CERT-In within 6 hours.',
            ]),
          ),
        ),
        nadallAction(
          'dpas',
          'Q-TPM-03',
          'Sign data processing agreements with the lab, PACS and SMS vendors',
          'pro',
          'PRO',
          15,
          [{ day: -60, step: 'start' }],
        ),
        nadallAction(
          'discovery',
          'Q-MAP-03',
          'Run a personal-data discovery scan of file shares and email',
          undefined,
          'IT',
          60,
          [],
        ),
        nadallAction(
          'sops',
          'Q-RGT-02',
          'Write an SOP for each data principal right',
          'reg',
          'REG',
          10,
          [],
        ),
        nadallAction(
          'transfer',
          'Q-XB-01',
          'Record the PACS vendor’s Singapore hosting as a cross-border transfer',
          'it',
          'IT',
          -20,
          [{ day: -40, step: 'start' }],
        ),
      ],
    },
    {
      key: 'reassessment',
      title: 'Re-assessment Q3 2026',
      createDay: -21,
      periodStart: -30,
      periodEnd: 30,
      dueIn: 45,
      answerDays: [-20, -5],
      answers: NADALL_REASSESSMENT,
      evidence: [
        {
          key: 'privacy-report',
          day: -19,
          by: 'dpo',
          title: 'Quarterly privacy report - Q2 2026',
          department: 'ADM',
          questions: ['Q-GOV-06'],
          document: pdf(
            'Quarterly privacy report - Q2 2026.pdf',
            'Privacy report to management - Q2 2026',
            [
              'Readiness: 30.4% compliance in the baseline; 16 remediation actions planned, 5 closed.',
              'Rights requests: 12 received, all answered within 30 days.',
              'Incidents: 1 misdirected email, contained; no notice required.',
            ],
          ),
          review: { day: -12, decision: 'accepted' },
        },
        {
          key: 'register-v2',
          day: -18,
          by: 'mrd',
          title: 'Processing register v2 - all departments',
          department: 'MRD',
          questions: ['Q-MAP-01'],
          document: {
            fileName: 'Processing register v2 - all departments.xlsx',
            heading: 'Processing register v2',
            lines: [
              'Department | Activities | Purposes | Systems',
              'Front office | 4 | 6 | HIS, app',
              'Laboratory | 3 | 3 | LIS',
              'Pharmacy | 2 | 2 | Pharmacy system',
              'HR | 5 | 7 | HRMS',
            ],
          },
        },
      ],
      links: [
        { day: -19, by: 'dpo', evidence: 'charter-evidence', questions: ['Q-GOV-01'] },
        { day: -19, by: 'dpo', evidence: 'policies-evidence', questions: ['Q-GOV-02'] },
        { day: -17, by: 'reg', evidence: 'notice-evidence', questions: ['Q-NOT-01'] },
        { day: -13, by: 'it', evidence: 'vapt-evidence', questions: ['Q-SEC-09'] },
        { day: -13, by: 'it', evidence: 'mfa-evidence', questions: ['Q-SEC-04'] },
        { day: -13, by: 'it', evidence: 'irplan-evidence', questions: ['Q-BRE-01'] },
      ],
      review: { domains: ['D01', 'D02', 'D03', 'D04', 'D05', 'D06'], days: [-12, -7] },
      returned: [
        {
          question: 'Q-SEC-03',
          day: -4,
          note: 'Attach a screenshot of the masked OPD screen and say when bills will be masked.',
        },
      ],
      risks: [],
      acceptances: [],
      actions: [],
    },
  ],
}

// --- AMMA: a school in its first assessment ---------------------------------------------------

const AMMA_NOT_SDF = na('AMMA has not been notified as a Significant Data Fiduciary.')
const AMMA_NOT_CM = na('AMMA is not a Consent Manager.')

const AMMA_BASELINE: Answers = {
  'Q-GOV-01': ['no', 'There is no privacy programme or accountable person beyond the principal.'],
  'Q-GOV-02': [
    'partial',
    "An IT acceptable-use policy exists; there is no privacy, retention or children's data policy.",
  ],
  'Q-GOV-03': ['partial', 'The principal answers privacy questions; the contact is not published.'],
  'Q-GOV-04': ['no', 'Teachers and office staff have had no privacy training.'],
  'Q-GOV-05': ['no', 'The LMS and the bus-tracking app were adopted without a privacy review.'],
  'Q-GOV-06': ['no', 'The management committee does not discuss privacy.'],
  'Q-GOV-07': [
    'partial',
    'Academic purposes are clear; publicity use of student photos was never screened.',
  ],
  'Q-SCP-01': [
    'partial',
    'Applicability discussed at onboarding; exposure to children is not documented.',
  ],
  'Q-SCP-02': ['no', 'Roles of the LMS, transport and payment vendors are not recorded.'],
  'Q-SCP-03': ['no', 'Reliance on the Fourth Schedule exemption for schools is not recorded.'],
  'Q-SCP-04': ['no', 'Nobody tracks MeitY or CBSE changes that affect student data.'],
  'Q-MAP-01': ['no', 'There is no record of processing activities.'],
  'Q-MAP-02': ['no', 'No data flow diagrams.'],
  'Q-LB-01': [
    'partial',
    'Admissions and academics have a basis; photos and alumni outreach do not.',
  ],
  'Q-LB-02': [
    'partial',
    "The admission form asks for caste, religion, parents' income and Aadhaar; some fields are required by the State, others are not.",
  ],
  'Q-LB-03': ['yes', 'Staff data is used only for employment.'],
  'Q-LB-04': [
    'no',
    "Student photos and videos are posted on the school's social media without consent.",
  ],
  'Q-NOT-01': ['no', 'No notice; the admission form has a general declaration.'],
  'Q-NOT-02': ['no', 'There is no notice to reconcile.'],
  'Q-NOT-03': ['no', 'Forms are in English only; many parents read only Tamil.'],
  'Q-NOT-04': ['no', 'No versions are kept.'],
  'Q-CON-01': [
    'no',
    'One signature on the admission form covers everything, including photos and WhatsApp groups.',
  ],
  'Q-CON-02': ['no', 'Consents are not recorded apart from the signed form.'],
  'Q-CON-03': ['no', 'Parents cannot withdraw consent for photos or messages.'],
  'Q-CON-05': na('AMMA does not use a Consent Manager.'),
  'Q-CON-06': [
    'partial',
    'Admission-season promotions go to parents through WhatsApp broadcast lists.',
  ],
  'Q-CHD-01': ['yes', 'Age is verified from the birth certificate at admission.'],
  'Q-CHD-02': [
    'no',
    "There is no verifiable parental consent: the parent's identity is not checked and consent is not per purpose.",
  ],
  'Q-CHD-03': [
    'partial',
    'Buses track students by GPS and the LMS vendor collects usage analytics; no advertising.',
  ],
  'Q-CHD-04': [
    'partial',
    'Bus tracking relies on the Fourth Schedule exemption for safety; its limits are not documented.',
  ],
  'Q-DQ-01': [
    'partial',
    'Class teachers check marks and promotion decisions; there is no correction route.',
  ],
  'Q-SEC-01': ['no', 'No information security programme.'],
  'Q-SEC-02': [
    'partial',
    'The LMS is cloud-hosted with TLS; the office server and laptops are not encrypted.',
  ],
  'Q-SEC-03': ['no', 'Aadhaar numbers are shown in full in the school software.'],
  'Q-SEC-04': [
    'partial',
    'Office staff share two administrator accounts; no MFA on Google Workspace.',
  ],
  'Q-SEC-05': ['no', 'Administrator passwords are kept in a notebook in the office.'],
  'Q-SEC-06': ['no', 'No access logging.'],
  'Q-SEC-07': ['no', 'Logs are not kept.'],
  'Q-SEC-08': ['partial', 'Weekly backups to an external disk; restores have never been tested.'],
  'Q-SEC-09': ['no', 'No patching routine or security testing.'],
  'Q-SEC-10': ['no', 'Nothing stops student data leaving by email or USB drive.'],
  'Q-SEC-11': [
    'partial',
    'Admission files are in a locked cupboard; answer papers with names are left in staff rooms.',
  ],
  'Q-SEC-12': na('AMMA does no software development.'),
  'Q-SEC-14': [
    'no',
    'Teachers use personal phones for class WhatsApp groups with student details.',
  ],
  'Q-BRE-01': ['no', 'There is no incident response plan.'],
  'Q-BRE-02': ['no', 'Incidents are not logged.'],
  'Q-RET-01': ['no', 'No retention schedule; records of students who left in 2010 are still kept.'],
  'Q-RET-03': na('AMMA is not in a Third Schedule class of Data Fiduciary.'),
  'Q-RGT-01': ['partial', 'Parents can ask the office; nothing is published.'],
  'Q-RGT-02': ['no', 'No procedure for requests from parents or students.'],
  'Q-TPM-01': [
    'partial',
    'Vendors are known (LMS, bus GPS, payment gateway, photographer); the data they receive is not recorded.',
  ],
  'Q-TPM-02': ['no', 'No due diligence on vendors.'],
  'Q-TPM-03': ['no', 'No data processing agreements.'],
  'Q-TPM-05': ['partial', 'Fee data goes to the payment gateway and bank; no basis is recorded.'],
  'Q-SDF-01': AMMA_NOT_SDF,
  'Q-SDF-02': AMMA_NOT_SDF,
  'Q-SDF-03': AMMA_NOT_SDF,
  'Q-REG-03': ['no', 'No CERT-In point of contact.'],
  'Q-RES-01': na('AMMA does not use student data for research.'),
  'Q-STA-01': [
    'partial',
    'Scholarship and mid-day meal data is shared under State schemes without a scheme-wise note.',
  ],
  'Q-CMO-01': AMMA_NOT_CM,
  'Q-CMO-02': AMMA_NOT_CM,
}

const ammaAction = (
  key: string,
  question: string,
  title: string,
  owner: string | undefined,
  department: string,
  dueIn: number,
  steps: ActionStep[],
): ActionSpec => ({ key, question, title, owner, department, dueIn, createdDay: -30, steps })

export const AMMA: ClientStory = {
  profile: {
    code: 'AMMA',
    name: 'AMMA',
    legalName: 'AMMA Educational Trust',
    industry: 'Education: K-12 school',
    sectorCode: 'EDU',
    organisationType: 'trust_society_ngo',
    website: 'https://amma.example',
    country: 'India',
    state: 'Tamil Nadu',
    address: 'Demo address, Madurai, Tamil Nadu',
    employeeCount: 140,
    dataPrincipalCount: 5200,
    dpoName: 'Lakshmi Narayanan',
    dpoEmail: 'principal@amma.example',
    primaryContactName: 'S. Balasubramanian',
    primaryContactEmail: 'correspondent@amma.example',
    applicability: 'applicable',
    applicabilityNote:
      'DEMO CLIENT: every person, record and document is fictitious. A CBSE school with about 2,400 students (almost all children) and their parents; relies on the Fourth Schedule exemption for schools for tracking and monitoring.',
    status: 'active',
  },
  periodStart: -60,
  periodEnd: 30,
  onboardDay: -75,
  departments: [
    {
      code: 'ADM',
      name: "Principal's Office",
      head: 'Lakshmi Narayanan',
      headEmail: 'principal@amma.example',
      description: 'School leadership, policies and parent communication.',
    },
    {
      code: 'ADN',
      name: 'Admissions',
      head: 'Geetha Raman',
      headEmail: 'admissions@amma.example',
      description: 'Enquiries, admission forms and student onboarding.',
    },
    {
      code: 'ACD',
      name: 'Academics & Examinations',
      head: 'Vinod Kumar',
      headEmail: 'academics@amma.example',
      description: 'Attendance, marks, report cards and student records.',
    },
    {
      code: 'IT',
      name: 'IT & Digital Learning',
      head: 'Karthik Selvam',
      headEmail: 'it@amma.example',
      description: 'School software, the LMS, devices and network.',
    },
    {
      code: 'TRN',
      name: 'Transport',
      head: 'Manoj Pandian',
      headEmail: 'transport@amma.example',
      description: 'School buses, GPS tracking and route data.',
    },
    {
      code: 'FIN',
      name: 'Accounts & Fees',
      head: 'Deepa Rajan',
      headEmail: 'accounts@amma.example',
      description: 'Fee collection, the payment gateway and scholarships.',
    },
    {
      code: 'HR',
      name: 'Human Resources',
      head: 'Revathi Mohan',
      headEmail: 'hr@amma.example',
      description: 'Teacher and staff records.',
    },
  ],
  people: [
    { key: 'dpo', name: 'Lakshmi Narayanan', email: 'principal@amma.example', role: 'client_dpo' },
    {
      key: 'correspondent',
      name: 'S. Balasubramanian',
      email: 'correspondent@amma.example',
      role: 'client_viewer',
    },
    {
      key: 'adn',
      name: 'Geetha Raman',
      email: 'admissions@amma.example',
      role: 'department_owner',
      department: 'ADN',
    },
    {
      key: 'acd',
      name: 'Vinod Kumar',
      email: 'academics@amma.example',
      role: 'department_owner',
      department: 'ACD',
    },
    {
      key: 'it',
      name: 'Karthik Selvam',
      email: 'it@amma.example',
      role: 'department_owner',
      department: 'IT',
    },
    {
      key: 'trn',
      name: 'Manoj Pandian',
      email: 'transport@amma.example',
      role: 'department_owner',
      department: 'TRN',
    },
    {
      key: 'fin',
      name: 'Deepa Rajan',
      email: 'accounts@amma.example',
      role: 'department_owner',
      department: 'FIN',
    },
    {
      key: 'hr',
      name: 'Revathi Mohan',
      email: 'hr@amma.example',
      role: 'department_owner',
      department: 'HR',
    },
  ],
  domainDepartment: {
    D01: 'ADM',
    D02: 'ADM',
    D03: 'IT',
    D04: 'ADM',
    D05: 'ADN',
    D06: 'ADN',
    D07: 'ADN',
    D08: 'ACD',
    D09: 'IT',
    D10: 'IT',
    D11: 'ACD',
    D12: 'ADM',
    D13: 'IT',
    D14: 'IT',
    D15: 'ADM',
    D16: 'ADM',
    D17: 'ADM',
    D18: 'ADM',
  },
  questionDepartment: {
    'Q-GOV-04': 'HR',
    'Q-LB-03': 'HR',
    'Q-CHD-03': 'TRN',
    'Q-CHD-04': 'TRN',
    'Q-SEC-11': 'ACD',
    'Q-RET-05': 'ACD',
    'Q-TPM-05': 'FIN',
    'Q-STA-01': 'FIN',
  },
  scoping: ['Q-SDF-01', 'Q-SDF-02', 'Q-SDF-03', 'Q-CMO-01', 'Q-CMO-02', 'Q-RES-01'],
  cycles: [
    {
      key: 'baseline',
      title: 'DPDP readiness baseline 2026-27',
      createDay: -60,
      periodStart: -60,
      periodEnd: 30,
      dueIn: 20,
      answerDays: [-55, -12],
      answers: AMMA_BASELINE,
      evidence: [
        {
          key: 'aup',
          day: -55,
          by: 'dpo',
          title: 'IT acceptable use policy',
          department: 'ADM',
          questions: ['Q-GOV-02'],
          document: pdf('IT acceptable use policy.pdf', 'IT acceptable use policy', [
            'Staff may use school devices and accounts for school work only.',
            'Passwords must not be shared. Lost devices must be reported to the IT office.',
          ]),
          review: { day: -38, decision: 'accepted' },
        },
        {
          key: 'admission-form',
          day: -40,
          by: 'adn',
          title: 'Admission form 2026-27',
          department: 'ADN',
          questions: ['Q-NOT-01', 'Q-CON-01', 'Q-CHD-02'],
          document: pdf('Admission form 2026-27.pdf', 'Admission form 2026-27', [
            'Student: name, date of birth, Aadhaar, caste, religion, previous school, photographs.',
            'Parents: names, occupation, annual income, phone, email, Aadhaar.',
            'Declaration: I agree to the rules of the school and to the use of photographs and contact details for school purposes.',
          ]),
          review: { day: -38, decision: 'accepted' },
        },
        {
          key: 'gps-agreement',
          day: -35,
          by: 'trn',
          title: 'Bus GPS vendor agreement',
          department: 'TRN',
          questions: ['Q-CHD-03'],
          document: pdf('Bus GPS vendor agreement.pdf', 'Bus tracking service agreement', [
            'Service: live GPS tracking of 18 school buses and a parent app.',
            'Data: student name, class, stop, boarding times, parent phone.',
            'No clause on data processing, retention or breach notice.',
          ]),
        },
        {
          key: 'whatsapp-guidelines',
          day: -33,
          by: 'it',
          title: 'Staff WhatsApp group guidelines',
          department: 'IT',
          questions: ['Q-SEC-14'],
          document: {
            fileName: 'Staff WhatsApp group guidelines.txt',
            heading: 'Guidelines for class WhatsApp groups',
            lines: [
              'Do not share marks or health details in groups.',
              'Remove parents of students who have left.',
            ],
          },
          review: {
            day: -30,
            decision: 'rejected',
            note: 'Guidelines alone do not control the phones; show the device controls.',
          },
        },
        {
          key: 'gateway-contract',
          day: -24,
          by: 'fin',
          title: 'Fee payment gateway contract',
          department: 'FIN',
          questions: ['Q-TPM-05'],
          document: pdf('Fee payment gateway contract.pdf', 'Payment gateway services agreement', [
            'Data shared: student name, class, parent name, phone, email, fee amounts.',
            'Data stored in India. Confidentiality clause; no DPDP processing terms.',
          ]),
        },
      ],
      links: [],
      review: { domains: ['D01', 'D02', 'D04', 'D05', 'D06', 'D07'], days: [-38, -14] },
      returned: [
        {
          question: 'Q-GOV-03',
          day: -20,
          note: 'Is the contact on the website? Please confirm and attach a screenshot.',
        },
        {
          question: 'Q-LB-03',
          day: -19,
          note: 'Attach the note on staff data purposes before this can be accepted.',
        },
      ],
      risks: [
        {
          question: 'Q-CHD-02',
          day: -30,
          likelihood: 5,
          impact: 5,
          owner: 'Geetha Raman',
          description: "Children's data is processed without verifiable parental consent.",
        },
        {
          question: 'Q-LB-04',
          day: -30,
          likelihood: 5,
          impact: 4,
          owner: 'Lakshmi Narayanan',
          description: 'Student photos and videos are published without consent.',
        },
        {
          question: 'Q-SEC-14',
          day: -30,
          likelihood: 4,
          impact: 4,
          owner: 'Karthik Selvam',
          description: 'Student details sit on unmanaged personal phones.',
        },
        {
          question: 'Q-NOT-03',
          day: -30,
          likelihood: 3,
          impact: 3,
          owner: 'Geetha Raman',
          description: 'Parents who read only Tamil cannot understand the forms.',
        },
      ],
      acceptances: [],
      actions: [
        ammaAction(
          'vpc',
          'Q-CHD-02',
          'Introduce verifiable parental consent at admission',
          'adn',
          'ADN',
          30,
          [{ day: -25, step: 'start' }],
        ),
        ammaAction(
          'consent-form',
          'Q-CON-01',
          'Replace the blanket declaration with consent per purpose (photos, WhatsApp, publicity)',
          'adn',
          'ADN',
          20,
          [],
        ),
        ammaAction(
          'photos',
          'Q-LB-04',
          'Stop posting student photos without consent and review past posts',
          'dpo',
          'ADM',
          -7,
          [{ day: -28, step: 'start' }],
        ),
        ammaAction(
          'admins',
          'Q-SEC-04',
          'Remove shared administrator accounts and turn on 2-step verification',
          'it',
          'IT',
          14,
          [
            { day: -26, step: 'start' },
            {
              day: -6,
              step: 'evidence',
              title: 'Google Workspace 2-step verification report',
              document: {
                fileName: 'Google Workspace 2-step verification report.csv',
                heading: '2-step verification',
                lines: [
                  'Group | Users | Enrolled | Enforced',
                  'Office staff | 12 | 12 | Yes',
                  'Teachers | 96 | 71 | No',
                ],
              },
            },
            { day: -6, step: 'submit' },
          ],
        ),
        {
          ...ammaAction(
            'dpas',
            'Q-TPM-03',
            'Sign data processing agreements with the LMS, bus GPS and payment vendors',
            undefined,
            'IT',
            45,
            [],
          ),
          createdDay: -20,
        },
        ammaAction(
          'charter',
          'Q-GOV-01',
          'Approve a DPDP programme charter at the management committee',
          'dpo',
          'ADM',
          25,
          [],
        ),
        ammaAction(
          'gps',
          'Q-CHD-03',
          'Limit bus GPS data to safety and keep it for 30 days',
          'trn',
          'TRN',
          40,
          [{ day: -20, step: 'start' }],
        ),
        ammaAction(
          'phones',
          'Q-SEC-14',
          'Move class groups to managed school accounts',
          'it',
          'IT',
          -2,
          [],
        ),
      ],
    },
  ],
}

export const DEMO_STORIES = [NADALL, AMMA] as const
export const DEMO_CLIENT_CODES = DEMO_STORIES.map((story) => story.profile.code)
