export {
  ROLES,
  FIRM_ROLES,
  CLIENT_ROLES,
  ROLE_LABEL,
  ROLE_DESCRIPTION,
  isFirmRole,
  type Role,
} from './roles'
export { CAPABILITIES, MATRIX, capabilityScope, type Capability } from './capabilities'
export {
  can,
  authorize,
  accessibleClientIds,
  hasGlobal,
  AccessDeniedError,
  type Principal,
  type Assignment,
  type AccessScope,
} from './can'
export { CAPABILITY_LABEL, describeDenial, type Denial } from './describe'
