import type { ObligationTrigger } from '@duatf/platform-db'

const BASIS: Record<string, string> = {
  consent: 'consent',
  s7a: 's.7(a) voluntary provision',
  s7b: 's.7(b) State benefit or service',
  s7c: 's.7(c) State function',
  s7d: 's.7(d) legal duty to disclose',
  s7e: 's.7(e) court order',
  s7f: 's.7(f) medical emergency',
  s7g: 's.7(g) public health',
  s7h: 's.7(h) disaster or public order',
  s7i: 's.7(i) employment',
  ex17_1a: 'the s.17(1)(a) legal-claims exemption',
  ex17_1b: 'the s.17(1)(b) courts and regulators exemption',
  ex17_1c: 'the s.17(1)(c) crime prevention exemption',
  ex17_1d: 'the s.17(1)(d) foreign-contract exemption',
  ex17_1e: 'the s.17(1)(e) merger scheme exemption',
  ex17_1f: 'the s.17(1)(f) loan default exemption',
  ex17_2a: 'the s.17(2)(a) notified State exemption',
  ex17_2b: 'the s.17(2)(b) research exemption',
  ex17_3: 'a s.17(3) notified exemption',
}

const FLAG: Record<string, string> = {
  children: "children's data is processed",
  pwd: 'a person with disability acts through a guardian',
  processor: 'a Data Processor handles the data',
  cross_border: 'data is stored or accessed outside India',
  third_schedule: 'the entity is in a Third Schedule class',
  decision_or_disclosure: 'the data drives a decision or is disclosed to another fiduciary',
  legacy_data: 'data was collected on consent before commencement',
  online_presence: 'the entity has a website or app',
  consent_manager_used: 'consent can be given through a Consent Manager',
  tracking_ads: 'there is tracking, profiling or targeted advertising',
  marketing: 'promotional messages are sent',
  research: 'the purpose is research, archiving or statistics',
}

const ROLE: Record<string, string> = {
  sdf: 'the entity is a Significant Data Fiduciary',
  consent_manager: 'the entity is a registered Consent Manager',
  state: 'the entity is a State instrumentality',
  data_fiduciary: 'the entity is a Data Fiduciary',
  processor: 'the entity acts as a Data Processor',
}

export const basisLabel = (code: string): string => BASIS[code] ?? code
export const flagLabel = (code: string): string => FLAG[code] ?? code.replaceAll('_', ' ')

const either = (items: string[]): string =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} or ${items.at(-1)}`
const both = (items: string[]): string =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`

/** Plain-English "when does this apply" sentence for an obligation trigger. */
export const describeTrigger = (trigger: ObligationTrigger): string => {
  if (trigger.always) return 'Applies to every in-scope processing activity.'
  const conditions: string[] = []
  if (trigger.role?.length) conditions.push(either(trigger.role.map((role) => ROLE[role] ?? role)))
  if (trigger.basis?.length) {
    conditions.push(`the lawful basis is ${either(trigger.basis.map(basisLabel))}`)
  }
  if (trigger.flags?.length) conditions.push(both(trigger.flags.map(flagLabel)))
  if (conditions.length === 0) return 'No trigger is recorded for this obligation.'
  return `Applies when ${both(conditions)}.`
}
