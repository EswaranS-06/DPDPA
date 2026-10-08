import { higherLevel, type Level, type TransferAnswer } from './personalData'

// The data flow diagram (DFD), drawn from the record of processing (ADR-0008): external entities
// (data principals and other sources, recipients), processes (the processing activities, inside
// their department), data stores (the systems) and the flows between them, each carrying the
// activity's personal data. Nothing here is entered by hand; change the RoPA and the diagram
// follows. Positions are laid out here, in columns, so the picture is the same for everyone.

export type FlowNodeKind =
  | 'principal'
  | 'source'
  | 'department'
  | 'activity'
  | 'store'
  | 'internal'
  | 'processor'
  | 'recipient'
  | 'abroad'

export type FlowNode = {
  id: string
  kind: FlowNodeKind
  label: string
  /** A second line: an activity's ref, a department's code, the countries of a transfer. */
  detail: string | null
  /** The department group an activity sits in; its position is then relative to the group. */
  parentId: string | null
  x: number
  y: number
  width: number
  height: number
  /** The highest sensitivity level of the data at an activity. */
  level: Level | null
}

export type FlowKind = 'collect' | 'store' | 'share' | 'process' | 'disclose' | 'transfer'

export type FlowEdge = {
  id: string
  source: string
  target: string
  kind: FlowKind
  /** The highest level of the personal data on this flow. */
  level: Level
  /** The personal data on this flow, by RoPA name. */
  elements: string[]
  /** The activities this flow belongs to, as PA-001. */
  activities: string[]
  /** Countries, for a transfer outside India. */
  note: string | null
}

export type DataFlowGraph = {
  nodes: FlowNode[]
  edges: FlowEdge[]
  width: number
  height: number
}

/** What the diagram needs of one processing activity. */
export type FlowActivity = {
  refLabel: string
  name: string
  departmentCode: string
  principals: string[]
  sources: string[]
  elements: { name: string; level: Level }[]
  systems: string[]
  internalRecipients: string[]
  processors: string[]
  recipients: string[]
  transfersAbroad: TransferAnswer
  countries: string | null
}

export const FLOW_KIND_LABEL: Record<FlowKind, string> = {
  collect: 'Collected from',
  store: 'Kept in',
  share: 'Shared with a department',
  process: 'Processed by a processor',
  disclose: 'Disclosed to a recipient',
  transfer: 'Transferred outside India',
}

/**
 * Sources that are an external entity of their own. Data straight from the person comes from
 * the data principals; data from another department or created inside is not a separate party.
 */
const SOURCE_NODES: Record<string, string> = {
  'from a government registry or kyc source': 'Government registry or KYC source',
  'from another organisation': 'Another organisation',
  'from public sources': 'Public sources',
  'from a parent or guardian': 'Parent or guardian',
}
const NOT_A_PARTY = new Set([
  'directly from the person',
  'from another department',
  'from another person about them',
  'collected automatically',
  'created by the organisation',
])

// Layout, in pixels: four columns, departments stacked in the second.
const GAP = 14
const COLUMN_X = { left: 0, departments: 280, stores: 660, right: 940 }
const SIZE = {
  entity: { width: 220, height: 46 },
  store: { width: 210, height: 46 },
  activity: { width: 260, height: 64 },
}
const GROUP = { padding: 16, header: 42, gap: 28 }

const key = (text: string) => text.trim().toLowerCase()
const levelOf = (levels: readonly Level[]): Level =>
  levels.reduce<Level>((top, level) => higherLevel(top, level), 'L1')

