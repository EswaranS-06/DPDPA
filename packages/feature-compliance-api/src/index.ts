export {
  inUserScope,
  inClient,
  firmWide,
  type ServiceContext,
  type UserProvisioner,
} from './context'
export { ValidationError, NotFoundError, RuleError, parseInput } from './errors'
export {
  createClient,
  updateClient,
  listClients,
  getClient,
  suggestClientCode,
  clientInputSchema,
  type ClientInput,
  type ClientSummary,
  type ClientDetail,
} from './clients'
export {
  createDepartment,
  updateDepartment,
  setDepartmentActive,
  listDepartments,
  departmentCode,
  type DepartmentInput,
  type DepartmentRow,
} from './departments'
export {
  inviteClientUser,
  inviteFirmStaff,
  assignStaff,
  removeAssignment,
  listClientPeople,
  listFirmStaff,
  resetTemporaryPassword,
  setUserEnabled,
  type InviteResult,
  type Person,
  type PersonAssignment,
} from './people'
export { keycloakProvisioner } from './provisioner'
export {
  ORGANISATION_TYPE_LABEL,
  CLIENT_STATUS_LABEL,
  APPLICABILITY_LABEL,
  INDIAN_STATES,
} from './labels'
