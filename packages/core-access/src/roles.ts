export const FIRM_ROLES = ['firm_admin', 'lead_auditor', 'auditor'] as const
export const CLIENT_ROLES = ['client_dpo', 'department_owner', 'client_viewer'] as const
export const ROLES = [...FIRM_ROLES, ...CLIENT_ROLES] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABEL: Record<Role, string> = {
  firm_admin: 'Firm administrator',
  lead_auditor: 'Lead auditor',
  auditor: 'Auditor',
  client_dpo: 'Client DPO',
  department_owner: 'Department owner',
  client_viewer: 'Viewer',
}

export const ROLE_DESCRIPTION: Record<Role, string> = {
  firm_admin: 'Manages ComplyX staff, all clients and the knowledge base.',
  lead_auditor: 'Runs engagements: onboards clients, opens assessments, signs off findings.',
  auditor: 'Assesses assigned clients: answers, reviews evidence, records findings and risks.',
  client_dpo: 'The client’s privacy lead: manages their people, responds, accepts risks.',
  department_owner: 'Answers questions and uploads evidence for one department.',
  client_viewer: 'Read-only access to the client’s dashboard and reports.',
}

export const isFirmRole = (role: Role): boolean => (FIRM_ROLES as readonly string[]).includes(role)