/** The data flow diagram of a client's processing activities. */
export const dataFlowGraph = (
  activities: readonly FlowActivity[],
  departments: readonly { code: string; name: string }[],
  options: { stores?: boolean } = {},
): DataFlowGraph => {
  const stores = options.stores ?? true
  const nameOf = new Map(departments.map((row) => [row.code, row.name]))
  const nodes = new Map<string, FlowNode>()
  const edges = new Map<string, FlowEdge>()
  const entity = (id: string, kind: FlowNodeKind, label: string, detail: string | null = null) => {
    if (!nodes.has(id)) {
      const size = kind === 'store' ? SIZE.store : SIZE.entity
      nodes.set(id, {
        id,
        kind,
        label,
        detail,
        parentId: null,
        x: 0,
        y: 0,
        ...size,
        level: null,
      })
    }
    return id
  }
  const flow = (
    source: string,
    target: string,
    kind: FlowKind,
    activity: FlowActivity,
    note: string | null = null,
  ) => {
    const id = `${source}>${target}`
    const edge = edges.get(id)
    const names = activity.elements.map((item) => item.name)
    edges.set(id, {
      id,
      source,
      target,
      kind,
      level: levelOf([
        ...(edge ? [edge.level] : []),
        ...activity.elements.map((item) => item.level),
      ]),
      elements: [...new Set([...(edge?.elements ?? []), ...names])],
      activities: [...new Set([...(edge?.activities ?? []), activity.refLabel])],
      note: edge?.note ?? note,
    })
  }

  // Departments with their activities, in department order.
  const owners = [...new Set(activities.map((row) => row.departmentCode))].sort((a, b) =>
    (nameOf.get(a) ?? a).localeCompare(nameOf.get(b) ?? b),
  )
  let top = 0
  const centreOf = new Map<string, number>()
  for (const code of owners) {
    const mine = activities.filter((row) => row.departmentCode === code)
    const groupId = `dept:${code}`
    const height = GROUP.header + mine.length * (SIZE.activity.height + GAP) - GAP + GROUP.padding
    nodes.set(groupId, {
      id: groupId,
      kind: 'department',
      label: nameOf.get(code) ?? code,
      detail: code,
      parentId: null,
      x: COLUMN_X.departments,
      y: top,
      width: SIZE.activity.width + GROUP.padding * 2,
      height,
      level: null,
    })
    mine.forEach((activity, index) => {
      const y = GROUP.header + index * (SIZE.activity.height + GAP)
      const id = `act:${activity.refLabel}`
      nodes.set(id, {
        id,
        kind: 'activity',
        label: activity.name,
        detail: activity.refLabel,
        parentId: groupId,
        x: GROUP.padding,
        y,
        ...SIZE.activity,
        level: activity.elements.length
          ? levelOf(activity.elements.map((item) => item.level))
          : null,
      })
      centreOf.set(id, top + y + SIZE.activity.height / 2)
    })
    top += height + GROUP.gap
  }

  for (const activity of activities) {
    const self = `act:${activity.refLabel}`
    for (const person of activity.principals) {
      flow(entity(`pr:${key(person)}`, 'principal', person), self, 'collect', activity)
    }
    for (const source of activity.sources) {
      if (NOT_A_PARTY.has(key(source))) continue
      const label = SOURCE_NODES[key(source)] ?? source
      flow(entity(`src:${key(label)}`, 'source', label), self, 'collect', activity)
    }
    for (const system of stores ? activity.systems : []) {
      flow(self, entity(`store:${key(system)}`, 'store', system), 'store', activity)
    }
    for (const code of activity.internalRecipients) {
      const label = nameOf.get(code) ?? code
      flow(self, entity(`int:${code}`, 'internal', label, 'Department'), 'share', activity)
    }
    for (const name of activity.processors) {
      flow(self, entity(`proc:${key(name)}`, 'processor', name, 'Processor'), 'process', activity)
    }
    for (const name of activity.recipients) {
      flow(self, entity(`rec:${key(name)}`, 'recipient', name, 'Recipient'), 'disclose', activity)
    }
    if (activity.transfersAbroad === 'yes') {
      flow(
        self,
        entity('abroad', 'abroad', 'Outside India'),
        'transfer',
        activity,
        activity.countries,
      )
    }
  }

  // Each outer column follows the activities it is linked to, in their order, so lines cross
  // as little as a column layout allows.
  const place = (kinds: readonly FlowNodeKind[], x: number) => {
    const column = [...nodes.values()].filter((node) => kinds.includes(node.kind))
    const linked = (node: FlowNode) =>
      [...edges.values()]
        .filter((edge) => edge.source === node.id || edge.target === node.id)
        .map((edge) => centreOf.get(edge.source === node.id ? edge.target : edge.source) ?? 0)
    const wanted = new Map(
      column.map((node) => {
        const centres = linked(node)
        return [node.id, centres.reduce((sum, value) => sum + value, 0) / (centres.length || 1)]
      }),
    )
    column.sort(
      (a, b) =>
        (wanted.get(a.id) ?? 0) - (wanted.get(b.id) ?? 0) ||
        kinds.indexOf(a.kind) - kinds.indexOf(b.kind) ||
        a.label.localeCompare(b.label),
    )
    let bottom = -Infinity
    for (const node of column) {
      node.x = x
      node.y = Math.max((wanted.get(node.id) ?? 0) - node.height / 2, bottom + GAP, 0)
      bottom = node.y + node.height
    }
  }
  place(['principal', 'source'], COLUMN_X.left)
  place(['store'], COLUMN_X.stores)
  place(['internal', 'processor', 'recipient', 'abroad'], stores ? COLUMN_X.right : COLUMN_X.stores)

  const all = [...nodes.values()]
  const outer = all.filter((node) => node.parentId === null)
  return {
    nodes: all,
    edges: [...edges.values()],
    width: Math.max(0, ...outer.map((node) => node.x + node.width)),
    height: Math.max(0, ...outer.map((node) => node.y + node.height)),
  }
}
