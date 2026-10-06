// The personal data vocabulary of the data map: sensitivity levels, the normalised categories
// every knowledge-base data element falls into, where data comes from, and the data each kind of
// department usually holds. AI-drafted from ComplyX's classification table (corrected where it
// listed an element twice or in the wrong category), awaiting legal review like the knowledge base.

export const LEVELS = ['L1', 'L2', 'L3', 'L4'] as const
export type Level = (typeof LEVELS)[number]

export const LEVEL_INFO: Record<Level, { label: string; meaning: string; handling: string }> = {
  L1: {
    label: 'Public',
    meaning: 'Freely shareable; no harm if disclosed.',
    handling: 'No special controls.',
  },
  L2: {
    label: 'Internal',
    meaning: 'Not secret, but not for public release.',
    handling: 'Access limited to staff.',
  },
  L3: {
    label: 'Confidential',
    meaning: 'Could cause harm or embarrassment if disclosed.',
    handling: 'Need-to-know access; encrypted at rest.',
  },
  L4: {
    label: 'Restricted',
    meaning: 'Could cause significant harm, discrimination or legal exposure if disclosed.',
    handling:
      'Strict access control, encryption in transit and at rest, audit logging, minimal retention.',
  },
}

export const higherLevel = (a: Level, b: Level): Level =>
  LEVELS.indexOf(a) >= LEVELS.indexOf(b) ? a : b

export type PersonalDataCategory = {
  code: string
  title: string
  description: string
  examples: string
  level: Level
  /** Knowledge-base data element categories that fall into this one. */
  kbCategories: string[]
  /** Not personal data unless it identifies an individual. */
  notPersonal?: boolean
}

