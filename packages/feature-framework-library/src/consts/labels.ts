import type { ChipTone } from '@duatf/core-ui'

export const ACTOR_LABEL: Record<string, string> = {
  data_fiduciary: 'Data Fiduciary',
  any: 'Any entity',
  sdf: 'Significant Data Fiduciary',
  consent_manager: 'Consent Manager',
  data_principal: 'Data Principal',
  state: 'State',
}

/** Act Schedule penalty items, as used by the obligation penalty tiers. */
export const PENALTY: Record<string, { amount: string; basis: string; tone: ChipTone }> = {
  P1: { amount: 'Up to ₹250 crore', basis: 'security safeguards, s.8(5)', tone: 'severe' },
  P2: { amount: 'Up to ₹200 crore', basis: 'breach intimation, s.8(6)', tone: 'neutral' },
  P3: { amount: 'Up to ₹200 crore', basis: "children's data, s.9", tone: 'neutral' },
  P4: {
    amount: 'Up to ₹150 crore',
    basis: 'Significant Data Fiduciary duties, s.10',
    tone: 'neutral',
  },
  P5: { amount: 'Up to ₹10,000', basis: 'Data Principal duties, s.15', tone: 'neutral' },
  P6: {
    amount: 'As for the underlying breach',
    basis: 'voluntary undertaking, s.32',
    tone: 'neutral',
  },
  P7: { amount: 'Up to ₹50 crore', basis: 'any other provision', tone: 'neutral' },
}

export const KIND_LABEL = { section: 'Act sections', rule: 'Rules', schedule: 'Schedules' } as const
export const KIND_SINGULAR = {
  section: 'section of the Act',
  rule: 'rule',
  schedule: 'schedule',
} as const

/** "Section 6", "Rule 7", "Schedule 3" */
export const instrumentName = (kind: keyof typeof KIND_LABEL, number: string) =>
  `${kind === 'section' ? 'Section' : kind === 'rule' ? 'Rule' : 'Schedule'} ${number}`

export const DOC_TYPE_LABEL: Record<string, string> = {
  guide: 'Guide',
  reference: 'Reference',
  regulatory_log: 'Log',
}

export const sentence = (text: string): string =>
  text ? text.charAt(0).toUpperCase() + text.slice(1).replaceAll('_', ' ') : text
