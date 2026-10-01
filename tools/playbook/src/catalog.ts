import type { Group, GroupId, Step, StepAction, Target, Tour } from './types.ts'

// --- Who can do what ---------------------------------------------------------------------------
// The roles allowed each capability, as in packages/core-access. TC-C18.1-01 compares this table
// with the real permission matrix, so a change in access rules fails the test until it is copied.

const FA = 'Firm administrator'
const LA = 'Lead auditor'
const AU = 'Auditor'
const DPO = 'Client DPO'
const DO = 'Department owner'
const VW = 'Viewer'
const EVERYONE = [FA, LA, AU, DPO, DO, VW]

export const WHO: Record<string, string[]> = {
  'platform.admin': [FA],
  'client.create': [FA, LA],
  'client.view': EVERYONE,
  'client.edit': [FA, LA, DPO],
  'client.assign_staff': [FA],
  'department.manage': [FA, LA, AU, DPO],
  'user.invite': [FA, LA, DPO],
  'assessment.create': [FA, LA],
  'assessment.view': EVERYONE,
  'assessment.assign': [FA, LA, AU, DPO],
  'assessment.answer': [LA, AU, DPO, DO],
  'assessment.review': [LA, AU],
  'evidence.view': EVERYONE,
  'evidence.upload': [LA, AU, DPO, DO],
  'evidence.review': [LA, AU],
  'finding.manage': [LA, AU],
  'risk.manage': [LA, AU],
  'risk.accept': [DPO],
  'action.manage': [LA, AU, DPO],
  'action.update': [LA, AU, DPO, DO],
  'action.verify': [LA, AU],
  'report.view': EVERYONE,
  'report.export': [FA, LA, AU, DPO, VW],
  'audit.view': [FA, LA, DPO],
  'kb.view': EVERYONE,
  'kb.edit': [FA, LA],
  'kb.publish': [FA],
}

export const GROUPS: Group[] = [
  {
    id: 'start',
    title: 'Start here',
    purpose: 'Find your way around, search, and set up an account you can work with.',
  },
  {
    id: 'clients',
    title: 'Clients',
    purpose: 'Onboard an organisation and keep its profile current.',
  },
  {
    id: 'organisation',
    title: 'Departments and people',
    purpose: 'Who holds the data, who answers for it and who can sign in.',
  },
  {
    id: 'assessments',
    title: 'Assessments',
    purpose: 'Start an assessment, assign questions, answer and review them.',
  },
  {
    id: 'evidence',
    title: 'Evidence',
    purpose: 'Upload, reuse and review the files that support answers and fixes.',
  },
  {
    id: 'findings',
    title: 'Findings and risk',
    purpose: 'What No and Partial answers raise, and how each risk is rated or accepted.',
  },
  {
    id: 'remediation',
    title: 'Remediation',
    purpose: 'Plan each fix, work it through and verify it.',
  },
  {
    id: 'reporting',
    title: 'Dashboards and reports',
    purpose: 'Where things stand, and the files to share.',
  },
  {
    id: 'knowledge',
    title: 'Knowledge base',
    purpose: 'The law, the controls and the reference lists, and how to change them.',
  },
  {
    id: 'admin',
    title: 'Administration',
    purpose: 'ComplyX staff accounts and how risks are banded.',
  },
]

// --- Targets ----------------------------------------------------------------------------------

const link = (name: string, exact = false): Target => ({ role: 'link', name, exact })
const button = (name: string, exact = false): Target => ({ role: 'button', name, exact })
const field = (label: string, nth?: number): Target =>
  nth === undefined ? { label } : { label, nth }
const region = (name: string): Target => ({ role: 'region', name })
const heading = (name: string): Target => ({ role: 'heading', name })
const css = (selector: string, nth?: number): Target =>
  nth === undefined ? { css: selector } : { css: selector, nth }
const within = (area: Target, target: Target): Target =>
  'role' in target || 'text' in target ? { ...target, within: area } : target
/** The summary line of a fold-out section. */
const fold = (text: string): Target => css(`summary:has-text("${text}")`)
/** A link in the sidebar, by its address. */
const side = (path: string): Target => css(`nav[aria-label="Main"] a[href="${path}"]`)
const firstLink = (hrefPart: string): Target => css(`main a[href*="${hrefPart}"]`)

// --- Steps ------------------------------------------------------------------------------------

type Extra = Partial<Pick<Step, 'at' | 'optional'>>
const see = (title: string, say: string, target?: Target, extra: Extra = {}): Step => ({
  title,
  say,
  ...(target ? { target } : {}),
  ...extra,
})
const act = (
  title: string,
  say: string,
  target: Target,
  action: StepAction,
  extra: Extra = {},
): Step => ({
  title,
  say,
  target,
  action,
  ...extra,
})
const click = (title: string, say: string, target: Target, extra: Extra = {}) =>
  act(title, say, target, { click: true }, extra)
const enter = (title: string, say: string, target: Target, value: string, extra: Extra = {}) =>
  act(title, say, target, { fill: value }, extra)
const choose = (title: string, say: string, target: Target, label: string, extra: Extra = {}) =>
  act(title, say, target, { select: label }, extra)
const open = (title: string, say: string, summaryText: string, extra: Extra = {}) =>
  act(title, say, fold(summaryText), { open: true }, extra)
/** A step that saves or sends something: the guide stops and the person decides. */
const yours = (
  title: string,
  say: string,
  target: Target,
  instruction: string,
  leaves?: string,
): Step => ({
  title,
  say,
  target,
  you: leaves ? { instruction, leaves } : { instruction },
})

const CLIENT = '/clients/{client}'

/** Opens the practice client's section from the sidebar. */
const toSection = (section: string, label: string, say: string): Step =>
  click(`Open ${label}`, say, side(`${CLIENT}/${section}`), { at: CLIENT })

const openAssessment: Step = click(
  'Open the assessment',
  'Each row is one assessment cycle. Open the latest one.',
  firstLink('/assessments/ASM-'),
  { at: `${CLIENT}/assessments` },
)

const openQuestion: Step = click(
  'Open a question',
  'Every question comes from a control in the knowledge base. Open one to work on it.',
  firstLink('/items/'),
)

// --- Tours ------------------------------------------------------------------------------------

type TourInput = Omit<Tour, 'who'>

