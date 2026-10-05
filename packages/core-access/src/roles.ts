export const FIRM_ROLES = ['firm_admin', 'lead_auditor', 'auditor'] as const
export const CLIENT_ROLES = ['client_dpo', 'department_owner', 'client_viewer'] as const
export const ROLES = [...FIRM_ROLES, ...CLIENT_ROLES] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABEL: Record<Role, string> = {
  firm_admin: 'Administrator',
  lead_auditor: 'Senior auditor',
  auditor: 'Auditor',
  client_dpo: 'Client DPO',
  department_owner: 'Department owner',
  client_viewer: 'Viewer',
}

export const ROLE_DESCRIPTION: Record<Role, string> = {
  firm_admin: 'Manages the ComplyX team, people at clients, all clients and the knowledge base.',
  lead_auditor: 'Runs engagements: onboards clients, adds people, answers, checks, signs off.',
  auditor: 'Answers questions, attaches evidence, records findings, risks and actions.',
  client_dpo: 'The client’s privacy lead: sees everything of the client, uploads, accepts risks.',
  department_owner: 'Sees the questions and evidence requests given to them, and uploads files.',
  client_viewer: 'Read-only access to the client’s dashboard and reports.',
}

export const isFirmRole = (role: Role): boolean => (FIRM_ROLES as readonly string[]).includes(role)