export const PERSONAL_DATA_CATEGORIES: PersonalDataCategory[] = [
  {
    code: 'identifiers',
    title: 'Personal identifiers',
    description: 'Data that directly identifies a person.',
    examples: 'Full name, date of birth, photograph, signature, customer or employee ID, username',
    level: 'L2',
    kbCategories: ['identity', 'signature'],
  },
  {
    code: 'contact',
    title: 'Contact details',
    description: 'How to reach a person, including the work contact details of business contacts.',
    examples: 'Mobile number, email address, postal or home address, emergency contact',
    level: 'L2',
    kbCategories: ['contact'],
  },
  {
    code: 'demographic',
    title: 'Demographic and personal attributes',
    description: 'Characteristics or personal circumstances of a person.',
    examples: 'Age, gender, nationality, marital status, preferred language, occupation',
    level: 'L2',
    kbCategories: ['demographic', 'lifestyle'],
  },
  {
    code: 'family',
    title: 'Family and dependants',
    description:
      'Data about a person’s family members, nominees or guardians; it is their personal data too.',
    examples: 'Parents’ or spouse’s name, dependants, nominee details, guardian proof',
    level: 'L3',
    kbCategories: ['family'],
  },
  {
    code: 'government_ids',
    title: 'Government and official identifiers',
    description: 'Identifiers that a government issues to a person.',
    examples: 'Aadhaar, PAN, passport, voter ID, driving licence, ABHA, UAN, CKYC number',
    level: 'L4',
    kbCategories: ['gov_id'],
  },
  {
    code: 'financial',
    title: 'Financial data',
    description: 'A person’s finances, payments, assets or financial activity.',
    examples: 'Bank account, card details, UPI ID, income, credit report, transactions, tax',
    level: 'L4',
    kbCategories: ['financial', 'payment_card', 'credit_history', 'transaction', 'tax', 'property'],
  },
  {
    code: 'employment',
    title: 'Employment and professional data',
    description: 'A person’s work, career or professional relationship.',
    examples:
      'Job title, CV, employment history, performance, attendance, compensation, disciplinary records',
    level: 'L3',
    kbCategories: [
      'employment',
      'employment_history',
      'performance',
      'attendance',
      'background_check',
      'compensation',
      'compensation_expectation',
      'professional',
    ],
  },
  {
    code: 'education',
    title: 'Education and training',
    description: 'A person’s learning, qualifications and results.',
    examples: 'Qualifications, marksheets, student records, test results, training records',
    level: 'L3',
    kbCategories: ['education', 'assessment_results'],
  },
  {
    code: 'health',
    title: 'Health and medical data',
    description: 'A person’s physical or mental health.',
    examples: 'Diagnoses, prescriptions, lab results, disability, blood group, insurance claims',
    level: 'L4',
    kbCategories: ['health'],
  },
  {
    code: 'genetic',
    title: 'Genetic data',
    description: 'Inherited or acquired genetic characteristics.',
    examples: 'DNA, genomic or paternity test results',
    level: 'L4',
    kbCategories: ['genetic'],
  },
  {
    code: 'biometric',
    title: 'Biometric data',
    description: 'Physical or behavioural measurements used to recognise a person.',
    examples: 'Fingerprints, face templates, iris scans, voiceprints, palm-vein patterns',
    level: 'L4',
    kbCategories: ['biometric'],
  },
  {
    code: 'online',
    title: 'Online and device identifiers',
    description: 'Data that can single out a person in a digital environment.',
    examples: 'IP address, device or advertising ID, cookie ID, IMEI, session ID, access logs',
    level: 'L3',
    kbCategories: ['device_online', 'traffic'],
  },
  {
    code: 'authentication',
    title: 'Authentication and security data',
    description: 'Data used to sign a person in or secure their account.',
    examples: 'Password hashes, one-time passwords, MFA secrets, security answers, access cards',
    level: 'L4',
    kbCategories: ['credential'],
  },
  {
    code: 'behavioural',
    title: 'Behavioural and usage data',
    description:
      'A person’s activities, preferences or interactions, and what is inferred from them.',
    examples: 'Browsing and search history, purchase history, app usage, preferences, scores',
    level: 'L3',
    kbCategories: ['behavioural', 'preferences', 'inferences'],
  },
  {
    code: 'location',
    title: 'Location and travel data',
    description: 'Where a person is or has been.',
    examples: 'GPS location, location history, travel itineraries, vehicle telematics',
    level: 'L3',
    kbCategories: ['location', 'travel', 'vehicle'],
  },
  {
    code: 'communications',
    title: 'Communications',
    description: 'The content or the metadata of a person’s communications.',
    examples: 'Emails, chats, SMS, complaints, call detail records, message metadata',
    level: 'L3',
    kbCategories: ['communication_content', 'communication_metadata'],
  },
  {
    code: 'images_av',
    title: 'Images, audio and video',
    description: 'Recordings in which a person can be seen or heard.',
    examples: 'CCTV footage, call recordings, photos and videos, video KYC recordings',
    level: 'L3',
    kbCategories: ['images_av', 'voice'],
  },
  {
    code: 'criminal_legal',
    title: 'Criminal and legal data',
    description: 'Criminal proceedings, offences, investigations or legal matters about a person.',
    examples: 'Criminal history, police verification, court records, POSH or vigilance allegations',
    level: 'L4',
    kbCategories: ['sensitive_allegations'],
  },
  {
    code: 'protected',
    title: 'Protected and sensitive attributes',
    description: 'Attributes that can lead to discrimination or put a person at risk.',
    examples:
      'Religion, caste, ethnicity or tribe, sexual orientation, gender identity, political or union membership',
    level: 'L4',
    kbCategories: ['sensitive_attributes'],
  },
  {
    code: 'consent_records',
    title: 'Consent and preference records',
    description: 'What a person agreed to, refused or withdrew, and when.',
    examples: 'Consent artefacts, marketing opt-ins and opt-outs, notice acknowledgements',
    level: 'L2',
    kbCategories: ['consent_record'],
  },
  {
    code: 'business',
    title: 'Business identifiers',
    description:
      'Identifiers of a company or firm. Not personal data unless they identify an individual, such as a sole proprietor.',
    examples: 'CIN, LLPIN, company PAN or TAN, company GSTIN, Udyam number',
    level: 'L2',
    kbCategories: ['business'],
    notPersonal: true,
  },
  {
    code: 'other',
    title: 'Other personal data',
    description: 'Personal data that fits none of the categories above.',
    examples: 'Anything else that relates to an identifiable person',
    level: 'L2',
    kbCategories: ['any'],
  },
]

