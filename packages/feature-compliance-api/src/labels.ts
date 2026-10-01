import type {
  ActionStatus,
  Answer,
  ApplicabilityState,
  AssessmentStatus,
  ClientStatus,
  ComplianceState,
  OrganisationType,
  ReviewState,
} from '@duatf/platform-db'

export const ORGANISATION_TYPE_LABEL: Record<OrganisationType, string> = {
  private_limited: 'Private limited company',
  public_limited: 'Public limited company',
  llp: 'Limited liability partnership',
  partnership: 'Partnership firm',
  sole_proprietorship: 'Sole proprietorship',
  government: 'Government department or body',
  psu: 'Public sector undertaking',
  trust_society_ngo: 'Trust, society or NGO',
  foreign_company: 'Foreign company (Indian operations)',
  other: 'Other',
}

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  prospect: 'Prospect',
  onboarding: 'Onboarding',
  active: 'Active',
  on_hold: 'On hold',
  closed: 'Closed',
}

export const APPLICABILITY_LABEL: Record<ApplicabilityState, string> = {
  applicable: 'DPDP Act applies',
  not_applicable: 'DPDP Act does not apply',
  under_review: 'Applicability under review',
}

/** States and Union Territories of India, for the client address. */
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
] as const

export const ASSESSMENT_STATUS_LABEL: Record<AssessmentStatus, string> = {
  draft: 'Draft',
  in_progress: 'In progress',
  in_review: 'In review',
  completed: 'Completed',
}

export const ANSWER_LABEL: Record<Answer, string> = {
  yes: 'Yes',
  partial: 'Partial',
  no: 'No',
  not_applicable: 'Not applicable',
  not_assessed: 'Not assessed',
}

export const COMPLIANCE_LABEL: Record<ComplianceState, string> = {
  compliant: 'Compliant',
  potential_gap: 'Potential gap',
  gap: 'Gap',
  excluded: 'Not applicable',
  pending: 'Not assessed',
}

export const REVIEW_LABEL: Record<ReviewState, string> = {
  not_reviewed: 'Not reviewed',
  accepted: 'Accepted',
  returned: 'Sent back',
}

export const ACTION_STATUS_LABEL: Record<ActionStatus, string> = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In progress',
  pending_evidence: 'Pending evidence',
  under_review: 'Under review',
  rejected: 'Rejected',
  remediated: 'Remediated',
  closed: 'Closed',
  accepted_risk: 'Accepted risk',
}
