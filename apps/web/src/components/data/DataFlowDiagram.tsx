import type { FlowEdge, FlowKind, FlowNode } from '@duatf/feature-compliance-api'
import styles from './DataMap.module.css'

// Layout of the flow diagram, in viewBox units.
const WIDTH = 1000
const LEFT_BAR = 262
const MIDDLE_X = 420
const MIDDLE_W = 168
const RIGHT_BAR = 748
const BAR_W = 10
const UNIT = 5
const MIN_NODE = 22
const GAP = 14
const TOP = 34

export const FLOW_KINDS: { kind: FlowKind; label: string }[] = [
  { kind: 'collected', label: 'Collected from people or other sources' },
  { kind: 'internal', label: 'Passed to another department' },
  { kind: 'external', label: 'Disclosed outside the organisation' },
  { kind: 'abroad', label: 'Transferred outside India' },
]

type Placed = { id: string; label: string; y: number; height: number; kind: FlowNode['kind'] }

const clip = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text
const weight = (edge: FlowEdge) => Math.max(1, edge.elements.length)

/** Stacks a column's nodes top to bottom, each as tall as the flows through it. */
const stack = (items: { id: string; label: string; kind: FlowNode['kind']; size: number }[]) => {
  let y = TOP
  return items.map((item) => {
    const height = Math.max(MIN_NODE, item.size * UNIT)
    const placed = { id: item.id, label: item.label, kind: item.kind, y, height }
    y += height + GAP
    return placed
  })
}

const band = (x1: number, a1: number, b1: number, x2: number, a2: number, b2: number) => {
  const mid = (x1 + x2) / 2
  return `M${x1},${a1} C${mid},${a1} ${mid},${a2} ${x2},${a2} L${x2},${b2} C${mid},${b2} ${mid},${b1} ${x1},${b1} Z`
}

/**
 * Where personal data comes from, which departments hold it and where it goes: sources on the
 * left, departments in the middle, other departments, recipients and other countries on the
 * right. Band width is the number of data elements; hovering a band lists them.
 */