export const CATEGORY_CODES = PERSONAL_DATA_CATEGORIES.map((category) => category.code)

const BY_CODE = new Map(PERSONAL_DATA_CATEGORIES.map((category) => [category.code, category]))
const BY_KB = new Map(
  PERSONAL_DATA_CATEGORIES.flatMap((category) =>
    category.kbCategories.map((kb) => [kb, category.code] as const),
  ),
)

/** Elements whose knowledge-base category is broader than where the table puts them. */
const ELEMENT_CATEGORY: Record<string, string> = {
  'DE-BEH-004': 'behavioural',
  'DE-GOV-010': 'business',
  'DE-ID-010': 'demographic',
}

/** Context tags that make an element Restricted whatever its category. */
const RESTRICTED_TAGS = new Set(['financial', 'health', 'biometric', 'gov_id'])

export const categoryInfo = (code: string): PersonalDataCategory =>
  BY_CODE.get(code) ?? (BY_CODE.get('other') as PersonalDataCategory)

/** The normalised category of a knowledge-base data element. */
export const normaliseCategory = (element: { code: string; category: string }): string =>
  ELEMENT_CATEGORY[element.code] ?? BY_KB.get(element.category) ?? 'other'

/** The default level of an element: its category's, raised to L4 by a restricted context tag. */
export const defaultLevel = (element: {
  code: string
  category: string
  contextTags: readonly string[]
}): Level => {
  const base = categoryInfo(normaliseCategory(element)).level
  return element.contextTags.some((tag) => RESTRICTED_TAGS.has(tag))
    ? higherLevel(base, 'L4')
    : base
}

/** Where a department gets an element from: the person it is about, or someone else. */
export const DATA_SOURCES: { code: string; label: string; group: 'principal' | 'other' }[] = [
  { code: 'customers', label: 'Customers', group: 'principal' },
  { code: 'prospects', label: 'Prospects and leads', group: 'principal' },
  { code: 'users', label: 'Website and app users', group: 'principal' },
  { code: 'employees', label: 'Employees', group: 'principal' },
  { code: 'candidates', label: 'Job applicants', group: 'principal' },
  { code: 'former_employees', label: 'Former employees', group: 'principal' },
  { code: 'contract_workers', label: 'Contract and gig workers', group: 'principal' },
  { code: 'family', label: 'Family members, nominees and dependants', group: 'principal' },
  { code: 'vendor_contacts', label: 'Vendor and partner contact persons', group: 'principal' },
  { code: 'individual_vendors', label: 'Individual vendors and consultants', group: 'principal' },
  { code: 'visitors', label: 'Visitors', group: 'principal' },
  { code: 'children', label: 'Children and students (under 18)', group: 'principal' },
  { code: 'patients', label: 'Patients', group: 'principal' },
  { code: 'shareholders', label: 'Shareholders, directors and KMP', group: 'principal' },
  { code: 'beneficiaries', label: 'Beneficiaries and community members', group: 'principal' },
  {
    code: 'complainants',
    label: 'Complainants, whistle-blowers and witnesses',
    group: 'principal',
  },
  { code: 'third_party', label: 'A third party or vendor', group: 'other' },
  { code: 'public', label: 'Public sources', group: 'other' },
  { code: 'generated', label: 'Created internally (e.g. ratings, IDs, logs)', group: 'other' },
]

