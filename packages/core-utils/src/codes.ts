/** Human-readable DUATF object codes (Graph Modelling Guide), e.g. ACT-ACME-HR-004, FND-ACME-031. */
export type CodePrefix =
  | 'DEP'
  | 'PRC'
  | 'ACT'
  | 'EVT'
  | 'PUR'
  | 'SYS'
  | 'TP'
  | 'FLW'
  | 'NTC'
  | 'RET'
  | 'TST'
  | 'EVD'
  | 'FND'
  | 'REM'
  | 'ASM'
  | 'RSK'

const SEGMENT = /^[A-Z0-9]+$/

/** The counter key shared by every code in one series, e.g. "ACT-ACME-HR". */
export const sequenceScope = (prefix: CodePrefix, ...segments: string[]): string => {
  const parts = segments.map((segment) => segment.trim().toUpperCase())
  const invalid = parts.find((part) => !SEGMENT.test(part))
  if (invalid !== undefined) throw new Error(`Invalid code segment "${invalid}"`)
  return [prefix, ...parts].join('-')
}

export const formatSequentialCode = (scope: string, value: number, width = 3): string => {
  if (!Number.isInteger(value) || value < 1) throw new Error(`Invalid sequence value ${value}`)
  return `${scope}-${String(value).padStart(width, '0')}`
}