const tours: TourInput[] = [
  // Start here --------------------------------------------------------------------------------
  {
    id: 'find-your-way',
    group: 'start',
    title: 'Find your way around',
    summary: 'The overview, the sidebar, a client and the breadcrumbs.',
    capability: 'client.view',
    keywords: ['navigation', 'sidebar', 'overview', 'home', 'menu', 'dashboard'],
    persona: 'staff',
    steps: [
      see(
        'The overview',
        'This is the first page after sign-in: where every client stands today, and what needs your attention.',
        heading('Needs your attention'),
        { at: '/' },
      ),
      see(
        'The sidebar',
        'Overview and Clients for the firm, the Knowledge base, and Administration for firm administrators.',
        css('nav[aria-label="Main"]'),
      ),
      click('Open the clients', 'Clients lists every organisation you can open.', side('/clients')),
      click(
        'Open a client',
        'Open one client. Everything for that client sits under its name.',
        css('main table a[href^="/clients/"]'),
        { at: '/clients' },
      ),
      see(
        "The client's sections",
        'Inside a client the sidebar shows its sections: compliance, risk and remediation, reporting and organisation.',
        css('nav[aria-label="Main"] [role="group"]'),
      ),
      see(
        'Where you are',
        'The breadcrumbs show the path back. Select any part to go up a level.',
        css('nav[aria-label="Breadcrumb"]'),
      ),
      see(
        'Your account',
        'Your name and role. Open it for the theme, table density and sign-out.',
        css('[popovertarget="user-menu"]'),
      ),
    ],
  },
  {
    id: 'search-everything',
    group: 'start',
    title: 'Search with Ctrl K',
    summary: 'Find a client, finding, action, evidence file or law in one box.',
    capability: 'client.view',
    keywords: ['search', 'find', 'ctrl k', 'command palette', 'lookup', 'jump'],
    persona: 'staff',
    steps: [
      see(
        'The search button',
        'Search is on every page. Press Ctrl K (or /) from anywhere, or select this button.',
        button('Search clients, findings, questions'),
        { at: '/' },
      ),
      click(
        'Open search',
        'It searches the clients you can open and the knowledge base.',
        button('Search clients, findings, questions'),
      ),
      enter(
        'Type what you are looking for',
        'A code, a title or a word: FND-, consent, Rule 7, a client name.',
        css('dialog input'),
        'consent',
      ),
      see(
        'Pick a result',
        'Use the arrow keys and Enter, or select a result. "All results" opens the full search page.',
        css('dialog [role="listbox"]'),
      ),
      act('Close search', 'Escape closes it.', css('dialog input'), { press: 'Escape' }),
    ],
  },
  {
    id: 'display-settings',
    group: 'start',
    title: 'Change the theme and table density',
    summary: 'Light, dark or high contrast, and compact tables.',
    capability: 'client.view',
    keywords: [
      'theme',
      'dark mode',
      'contrast',
      'density',
      'compact',
      'settings',
      'sign out',
      'logout',
    ],
    persona: 'staff',
    steps: [
      click(
        'Open your account menu',
        'The menu at the bottom of the sidebar holds your display settings.',
        css('[popovertarget="user-menu"]'),
        { at: '/' },
      ),
      see(
        'Theme',
        'Match the system, light, dark or high contrast. Your choice is remembered on this browser.',
        css('#user-menu fieldset:has-text("Theme")'),
      ),
      see(
        'Table density',
        'Compact fits more rows on the screen.',
        css('#user-menu fieldset:has-text("Table density")'),
      ),
      see(
        'Sign out',
        'Signs you out of DUATF on this browser.',
        css('#user-menu button:has-text("Sign out")'),
      ),
      act('Close the menu', 'Escape closes the menu.', css('[popovertarget="user-menu"]'), {
        press: 'Escape',
      }),
    ],
  },
  {
    id: 'hands-on-role',
    group: 'start',
    title: 'Give yourself a hands-on role',
    summary:
      'A firm administrator manages; a lead auditor answers, reviews and rates. You can hold both.',
    capability: 'platform.admin',
    keywords: ['role', 'lead auditor', 'permission', 'access', 'staff', 'my account', 'cannot'],
    persona: 'staff',
    steps: [
      see(
        'Why',
        'The firm administrator role manages staff and clients but cannot answer, review, rate risks or plan actions. Adding the lead auditor role to your own account lets you do the assessment work too.',
        side('/admin/staff'),
        { at: '/' },
      ),
      click('Open Staff', 'Staff lists ComplyX people and their roles.', side('/admin/staff')),
      see(
        'Invite a staff member',
        'Inviting an existing person adds the role to their account; nothing is duplicated.',
        region('Invite a staff member'),
        { at: '/admin/staff' },
      ),
      choose(
        'Choose the role',
        'Pick Lead auditor. Leave the client as "All clients" for firm-wide access.',
        within(region('Invite a staff member'), { role: 'combobox', name: 'Role' }),
        'Lead auditor',
      ),
      yours(
        'Your turn',
        'Type your own name and sign-in email, then press "Invite staff member". The new role works on your next page.',
        field('Work email'),
        'Type your own name and email, then press Invite staff member. Or press Skip to leave it.',
      ),
    ],
  },

  // Clients -------------------------------------------------------------------------------------
  {
    id: 'onboard-client',
    group: 'clients',
    title: 'Onboard a client',
    summary: 'Record the organisation, whether the DPDP Act applies and the assessment period.',
    capability: 'client.create',
    keywords: ['new client', 'create client', 'add organisation', 'onboarding', 'register'],
    persona: 'staff',
    steps: [
      click(
        'Start from Clients',
        'New clients are onboarded from the Clients page.',
        side('/clients'),
        { at: '/' },
      ),
      click('Onboard client', 'Opens the onboarding form.', link('Onboard client'), {
        at: '/clients',
      }),
      enter(
        'Organisation name',
        'The name people use. This example uses a practice client.',
        field('Organisation name'),
        'Practice Clinic',
      ),
      enter(
        'Legal name',
        'As registered with the Registrar of Companies.',
        field('Legal name'),
        'Practice Clinic Private Limited',
      ),
      see(
        'Client ID',
        'Leave it blank and DUATF makes one from the name; it appears in every record code.',
        field('Client ID'),
      ),
      act('Organisation type', 'The legal form of the organisation.', field('Organisation type'), {
        selectFirst: true,
      }),
      enter('Industry', 'In your own words.', field('Industry'), 'Clinic'),
      choose(
        'Sector overlay',
        'Links the client to its sector laws and retention periods in the knowledge base.',
        field('Sector overlay'),
        'Healthcare',
      ),
      enter(
        'Primary contact',
        'Who ComplyX works with day to day.',
        field('Primary contact name'),
        'Asha Rao',
      ),
      enter(
        'Their email',
        'Use the real address for a real client.',
        field('Primary contact email'),
        'asha.rao@practice-clinic.example',
      ),
      see(
        'Applicability',
        'Whether the DPDP Act applies, and why, in the applicability note. "Under review" is fine to start.',
        field('DPDP Act applicability'),
      ),
      yours(
        'Your turn',
        'Press "Onboard client" to create it, or Skip to leave without saving. A practice client can be set to Archived later.',
        button('Onboard client'),
        'Press Onboard client to save it, or Skip.',
        '/clients/new',
      ),
    ],
  },
  {
    id: 'client-overview',
    group: 'clients',
    title: "Read a client's overview",
    summary: 'Posture with its working, what needs attention, risks and departments.',
    capability: 'client.view',
    keywords: ['client dashboard', 'posture', 'compliance score', 'status', 'summary'],
    persona: 'staff',
    steps: [
      see(
        'The client header',
        'Status, whether the DPDP Act applies, the organisation type and place.',
        css('main h1'),
        { at: CLIENT },
      ),
      see(
        'Needs your attention',
        'The work waiting on you at this client, each with a link to it.',
        heading('Needs your attention'),
      ),
      see(
        'Compliance posture',
        'The posture with its working: points, what is scored and what is left out. It is never a "compliant" verdict.',
        css('main section:has-text("posture")'),
        { optional: true },
      ),
      see(
        'Requirement areas',
        'Posture by domain of the latest assessment.',
        heading('Requirement areas'),
        { optional: true },
      ),
      see(
        'Risk picture',
        'Open risks by rating, with a link to the register.',
        heading('Risk picture'),
        { optional: true },
      ),
      see(
        'By department',
        'Progress and gaps per department. Open one for its own dashboard.',
        heading('By department'),
        { optional: true },
      ),
    ],
  },
  {
    id: 'edit-client',
    group: 'clients',
    title: "Edit a client's profile",
    summary: 'Contacts, sector overlay, applicability and the assessment period.',
    capability: 'client.edit',
    keywords: [
      'change client',
      'update profile',
      'contacts',
      'dpo details',
      'archive client',
      'status',
    ],
    persona: 'staff',
    steps: [
      click('Edit profile', "On the client's overview.", link('Edit profile'), { at: CLIENT }),
      see(
        'Change what you need',
        'The same fields as onboarding; the Client ID cannot change.',
        field('Organisation name'),
      ),
      see(
        'Client status',
        'Onboarding, active, or archived when the engagement ends.',
        field('Client status'),
      ),
      yours(
        'Your turn',
        'Press "Save changes" to keep your edits, or Skip.',
        button('Save changes'),
        'Save changes or Skip.',
        '/edit',
      ),
    ],
  },

  // Departments and people ---------------------------------------------------------------------
  {
    id: 'add-department',
    group: 'organisation',
    title: 'Add a department',
    summary: 'Departments answer the questions assigned to them.',
    capability: 'department.manage',
    keywords: ['department', 'team', 'business unit', 'hr', 'it', 'create department'],
    persona: 'staff',
    steps: [
      toSection('departments', 'Departments', 'Departments of the client, with their heads.'),
      see('Add a department', 'At the foot of the page.', region('Add a department'), {
        at: `${CLIENT}/departments`,
      }),
      enter(
        'Code',
        'Short, like HR, IT or FIN. It appears in record codes.',
        within(region('Add a department'), { role: 'textbox', name: 'Code' }),
        'PRAC',
      ),
      enter('Name', "The department's name.", field('Department name'), 'Practice department'),
      enter(
        'What it does with personal data',
        'One or two lines.',
        field('What the department does with personal data'),
        'Holds practice records used in the DUATF playbook.',
      ),
      yours(
        'Your turn',
        'Press "Add department", or Skip.',
        button('Add department'),
        'Add the department, or Skip.',
      ),
    ],
  },
  {
    id: 'department-active',
    group: 'organisation',
    title: 'Deactivate or reactivate a department',
    summary: 'Inactive departments keep their history but get no new work.',
    capability: 'department.manage',
    keywords: ['deactivate', 'disable department', 'reactivate', 'close department'],
    persona: 'staff',
    steps: [
      toSection('departments', 'Departments', 'Each row has its status.'),
      see(
        'Deactivate',
        'Stops new questions and actions going to that department. Reactivate brings it back.',
        css('main button:has-text("activate")'),
        { at: `${CLIENT}/departments` },
      ),
    ],
  },
  {
    id: 'invite-client-user',
    group: 'organisation',
    title: 'Invite someone from the client',
    summary: 'A DPO, a department owner or a viewer gets their own sign-in.',
    capability: 'user.invite',
    keywords: [
      'invite',
      'add user',
      'client user',
      'dpo',
      'department owner',
      'viewer',
      'login',
      'account',
    ],
    persona: 'staff',
    steps: [
      toSection('people', 'People', "The client's people and the ComplyX team on the engagement."),
      open(
        'What each role can do',
        'Read this once: DPO, department owner and viewer.',
        'What each client role can do',
        { at: `${CLIENT}/people` },
      ),
      see(
        'Invite someone',
        'DUATF creates their sign-in and shows a one-time password once.',
        heading('Invite someone from'),
      ),
      enter(
        'Name',
        'Their full name.',
        within(css('main section:has(h2:has-text("Invite someone"))'), {
          role: 'textbox',
          name: 'Name',
        }),
        'Practice Person',
      ),
      enter(
        'Work email',
        'They sign in with this address.',
        within(css('main section:has(h2:has-text("Invite someone"))'), {
          role: 'textbox',
          name: 'Work email',
        }),
        'practice.person@practice-clinic.example',
      ),
      choose(
        'Role',
        'A department owner answers for one department; pick it in the next field.',
        within(css('main section:has(h2:has-text("Invite someone"))'), {
          role: 'combobox',
          name: 'Role',
        }),
        'Department owner',
      ),
      yours(
        'Your turn',
        'Press "Invite", copy the one-time password and give it to them. At first sign-in they choose a password and set up an authenticator app.',
        button('Invite', true),
        'Invite them, or Skip.',
      ),
    ],
  },
  {
    id: 'assign-staff',
    group: 'organisation',
    title: 'Put a ComplyX auditor on a client',
    summary: 'Give an auditor or lead auditor access to one client.',
    capability: 'client.assign_staff',
    keywords: ['assign auditor', 'team', 'engagement team', 'staff access', 'add to team'],
    persona: 'staff',
    steps: [
      toSection('people', 'People', "The ComplyX team is listed under the client's people."),
      see(
        'ComplyX team',
        'Firm-wide staff can already see every client; this adds someone to this client only.',
        heading('ComplyX team'),
        { at: `${CLIENT}/people` },
      ),
      act('Choose the person', 'Pick a member of ComplyX staff.', field('ComplyX staff member'), {
        selectFirst: true,
      }),
      yours(
        'Your turn',
        'Press "Add to team", or Skip.',
        button('Add to team'),
        'Add them, or Skip.',
      ),
    ],
  },
  {
    id: 'manage-accounts',
    group: 'organisation',
    title: 'Reset a password or disable an account',
    summary: 'New one-time password, disable, enable, or remove a role.',
    capability: 'user.invite',
    keywords: [
      'reset password',
      'one time password',
      'otp',
      'disable user',
      'remove role',
      'locked out',
    ],
    persona: 'staff',
    steps: [
      toSection('people', 'People', "Each person's row has the account buttons."),
      see(
        'New one-time password',
        'Their current password stops working; they set a new one at next sign-in.',
        css('main button:has-text("New one-time password")'),
        { at: `${CLIENT}/people`, optional: true },
      ),
      see(
        'Disable',
        'Signs them out at once and stops sign-in. Enable brings the account back.',
        css('main button:has-text("Disable")'),
        { optional: true },
      ),
      see(
        'Remove a role',
        'Takes away one role and keeps the account.',
        css('main button:has-text("Remove")'),
        { optional: true },
      ),
    ],
  },

  // Assessments ---------------------------------------------------------------------------------
  {
    id: 'start-assessment',
    group: 'assessments',
    title: 'Start an assessment',
    summary: 'A new assessment asks every question of the current knowledge base release.',
    capability: 'assessment.create',
    keywords: ['new assessment', 'create assessment', 'audit', 'cycle', 'questionnaire'],
    persona: 'staff',
    steps: [
      toSection('assessments', 'Assessments', 'Every assessment of this client.'),
      see(
        'Start an assessment',
        'At the foot of the page. The title is filled in for you.',
        region('Start an assessment'),
        { at: `${CLIENT}/assessments` },
      ),
      see(
        'Period and due date',
        'The period the assessment covers and when answers are due.',
        field('Due'),
      ),
      yours(
        'Your turn',
        'Press "Start assessment", or Skip. Questions are then assigned to departments.',
        button('Start assessment'),
        'Start it, or Skip.',
      ),
    ],
  },
  {
    id: 'assign-questions',
    group: 'assessments',
    title: 'Assign questions to a department',
    summary: 'A whole domain at once, or one question at a time.',
    capability: 'assessment.assign',
    keywords: ['assign', 'allocate', 'delegate', 'domain', 'department', 'owner'],
    persona: 'staff',
    steps: [
      toSection('assessments', 'Assessments', 'Open the assessment you are working on.'),
      openAssessment,
      see(
        'Progress',
        'Answered, accepted and open questions, by domain and by department.',
        css('main section[aria-label="Progress"]'),
      ),
      see(
        'Assign questions',
        'Pick a domain and a department.',
        region('Assign questions to a department'),
        { optional: true },
      ),
      act(
        'Domain',
        'All questions of the domain go to the department.',
        within(region('Assign questions to a department'), { role: 'combobox', name: 'Domain' }),
        { selectFirst: true },
        { optional: true },
      ),
      yours(
        'Your turn',
        'Choose the department and press "Assign domain", or Skip. One question can also be assigned on its own page.',
        button('Assign domain'),
        'Assign the domain, or Skip.',
      ),
    ],
  },
  {
    id: 'filter-questions',
    group: 'assessments',
    title: 'Find questions with filters',
    summary: 'By domain, department, outcome or review state.',
    capability: 'assessment.view',
    keywords: ['filter', 'unanswered', 'not reviewed', 'gaps', 'find question', 'list'],
    persona: 'staff',
    steps: [
      toSection('assessments', 'Assessments', 'Open the assessment.'),
      openAssessment,
      see('Filters', 'Narrow the question list.', css('main form[role="search"]')),
      choose(
        'Review state',
        'For example the answers nobody has reviewed yet.',
        within(css('main form[role="search"]'), { role: 'combobox', name: 'Review' }),
        'Answered, not reviewed',
      ),
      click(
        'Apply',
        'The list updates; the address keeps the filters so you can share it.',
        button('Apply filters'),
      ),
      see(
        'The questions',
        'Each row shows the department, the outcome and the review state.',
        css('main table'),
        { optional: true },
      ),
    ],
  },
  {
    id: 'answer-question',
    group: 'assessments',
    title: 'Answer a question',
    summary: 'Yes, Partial, No or Not applicable, with notes for the reviewer.',
    capability: 'assessment.answer',
    keywords: ['answer', 'respond', 'yes no partial', 'not applicable', 'questionnaire', 'fill'],
    persona: 'staff',
    steps: [
      toSection('assessments', 'Assessments', 'Open the assessment.'),
      openAssessment,
      openQuestion,
      see(
        'What this checks',
        'The guidance beside the answer: what the audit team tests, the evidence to provide and the fix.',
        heading('What this checks'),
      ),
      act(
        'Choose an answer',
        'Yes counts once its evidence is accepted. Partial and No raise a finding. Not applicable needs a reason.',
        css('input[name="answer"][value="partial"]'),
        { check: true },
        { optional: true },
      ),
      enter(
        'Notes for the reviewer',
        'What is in place, where the evidence is, and what is missing.',
        field('Notes for the reviewer'),
        'Policy exists but is not yet approved by the board.',
        { optional: true },
      ),
      yours(
        'Your turn',
        'Press "Save answer", or Skip to leave the question unchanged.',
        button('Save answer'),
        'Save the answer, or Skip.',
      ),
    ],
  },
  {
    id: 'review-answer',
    group: 'assessments',
    title: 'Review an answer',
    summary: 'Accept it, or send it back with a note.',
    capability: 'assessment.review',
    keywords: ['review', 'approve', 'accept answer', 'send back', 'return', 'qa'],
    persona: 'staff',
    steps: [
      toSection('assessments', 'Assessments', 'Open the assessment.'),
      openAssessment,
      choose(
        'Show answers to review',
        'The review filter finds answers nobody has reviewed yet.',
        within(css('main form[role="search"]'), { role: 'combobox', name: 'Review' }),
        'Answered, not reviewed',
      ),
      click('Apply', 'Only those questions are listed now.', button('Apply filters')),
      openQuestion,
      see(
        'Review this answer',
        'You cannot review your own answer: someone else must.',
        region('Review this answer'),
        { optional: true },
      ),
      enter(
        'Review note',
        'Required when sending an answer back.',
        field('Review note'),
        'Please attach the approved policy.',
        { optional: true },
      ),
      yours(
        'Your turn',
        'Press "Accept", or "Send back" with the note. Or Skip.',
        button('Accept', true),
        'Accept or send back, or Skip.',
      ),
    ],
  },
  {
    id: 'assessment-stages',
    group: 'assessments',
    title: 'Move an assessment through its stages',
    summary: 'Draft, in progress, in review, completed.',
    capability: 'assessment.assign',
    keywords: ['submit for review', 'complete assessment', 'reopen', 'status', 'stage', 'workflow'],
    persona: 'staff',
    steps: [
      toSection('assessments', 'Assessments', 'Open the assessment.'),
      openAssessment,
      see(
        'The stage buttons',
        'Start, Submit for review (when every question is answered), Complete (when every answer is accepted) and Reopen. Only the next steps you may take are shown.',
        css('main header form, main h1'),
        { optional: true },
      ),
    ],
  },
  {
    id: 'reassess',
    group: 'assessments',
    title: 'Start the next cycle',
    summary: 'A re-assessment of a completed assessment carries findings forward.',
    capability: 'assessment.create',
    keywords: ['re-assessment', 'reassess', 'next year', 'repeat', 'cycle', 'follow up'],
    persona: 'staff',
    steps: [
      toSection('assessments', 'Assessments', 'Find a completed assessment.'),
      click(
        'Open a completed assessment',
        'Completed assessments are locked; the next cycle starts from them.',
        css('main tr:has-text("Completed") a[href*="/assessments/ASM-"]'),
        { at: `${CLIENT}/assessments` },
      ),
      see(
        'Next cycle',
        'Same departments per question; earlier answers are shown beside each question; open findings are resolved or carried forward as answers come in.',
        region('Next cycle'),
        { optional: true },
      ),
      yours(
        'Your turn',
        'Press "Start next cycle", or Skip.',
        button('Start next cycle'),
        'Start it, or Skip.',
      ),
    ],
  },
  {
    id: 'legal-reference',
    group: 'assessments',
    title: 'Read the law behind a question',
    summary: 'The Act or Rule, when it applies, and the penalty tier.',
    capability: 'assessment.view',
    keywords: ['law', 'section', 'rule', 'citation', 'legal reference', 'penalty', 'in force'],
    persona: 'staff',
    steps: [
      toSection('assessments', 'Assessments', 'Open the assessment.'),
      openAssessment,
      openQuestion,
      open(
        'Legal reference',
        'Each obligation behind the question: its Act section or Rule, whether it is in force or when it starts, and the penalty tier.',
        'Legal reference',
      ),
      see(
        'Official texts',
        "Links go to MeitY's official texts.",
        css('details[open]:has(summary:has-text("Legal reference"))'),
      ),
      see(
        'In the knowledge base',
        'Opens the question with all its links.',
        css('main a[href*="/knowledge-base"]', 0),
        { optional: true },
      ),
    ],
  },

  // Evidence ------------------------------------------------------------------------------------
  {
    id: 'upload-evidence',
    group: 'evidence',
    title: 'Upload evidence for a question',
    summary: 'A file, a title and an expiry date, linked to the question.',
    capability: 'evidence.upload',
    keywords: ['upload', 'attach', 'file', 'document', 'proof', 'evidence'],
    persona: 'staff',
    steps: [
      toSection('assessments', 'Assessments', 'Evidence is added on the question it supports.'),
      openAssessment,
      openQuestion,
      open('Add evidence', 'Opens the upload form.', 'Add evidence'),
      act(
        'Choose a file',
        'PDF, image, Office, CSV or text, up to 20 MB. The guide attaches a small practice file.',
        css('input[type="file"][name="file"]'),
        {
          attach: {
            name: 'practice-evidence.txt',
            text: 'Practice evidence uploaded from the DUATF playbook.',
          },
        },
      ),
      enter(
        'Title',
        'What the file is, e.g. "Board-approved privacy policy v3".',
        css('form:has(input[type="file"]) input[name="title"]'),
        'Practice evidence',
      ),
      see(
        'Valid until',
        'For certificates and reports that expire. Expired files are flagged.',
        css('form:has(input[type="file"]) input[name="validUntil"]'),
      ),
      yours(
        'Your turn',
        'Press "Upload" to store it with its SHA-256 fingerprint, or Skip.',
        button('Upload', true),
        'Upload it, or Skip.',
      ),
    ],
  },
  {
    id: 'link-evidence',
    group: 'evidence',
    title: 'Reuse evidence already uploaded',
    summary: 'One file can support several questions.',
    capability: 'evidence.upload',
    keywords: ['link evidence', 'reuse', 'existing file', 'attach existing'],
    persona: 'staff',
    steps: [
      toSection('assessments', 'Assessments', 'Open the question that needs the file.'),
      openAssessment,
      openQuestion,
      open('Add evidence', 'Below the upload form.', 'Add evidence'),
      see(
        'Use evidence already uploaded',
        "Pick a file from the client's evidence and press Link.",
        field('Use evidence already uploaded'),
        { optional: true },
      ),
      yours(
        'Your turn',
        'Choose a file and press "Link", or Skip.',
        button('Link', true),
        'Link a file, or Skip.',
      ),
    ],
  },
  {
    id: 'evidence-library',
    group: 'evidence',
    title: 'Browse the evidence library',
    summary: 'Every file of a client, by status, with search.',
    capability: 'evidence.view',
    keywords: ['evidence list', 'files', 'documents', 'library', 'repository', 'expired'],
    persona: 'staff',
    steps: [
      toSection('evidence', 'Evidence', 'Every file of the client.'),
      see(
        'By status',
        'All, pending review, accepted, rejected; each tab shows its count.',
        css('main nav[aria-label="Evidence by status"]'),
        { at: `${CLIENT}/evidence` },
      ),
      enter('Search', 'By title, file name or code.', field('Search evidence'), 'policy'),
      click(
        'Search',
        'The tab and the search combine.',
        within(css('main form[role="search"]'), { role: 'button', name: 'Search' }),
      ),
      open(
        'Upload without a question',
        'Files can also be added here and linked later.',
        'Upload evidence without a question',
        { optional: true },
      ),
    ],
  },
  {
    id: 'review-evidence',
    group: 'evidence',
    title: 'Accept or reject evidence',
    summary: 'Another auditor checks each file before it counts.',
    capability: 'evidence.review',
    keywords: ['review evidence', 'approve file', 'reject', 'accept evidence', 'pending'],
    persona: 'staff',
    steps: [
      toSection('evidence', 'Evidence', 'Files waiting for review are under their own tab.'),
      click(
        'Pending review',
        'Files nobody has reviewed yet.',
        css('main nav[aria-label="Evidence by status"] a[href*="status=pending_review"]'),
        { at: `${CLIENT}/evidence` },
      ),
      click(
        'Open a file',
        'Its fingerprint, who uploaded it and what it is used for.',
        firstLink('/evidence/EVD-'),
      ),
      see(
        'Review this evidence',
        'You cannot review a file you uploaded.',
        region('Review this evidence'),
        { optional: true },
      ),
      yours(
        'Your turn',
        'Press "Accept evidence", or "Reject" with a note saying what is missing. Or Skip.',
        button('Accept evidence'),
        'Accept or reject, or Skip.',
      ),
    ],
  },

  // Findings and risk ---------------------------------------------------------------------------
  {
    id: 'read-finding',
    group: 'findings',
    title: 'Understand a finding',
    summary: 'What was found, the law, the remediation path and the history.',
    capability: 'client.view',
    keywords: ['finding', 'gap', 'issue', 'non compliance', 'potential gap'],
    persona: 'staff',
    steps: [
      toSection(
        'findings',
        'Findings',
        'A No answer raises a gap; a Partial answer a potential gap.',
      ),
      click(
        'Open a finding',
        'Each finding comes from one question.',
        firstLink('/findings/FND-'),
        { at: `${CLIENT}/findings` },
      ),
      see(
        'The remediation path',
        'Six steps from found to closed; the next one is marked.',
        css('main ol'),
        { optional: true },
      ),
      see(
        'What was found',
        'The answer and notes, the recommended action and the law.',
        region('What was found'),
      ),
      open('History', 'When it opened, changed and closed.', 'History'),
    ],
  },
  {
    id: 'findings-without-plan',
    group: 'findings',
    title: 'Find findings with no action planned',
    summary: 'The open findings nobody is fixing yet.',
    capability: 'client.view',
    keywords: ['no plan', 'unplanned', 'without action', 'filter findings', 'open gaps'],
    persona: 'staff',
    steps: [
      toSection('findings', 'Findings', 'Open findings are listed first.'),
      choose(
        'Remediation',
        'Choose "No action planned yet".',
        field('Remediation'),
        'No action planned yet',
        { at: `${CLIENT}/findings` },
      ),
      click('Apply', 'Only findings without an action are left.', button('Apply filters')),
    ],
  },
  {
    id: 'rate-risk',
    group: 'findings',
    title: 'Rate a risk',
    summary: 'Likelihood times impact gives the score and its band.',
    capability: 'risk.manage',
    keywords: ['risk rating', 'likelihood', 'impact', 'score', 'treatment', 'risk owner'],
    persona: 'staff',
    steps: [
      toSection('findings', 'Findings', 'Every finding has a risk.'),
      click('Open a finding', 'Its risk is beside what was found.', firstLink('/findings/FND-'), {
        at: `${CLIENT}/findings`,
      }),
      see(
        'The risk',
        'Its band and score. Likelihood and impact are each 1 to 5.',
        css('main section:has(h2:has-text("Risk RSK"))'),
        { optional: true },
      ),
      act(
        'Likelihood',
        'How likely the harm is.',
        field('Likelihood'),
        { select: '4 Likely' },
        { optional: true },
      ),
      act(
        'Impact',
        'How bad it would be for people and the organisation.',
        field('Impact'),
        { select: '3 Moderate' },
        { optional: true },
      ),
      yours(
        'Your turn',
        'Press "Save rating", or Skip.',
        button('Save rating'),
        'Save the rating, or Skip.',
      ),
    ],
  },
  {
    id: 'accept-risk',
    group: 'findings',
    title: 'Accept a risk on behalf of the client',
    summary: "Only the client's DPO can accept a risk instead of fixing it.",
    capability: 'risk.accept',
    keywords: ['accept risk', 'risk acceptance', 'waiver', 'exception', 'dpo'],
    persona: 'dpo',
    steps: [
      toSection('findings', 'Findings', 'Open the finding whose risk the organisation accepts.'),
      click('Open a finding', 'Its risk is beside what was found.', firstLink('/findings/FND-'), {
        at: `${CLIENT}/findings`,
      }),
      open(
        'Accept this risk',
        'The reason is recorded with your name and the date, and stays in the register and reports.',
        'Accept this risk instead of fixing it',
      ),
      yours(
        'Your turn',
        'Write why, then press "Accept the risk". Or Skip.',
        field('Why the organisation accepts this risk'),
        'Accept it with a reason, or Skip.',
      ),
    ],
  },
  {
    id: 'risk-register',
    group: 'findings',
    title: 'Read the risk register',
    summary: 'All risks with their rating, and the heatmap.',
    capability: 'client.view',
    keywords: ['risk register', 'heatmap', 'risks', 'bands', 'critical', 'high risk'],
    persona: 'staff',
    steps: [
      toSection('risks', 'the Risk register', 'One risk per finding.'),
      see('How risks are rated', 'The bands and what each means.', region('How risks are rated'), {
        at: `${CLIENT}/risks`,
      }),
      see('Open risks', 'The heatmap: likelihood across, impact up.', region('Open risks')),
      see('Filters', 'By status and rating.', css('main form[role="search"]')),
    ],
  },

  // Remediation ---------------------------------------------------------------------------------
  {
    id: 'plan-action',
    group: 'remediation',
    title: 'Plan a remediation action',
    summary: 'An owner, a department and a due date for each fix.',
    capability: 'action.manage',
    keywords: ['action plan', 'remediation', 'fix', 'task', 'owner', 'due date', 'plan'],
    persona: 'staff',
    steps: [
      toSection('findings', 'Findings', 'Actions are planned on a finding.'),
      choose(
        'Findings without a plan',
        'Start where nothing is planned yet.',
        field('Remediation'),
        'No action planned yet',
        { at: `${CLIENT}/findings` },
      ),
      click('Apply', 'Only findings without an action are left.', button('Apply filters')),
      click(
        'Open a finding',
        'Its remediation section is at the foot of the page.',
        firstLink('/findings/FND-'),
      ),
      open('Plan an action', 'Starts from the recommended action.', 'Plan an action'),
      act('Owner', 'Who does the work.', field('Owner'), { selectFirst: true }, { optional: true }),
      see(
        'Due',
        "When it must be done. Overdue actions show on everyone's attention list.",
        field('Due'),
      ),
      yours(
        'Your turn',
        'Press "Plan action", or Skip.',
        button('Plan action'),
        'Plan it, or Skip.',
      ),
    ],
  },
  {
    id: 'work-action',
    group: 'remediation',
    title: 'Move an action forward',
    summary: 'The owner starts work, adds evidence and submits it for review.',
    capability: 'action.update',
    keywords: ['start work', 'submit for review', 'progress', 'update action', 'status'],
    persona: 'staff',
    steps: [
      toSection('actions', 'Remediation', 'Every action of the client.'),
      click(
        'Open an action',
        'One that is not finished yet; its next step is at the top.',
        css(
          'main tr:not(:has-text("Closed")):not(:has-text("Remediated")):not(:has-text("Accepted risk")) a[href*="/actions/REM-"]',
        ),
        { at: `${CLIENT}/actions` },
      ),
      see(
        'Next step',
        'Only the moves you may make are offered: start work, wait for evidence, submit for review.',
        region('Next step'),
        { optional: true },
      ),
      see(
        'Evidence of the fix',
        'Needed before review; one file must be accepted before the action can be verified.',
        region('Evidence of the fix'),
      ),
      see('History', 'Every move, by whom and when, with notes.', region('History')),
    ],
  },
  {
    id: 'verify-action',
    group: 'remediation',
    title: 'Verify and close an action',
    summary: 'An auditor other than the owner checks the fix.',
    capability: 'action.verify',
    keywords: ['verify', 'close action', 'remediated', 'reject action', 'sign off'],
    persona: 'staff',
    steps: [
      toSection(
        'actions',
        'Remediation',
        'Actions waiting for verification have their own filter.',
      ),
      choose(
        'Show actions to verify',
        'Under review, or remediated and ready to close.',
        field('Show'),
        'Ready to verify or close',
        { at: `${CLIENT}/actions` },
      ),
      click('Apply', 'Only actions waiting for you are left.', button('Apply filters')),
      click('Open an action', 'Check its evidence first.', firstLink('/actions/REM-'), {
        optional: true,
      }),
      yours(
        'Your turn',
        'Press "Verify as remediated" or "Reject" with a note; a remediated action is then closed. Or Skip.',
        region('Next step'),
        'Verify, reject or close, or Skip.',
      ),
    ],
  },
  {
    id: 'overdue-actions',
    group: 'remediation',
    title: 'See what is overdue',
    summary: 'Actions past their due date, and your own actions.',
    capability: 'client.view',
    keywords: ['overdue', 'late', 'due', 'my actions', 'deadline'],
    persona: 'staff',
    steps: [
      toSection('actions', 'Remediation', 'The Show filter picks a view.'),
      choose(
        'Overdue',
        'Actions past their due date that are not finished.',
        field('Show'),
        'Overdue',
        { at: `${CLIENT}/actions` },
      ),
      click('Apply', 'The list updates.', button('Apply filters')),
    ],
  },

  // Dashboards and reports ----------------------------------------------------------------------
  {
    id: 'attention',
    group: 'reporting',
    title: 'Use "Needs your attention"',
    summary: 'Your work across clients, each line a link to it.',
    capability: 'client.view',
    keywords: ['to do', 'todo', 'tasks', 'attention', 'inbox', 'work list', 'dashboard'],
    persona: 'staff',
    steps: [
      see(
        'Needs your attention',
        'Overdue actions, answers to review, evidence waiting, risks with no plan: only what your role can act on.',
        heading('Needs your attention'),
        { at: '/' },
      ),
      see(
        'Across all clients',
        'The headline figures; select one to open the list behind it.',
        css('main dl'),
        { optional: true },
      ),
      see(
        'Clients',
        "Each client's latest assessment, posture, open gaps, serious risks and actions.",
        heading('Clients'),
      ),
    ],
  },
  {
    id: 'department-dashboard',
    group: 'reporting',
    title: "Open a department's dashboard",
    summary: "One department's answers, findings, risks, actions and evidence.",
    capability: 'client.view',
    keywords: ['department dashboard', 'team view', 'department report'],
    persona: 'staff',
    steps: [
      toSection('departments', 'Departments', 'Open a department.'),
      click('Open a department', 'Its own dashboard.', firstLink('/departments/'), {
        at: `${CLIENT}/departments`,
      }),
      see('Requirement areas', 'Its posture by domain.', heading('Requirement areas'), {
        optional: true,
      }),
      see('Open findings', 'What is still open for this department.', heading('Open findings'), {
        optional: true,
      }),
    ],
  },
  {
    id: 'executive-report',
    group: 'reporting',
    title: 'Print the executive report as PDF',
    summary: 'A management summary of one assessment.',
    capability: 'report.view',
    keywords: ['report', 'pdf', 'print', 'executive summary', 'management report', 'board'],
    persona: 'staff',
    steps: [
      toSection('reports', 'Reports', 'Every report comes from the live records.'),
      click('Open the report', 'Choose the assessment.', link('Open report'), {
        at: `${CLIENT}/reports`,
      }),
      see(
        'Print or save as PDF',
        'Use the browser\'s print dialog; choose "Save as PDF" as the printer.',
        button('Print or save as PDF'),
      ),
    ],
  },
  {
    id: 'workbooks',
    group: 'reporting',
    title: 'Download an Excel workbook',
    summary: 'Client, department and overall workbooks, each opening on a dashboard sheet.',
    capability: 'report.export',
    keywords: ['excel', 'xlsx', 'download', 'workbook', 'export', 'spreadsheet'],
    persona: 'staff',
    steps: [
      toSection('reports', 'Reports', 'The workbooks are on the reports page.'),
      see(
        'Compliance workbook',
        "The client's dashboard sheet, departments, risk register, findings, actions and answers.",
        region('Compliance workbook'),
        { at: `${CLIENT}/reports` },
      ),
      see('Department workbooks', 'One file per department.', region('Department workbooks'), {
        optional: true,
      }),
      see(
        'Overall workbook',
        'For all your clients, from the overview page: "Download overall workbook".',
        side('/'),
      ),
      yours(
        'Your turn',
        'Press "Download compliance workbook" to save the file, or Skip.',
        link('Download compliance workbook'),
        'Download it, or Skip.',
      ),
    ],
  },

  // Knowledge base ------------------------------------------------------------------------------
  {
    id: 'explore-kb',
    group: 'knowledge',
    title: 'Explore the knowledge base',
    summary: 'The law, obligations, controls, questions and reference lists.',
    capability: 'kb.view',
    keywords: ['knowledge base', 'library', 'law', 'obligations', 'controls', 'dpdp act', 'rules'],
    persona: 'staff',
    steps: [
      click('Open the knowledge base', 'In the sidebar under Library.', side('/knowledge-base'), {
        at: '/',
      }),
      see(
        'Obligations in force',
        'How many obligations apply today and when the rest start.',
        heading('Obligations in force'),
        { at: '/knowledge-base' },
      ),
      see(
        'Sections',
        'The law, lawful bases, obligations, controls, questions, domains and the reference lists.',
        css('nav[aria-label="Knowledge base sections"]'),
      ),
      click(
        'Obligations',
        'Every obligation with its citation, start date and penalty.',
        within(css('nav[aria-label="Knowledge base sections"]'), {
          role: 'link',
          name: 'Obligations',
          exact: true,
        }),
      ),
      click(
        'Open one',
        'Its requirement, controls, linked law and the processes that trigger it.',
        css('main a[href*="section=obligations&item="]'),
      ),
    ],
  },
  {
    id: 'kb-citation',
    group: 'knowledge',
    title: 'Look up a section or rule',
    summary: 'Type a citation such as Rule 7 or s.8(6).',
    capability: 'kb.view',
    keywords: ['citation', 'section', 'rule', 'lookup', 'search law', 'schedule'],
    persona: 'staff',
    steps: [
      enter(
        'Search the knowledge base',
        'Citations, codes or words.',
        { role: 'searchbox', name: 'Search the knowledge base' },
        'Rule 7',
        { at: '/knowledge-base' },
      ),
      click(
        'Search',
        'Results are grouped: law, obligations, controls, questions, processes.',
        within(css('form[role="search"]'), { role: 'button', name: 'Search' }),
      ),
      see('Results', 'Open any result for the full text and links.', css('main h1, main h2'), {
        optional: true,
      }),
    ],
  },
  {
    id: 'kb-draft',
    group: 'knowledge',
    title: 'Add or change a knowledge base entry',
    summary: 'Edits go into a draft release; nothing changes for clients until it is published.',
    capability: 'kb.edit',
    keywords: [
      'edit knowledge base',
      'add process',
      'data element',
      'vocabulary',
      'lawful basis',
      'sector',
      'playbook',
      'draft',
    ],
    persona: 'staff',
    steps: [
      see(
        'The release bar',
        'Editors see which release they are reading, and the open draft.',
        css('section[aria-label="Knowledge base release"]'),
        { at: '/knowledge-base' },
      ),
      click(
        'Show the draft',
        'The draft view adds Add and Edit buttons to the reference sections.',
        button('Show draft'),
        { optional: true },
      ),
      click(
        'Process catalogue',
        'One of the six editable sections.',
        within(css('nav[aria-label="Knowledge base sections"]'), {
          role: 'link',
          name: 'Process catalogue',
        }),
      ),
      click('Add process template', 'Start a new entry.', link('Add process template'), {
        optional: true,
      }),
      click(
        'Pick the sector',
        'The code is suggested for you.',
        css('main a[href*="prefix=HLT"]'),
        { optional: true },
      ),
      enter('Process', 'Name the process.', field('Process'), 'Practice process', {
        optional: true,
      }),
      see(
        'Suggest obligations',
        'Tick the usual lawful basis and the facts, then "Suggest obligations" ticks what they trigger.',
        button('Suggest obligations'),
        { optional: true },
      ),
      yours(
        'Your turn',
        'Press "Add to the draft" when it is complete, or Skip. It is marked "awaiting legal review".',
        button('Add to the draft'),
        'Add it, or Skip.',
      ),
    ],
  },
  {
    id: 'kb-publish',
    group: 'knowledge',
    title: 'Review and publish a release',
    summary: 'Mark entries reviewed, then publish the draft.',
    capability: 'kb.publish',
    keywords: ['publish release', 'legal review', 'mark reviewed', 'release', 'version'],
    persona: 'staff',
    steps: [
      click(
        'Review and publish',
        'From the release bar on the knowledge base.',
        link('Review and publish'),
        { at: '/knowledge-base' },
      ),
      see(
        'Awaiting legal review',
        'Every entry added or changed in the draft. AI-drafted entries say so.',
        heading('Awaiting legal review'),
        { optional: true },
      ),
      see(
        'Mark as reviewed',
        'Open an entry to check it and add a note, or mark it reviewed here.',
        css('main button:has-text("Mark as reviewed")'),
        { optional: true },
      ),
      see(
        'Publish',
        'Publishing makes the draft the release new assessments use; the old one is kept.',
        css('main section:has(h2:has-text("Publish release"))'),
        { optional: true },
      ),
      yours(
        'Your turn',
        'Review the entries before you publish. Press "Publish release" when ready, or Skip.',
        css('main button:has-text("Publish release")'),
        'Publish, or Skip.',
      ),
    ],
  },

  // Administration ------------------------------------------------------------------------------
  {
    id: 'invite-staff',
    group: 'admin',
    title: 'Invite ComplyX staff',
    summary: 'Auditors, lead auditors and firm administrators.',
    capability: 'platform.admin',
    keywords: ['staff', 'invite auditor', 'new employee', 'firm user', 'admin'],
    persona: 'staff',
    steps: [
      click('Open Staff', 'Under Administration.', side('/admin/staff'), { at: '/' }),
      see('Staff', 'Each person, their roles, account state and last sign-in.', css('main table'), {
        at: '/admin/staff',
      }),
      see(
        'Invite a staff member',
        'Name, work email, role, and a client or all clients.',
        region('Invite a staff member'),
      ),
      yours(
        'Your turn',
        'Fill it in and press "Invite staff member"; copy the one-time password shown once. Or Skip.',
        button('Invite staff member'),
        'Invite them, or Skip.',
      ),
    ],
  },
  {
    id: 'risk-bands',
    group: 'admin',
    title: 'Change the risk bands',
    summary: 'How likelihood times impact scores are named and coloured.',
    capability: 'platform.admin',
    keywords: ['risk bands', 'risk matrix', 'scoring', 'thresholds', 'colours', 'rating scale'],
    persona: 'staff',
    steps: [
      click('Open Risk bands', 'Under Administration.', side('/admin/risk-bands'), { at: '/' }),
      see(
        'Bands',
        'Each band covers a range of scores from 1 to 25, with a name and a colour. Changes apply to every client.',
        css('main form'),
        { at: '/admin/risk-bands' },
      ),
      yours(
        'Your turn',
        'Press "Save bands" after changing them, or Skip.',
        button('Save bands'),
        'Save, or Skip.',
      ),
    ],
  },
]

const unknownWho = tours.filter((tour) => !WHO[tour.capability]).map((tour) => tour.id)
if (unknownWho.length) throw new Error(`Unknown capability on tours: ${unknownWho.join(', ')}`)

export const TOURS: Tour[] = tours.map((tour) => ({ ...tour, who: WHO[tour.capability] ?? [] }))

export const tourById = (id: string): Tour | undefined => TOURS.find((tour) => tour.id === id)

export const groupTitle = (id: GroupId): string =>
  GROUPS.find((group) => group.id === id)?.title ?? id