const SOURCE_LABEL = new Map(DATA_SOURCES.map((source) => [source.code, source.label]))
export const DEPARTMENT_SOURCE = 'dept:'

/** "dept:FIN" is the Finance department; other codes are DATA_SOURCES. */
export const sourceLabel = (
  source: string,
  departmentName: (code: string) => string | undefined,
) =>
  source.startsWith(DEPARTMENT_SOURCE)
    ? (departmentName(source.slice(DEPARTMENT_SOURCE.length)) ??
      source.slice(DEPARTMENT_SOURCE.length))
    : (SOURCE_LABEL.get(source) ?? source)

export const isKnownSource = (source: string) =>
  SOURCE_LABEL.has(source) || /^dept:[A-Z][A-Z0-9]{1,9}$/.test(source)

export const TRANSFER_ANSWERS = ['no', 'yes', 'unknown'] as const
export type TransferAnswer = (typeof TRANSFER_ANSWERS)[number]

/** Data a kind of department usually holds, and the knowledge-base processes it matches. */
export type DepartmentPreset = {
  key: string
  title: string
  /** Lower-case words or phrases matched against the department name and code. */
  keywords: string[]
  /** Knowledge-base process template departments. */
  processDepartments: string[]
  elements: string[]
  sources: string[]
}

export const DEPARTMENT_PRESETS: DepartmentPreset[] = [
  {
    key: 'hr',
    title: 'Human resources',
    keywords: ['hr', 'hrd', 'human', 'people', 'personnel', 'talent', 'recruit', 'payroll'],
    processDepartments: ['Human Resources', 'Plant HR', 'Staffing'],
    elements: [
      'DE-ID-001',
      'DE-ID-002',
      'DE-ID-003',
      'DE-ID-004',
      'DE-ID-006',
      'DE-ID-007',
      'DE-ID-009',
      'DE-CON-001',
      'DE-CON-002',
      'DE-CON-003',
      'DE-CON-004',
      'DE-GOV-001',
      'DE-GOV-003',
      'DE-GOV-009',
      'DE-FIN-001',
      'DE-FIN-004',
      'DE-FIN-008',
      'DE-FIN-011',
      'DE-EMP-001',
      'DE-EMP-002',
      'DE-EMP-003',
      'DE-EMP-004',
      'DE-EMP-005',
      'DE-EMP-006',
      'DE-EMP-007',
      'DE-EMP-009',
      'DE-EMP-011',
      'DE-EMP-013',
      'DE-EDU-001',
      'DE-FAM-001',
      'DE-FAM-002',
      'DE-HLT-012',
      'DE-HLT-018',
      'DE-BIO-001',
    ],
    sources: ['employees', 'candidates', 'family'],
  },
  {
    key: 'finance',
    title: 'Finance and accounts',
    keywords: ['fin', 'finance', 'account', 'accounts', 'accounting', 'treasury', 'billing', 'tax'],
    processDepartments: ['Finance', 'Payments'],
    elements: [
      'DE-ID-001',
      'DE-ID-005',
      'DE-CON-001',
      'DE-CON-002',
      'DE-CON-003',
      'DE-CON-006',
      'DE-GOV-003',
      'DE-GOV-010',
      'DE-FIN-001',
      'DE-FIN-003',
      'DE-FIN-004',
      'DE-FIN-006',
      'DE-FIN-008',
      'DE-FIN-011',
      'DE-FIN-018',
      'DE-BUS-001',
      'DE-BUS-003',
      'DE-BUS-004',
      'DE-BUS-005',
    ],
    sources: ['customers', 'individual_vendors', 'employees'],
  },
  {
    key: 'procurement',
    title: 'Procurement and vendor management',
    keywords: [
      'purchase',
      'purchasing',
      'procure',
      'procurement',
      'sourcing',
      'vendor',
      'supply',
      'stores',
    ],
    processDepartments: ['Procurement', 'Supply', 'Stores'],
    elements: [
      'DE-ID-001',
      'DE-CON-006',
      'DE-CON-003',
      'DE-GOV-003',
      'DE-GOV-010',
      'DE-FIN-001',
      'DE-FIN-011',
      'DE-BUS-001',
      'DE-BUS-002',
      'DE-BUS-003',
      'DE-BUS-004',
      'DE-BUS-005',
    ],
    sources: ['vendor_contacts', 'individual_vendors'],
  },
  {
    key: 'it',
    title: 'IT and information security',
    keywords: [
      'it',
      'information technology',
      'infosec',
      'technology',
      'systems',
      'infrastructure',
    ],
    processDepartments: ['IT'],
    elements: [
      'DE-ID-001',
      'DE-ID-011',
      'DE-CON-002',
      'DE-EMP-001',
      'DE-EMP-016',
      'DE-DEV-001',
      'DE-DEV-002',
      'DE-DEV-008',
      'DE-DEV-009',
      'DE-DEV-010',
      'DE-DEV-013',
      'DE-AUT-001',
      'DE-AUT-003',
      'DE-COM-001',
      'DE-COM-007',
    ],
    sources: ['employees', 'users', 'generated'],
  },
  {
    key: 'marketing',
    title: 'Marketing and digital',
    keywords: ['mkt', 'marketing', 'digital', 'growth', 'brand', 'communications'],
    processDepartments: ['Marketing'],
    elements: [
      'DE-ID-001',
      'DE-CON-001',
      'DE-CON-002',
      'DE-CON-005',
      'DE-DEV-001',
      'DE-DEV-002',
      'DE-DEV-003',
      'DE-DEV-004',
      'DE-BEH-001',
      'DE-BEH-002',
      'DE-BEH-005',
      'DE-BEH-006',
      'DE-BEH-009',
      'DE-LOC-002',
      'DE-AV-004',
      'DE-COM-009',
    ],
    sources: ['customers', 'prospects', 'users'],
  },
  {
    key: 'sales',
    title: 'Sales and customer success',
    keywords: [
      'sales',
      'business development',
      'bd',
      'crm',
      'account management',
      'customer success',
    ],
    processDepartments: ['Sales', 'Sales & Service', 'Commercial'],
    elements: [
      'DE-ID-001',
      'DE-ID-009',
      'DE-CON-001',
      'DE-CON-002',
      'DE-CON-003',
      'DE-CON-006',
      'DE-BEH-004',
      'DE-FIN-006',
      'DE-AV-002',
      'DE-COM-001',
    ],
    sources: ['customers', 'prospects'],
  },
  {
    key: 'support',
    title: 'Customer support and operations',
    keywords: [
      'support',
      'customer service',
      'service desk',
      'helpdesk',
      'contact centre',
      'call centre',
      'operations',
      'ops',
    ],
    processDepartments: ['Customer Service', 'Support', 'Operations'],
    elements: [
      'DE-ID-001',
      'DE-ID-009',
      'DE-CON-001',
      'DE-CON-002',
      'DE-CON-003',
      'DE-AV-002',
      'DE-COM-001',
      'DE-COM-002',
      'DE-COM-006',
      'DE-COM-008',
    ],
    sources: ['customers', 'complainants'],
  },
  {
    key: 'admin',
    title: 'Administration, facilities and security',
    keywords: [
      'admin',
      'administration',
      'facility',
      'facilities',
      'security',
      'front office',
      'reception',
      'transport',
    ],
    processDepartments: ['Admin & Facilities', 'Front Office', 'Transport & Safety'],
    elements: [
      'DE-ID-001',
      'DE-ID-013',
      'DE-CON-001',
      'DE-GOV-005',
      'DE-GOV-006',
      'DE-AV-001',
      'DE-AV-006',
      'DE-BIO-001',
      'DE-AUT-004',
      'DE-LOC-001',
    ],
    sources: ['visitors', 'employees', 'contract_workers'],
  },
  {
    key: 'legal',
    title: 'Legal, compliance and secretarial',
    keywords: ['legal', 'compliance', 'secretarial', 'company secretary', 'governance', 'risk'],
    processDepartments: ['Legal & Compliance', 'Corporate Secretarial', 'Risk & Compliance'],
    elements: [
      'DE-ID-001',
      'DE-ID-005',
      'DE-CON-002',
      'DE-CON-003',
      'DE-GOV-003',
      'DE-FIN-010',
      'DE-COM-002',
      'DE-COM-004',
      'DE-SEN-004',
      'DE-SEN-005',
      'DE-SEN-007',
    ],
    sources: ['complainants', 'shareholders', 'customers', 'employees'],
  },
  {
    key: 'product',
    title: 'Product and engineering',
    keywords: ['product', 'engineering', 'development', 'r&d', 'data', 'analytics'],
    processDepartments: ['Digital / Product', 'Product', 'Platform'],
    elements: [
      'DE-ID-001',
      'DE-ID-011',
      'DE-CON-001',
      'DE-CON-002',
      'DE-DEV-001',
      'DE-DEV-002',
      'DE-DEV-003',
      'DE-DEV-005',
      'DE-DEV-008',
      'DE-DEV-012',
      'DE-BEH-001',
      'DE-BEH-002',
      'DE-LOC-001',
    ],
    sources: ['users', 'customers'],
  },
]

