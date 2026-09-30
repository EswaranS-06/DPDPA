import type { ApplicabilityState, ClientStatus, OrganisationType } from '@duatf/platform-db'

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