export const DataFlowDiagram = ({ nodes, edges }: { nodes: FlowNode[]; edges: FlowEdge[] }) => {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const incoming = edges.filter((edge) => edge.kind === 'collected')
  const outgoing = edges.filter((edge) => edge.kind !== 'collected')
  const total = (list: FlowEdge[], key: 'from' | 'to', id: string) =>
    list.filter((edge) => edge[key] === id).reduce((sum, edge) => sum + weight(edge), 0)

  const leftIds = [...new Set(incoming.map((edge) => edge.from))]
  const middleIds = [
    ...new Set([...incoming.map((edge) => edge.to), ...outgoing.map((edge) => edge.from)]),
  ].sort((a, b) => (byId.get(a)?.label ?? a).localeCompare(byId.get(b)?.label ?? b))
  // A department on the right is the receiving end of an internal flow, drawn as its own node.
  const rightKey = (edge: FlowEdge) => (edge.kind === 'internal' ? `to:${edge.to}` : edge.to)
  const rightIds = [...new Set(outgoing.map(rightKey))]

  const left = stack(
    leftIds.map((id) => ({
      id,
      label: byId.get(id)?.label ?? id,
      kind: 'source' as const,
      size: total(incoming, 'from', id),
    })),
  )
  const middle = stack(
    middleIds.map((id) => ({
      id,
      label: byId.get(id)?.label ?? id,
      kind: 'department' as const,
      size: Math.max(total(incoming, 'to', id), total(outgoing, 'from', id)),
    })),
  )
  const right = stack(
    rightIds.map((key) => {
      const id = key.startsWith('to:') ? key.slice(3) : key
      const node = byId.get(id)
      return {
        id: key,
        label: key.startsWith('to:') ? `${node?.label ?? id} (department)` : (node?.label ?? id),
        kind: node?.kind ?? 'recipient',
        size: outgoing
          .filter((edge) => rightKey(edge) === key)
          .reduce((sum, edge) => sum + weight(edge), 0),
      }
    }),
  )
  const find = (column: Placed[], id: string) => column.find((node) => node.id === id)
  const height =
    Math.max(
      ...[left, middle, right].map((column) => {
        const last = column.at(-1)
        return last ? last.y + last.height : TOP
      }),
    ) + 16

  // Where each band starts and ends on its nodes: stacked in the order of the other end.
  const offsets = new Map<string, number>()
  const slot = (nodeId: string, size: number, node: Placed) => {
    const used = offsets.get(nodeId) ?? 0
    offsets.set(nodeId, used + size)
    const scale = node.height / Math.max(node.height, used + size, 1)
    return [node.y + used * scale, node.y + (used + size) * scale] as const
  }
  const order = (column: Placed[], id: string) => column.findIndex((node) => node.id === id)

  const paths = [
    ...[...incoming]
      .sort((a, b) => order(middle, a.to) - order(middle, b.to))
      .flatMap((edge) => {
        const from = find(left, edge.from)
        const to = find(middle, edge.to)
        if (!from || !to) return []
        const size = weight(edge) * UNIT
        const [a1, b1] = slot(`out:${from.id}`, size, from)
        return [{ edge, from, to, a1, b1, x1: LEFT_BAR + BAR_W, x2: MIDDLE_X, size }]
      }),
    ...[...outgoing]
      .sort((a, b) => order(right, rightKey(a)) - order(right, rightKey(b)))
      .flatMap((edge) => {
        const from = find(middle, edge.from)
        const to = find(right, rightKey(edge))
        if (!from || !to) return []
        const size = weight(edge) * UNIT
        const [a1, b1] = slot(`out:${from.id}`, size, from)
        return [{ edge, from, to, a1, b1, x1: MIDDLE_X + MIDDLE_W, x2: RIGHT_BAR, size }]
      }),
  ]
    .sort((a, b) => a.from.y - b.from.y)
    .map((item) => {
      const [a2, b2] = slot(`in:${item.to.id}`, item.size, item.to)
      return { ...item, a2, b2 }
    })

  const label = (edge: FlowEdge) =>
    `${byId.get(edge.from)?.label ?? edge.from} → ${byId.get(edge.to)?.label ?? edge.to}: ${edge.elements.length} data element${edge.elements.length === 1 ? '' : 's'} (highest ${edge.level})${edge.note ? `, ${edge.note}` : ''}. ${edge.elements.join(', ')}`

  return (
    <figure className={styles.figure}>
      <div className={styles.scroll}>
        <svg
          className={styles.flow}
          viewBox={`0 0 ${WIDTH} ${height}`}
          role="img"
          aria-labelledby="flow-title"
        >
          <title id="flow-title">{`Data flow: ${left.length} sources, ${middle.length} departments, ${right.length} destinations`}</title>
          <text className={styles.columnHead} x={LEFT_BAR + BAR_W} y={16} textAnchor="end">
            From
          </text>
          <text
            className={styles.columnHead}
            x={MIDDLE_X + MIDDLE_W / 2}
            y={16}
            textAnchor="middle"
          >
            Department
          </text>
          <text className={styles.columnHead} x={RIGHT_BAR} y={16}>
            To
          </text>
          <g>
            {paths.map((item) => (
              <path
                key={`${item.edge.from}>${item.edge.to}`}
                className={`${styles.band} ${styles[`band_${item.edge.kind}`]} ${item.edge.level === 'L4' ? styles.restricted : ''}`}
                d={band(item.x1, item.a1, item.b1, item.x2, item.a2, item.b2)}
              >
                <title>{label(item.edge)}</title>
              </path>
            ))}
          </g>
          {left.map((node) => (
            <g key={node.id}>
              <rect
                className={styles.bar}
                x={LEFT_BAR}
                y={node.y}
                width={BAR_W}
                height={node.height}
                rx={3}
              />
              <text
                className={styles.nodeLabel}
                x={LEFT_BAR - 8}
                y={node.y + node.height / 2}
                textAnchor="end"
                dominantBaseline="middle"
              >
                {clip(node.label, 30)}
                <title>{node.label}</title>
              </text>
            </g>
          ))}
          {middle.map((node) => (
            <g key={node.id}>
              <rect
                className={styles.department}
                x={MIDDLE_X}
                y={node.y}
                width={MIDDLE_W}
                height={node.height}
                rx={6}
              />
              <text
                className={styles.departmentLabel}
                x={MIDDLE_X + MIDDLE_W / 2}
                y={node.y + Math.min(node.height / 2, 15)}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {clip(node.label, 24)}
                <title>{node.label}</title>
              </text>
            </g>
          ))}
          {right.map((node) => (
            <g key={node.id}>
              <rect
                className={`${styles.bar} ${styles[`bar_${node.kind}`]}`}
                x={RIGHT_BAR}
                y={node.y}
                width={BAR_W}
                height={node.height}
                rx={3}
              />
              <text
                className={styles.nodeLabel}
                x={RIGHT_BAR + BAR_W + 8}
                y={node.y + node.height / 2}
                dominantBaseline="middle"
              >
                {clip(node.label, 30)}
                <title>{node.label}</title>
              </text>
            </g>
          ))}
        </svg>
      </div>
      <figcaption className={styles.legend}>
        {FLOW_KINDS.map((item) => (
          <span key={item.kind} className={styles.legendItem}>
            <span
              className={`${styles.swatch} ${styles[`band_${item.kind}`]}`}
              aria-hidden="true"
            />
            {item.label}
          </span>
        ))}
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchRestricted}`} aria-hidden="true" />
          Outlined: carries Restricted (L4) data
        </span>
        <span className={styles.legendNote}>
          Band width is the number of data elements. Hover a band to list them.
        </span>
      </figcaption>
    </figure>
  )
}