const words = (text: string) =>
  ` ${text
    .toLowerCase()
    .replace(/[^a-z0-9&]+/g, ' ')
    .trim()} `

/** The presets a department name or code points to, e.g. "HR" or "Purchase & Stores". */
export const presetsFor = (name: string, code = ''): DepartmentPreset[] => {
  const haystack = words(`${name} ${code}`)
  return DEPARTMENT_PRESETS.filter((preset) =>
    preset.keywords.some((keyword) => haystack.includes(` ${keyword} `)),
  )
}

/** A knowledge-base process template, as far as suggestions need it. */
export type ProcessHint = {
  code: string
  title: string
  department: string
  dataPrincipals: string[]
  dataCategories: string[]
  typicalSystems: string[]
  typicalThirdParties: string[]
  typicalLawfulBasis: string[]
}

export type Suggestion = {
  presets: string[]
  elements: string[]
  sources: string[]
  /** Normalised categories the matching processes handle. */
  categories: string[]
  processes: { code: string; title: string }[]
  systems: string[]
  recipients: string[]
  bases: string[]
}

const unique = <Item>(items: Item[]) => [...new Set(items)]

/**
 * What a department probably handles, from its name: the matching presets' elements and the
 * knowledge-base processes of the same kind of department (common ones and the client's sector).
 */
export const suggestFor = (
  name: string,
  code: string,
  processes: readonly ProcessHint[],
): Suggestion => {
  const presets = presetsFor(name, code)
  const haystack = words(`${name} ${code}`)
  const departments = new Set(presets.flatMap((preset) => preset.processDepartments))
  const matched = processes.filter(
    (process) =>
      departments.has(process.department) || haystack.includes(words(process.department)),
  )
  return {
    presets: presets.map((preset) => preset.title),
    elements: unique(presets.flatMap((preset) => preset.elements)),
    sources: unique(presets.flatMap((preset) => preset.sources)),
    categories: unique(
      matched.flatMap((process) =>
        process.dataCategories.map((category) => BY_KB.get(category) ?? 'other'),
      ),
    ).filter((category) => category !== 'other'),
    processes: matched.map((process) => ({ code: process.code, title: process.title })),
    systems: unique(matched.flatMap((process) => process.typicalSystems)),
    recipients: unique(matched.flatMap((process) => process.typicalThirdParties)),
    bases: unique(matched.flatMap((process) => process.typicalLawfulBasis)),
  }
}
