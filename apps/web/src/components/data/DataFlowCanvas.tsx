'use client'

import {
  dataFlowGraph,
  FLOW_KIND_LABEL,
  type FlowActivity,
  type FlowEdge,
  type FlowNode,
  type FlowNodeKind,
} from '@duatf/feature-compliance-api/data-flow'
import { LEVEL_INFO, type Level } from '@duatf/feature-compliance-api/personal-data'
import {
  Background,
  Controls,
  getViewportForBounds,
  Handle,
  MarkerType,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { toPng } from 'html-to-image'
import { Download, X } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import styles from './DataFlowCanvas.module.css'

const LEVEL_COLOUR: Record<Level, string> = {
  L1: 'var(--color-neutral-solid)',
  L2: 'var(--color-info-solid)',
  L3: 'var(--color-warning-solid)',
  L4: 'var(--color-danger-solid)',
}
const levelLabel = (level: Level) => `${level} ${LEVEL_INFO[level].label}`

const KIND_LABEL: Record<FlowNodeKind, string> = {
  principal: 'Data principal',
  source: 'Other source',
  department: 'Department',
  activity: 'Processing activity',
  store: 'Data store (system)',
  internal: 'Department receiving the data',
  processor: 'Processor',
  recipient: 'Recipient',
  abroad: 'Outside India',
}

type NodeData = { node: FlowNode; dimmed: boolean; picked: boolean }

/** The frame's height in pixels (40rem), for the opening zoom. */
const CANVAS_HEIGHT = 640
type Picked = { type: 'node' | 'edge'; id: string } | null

const classes = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ')

/** An external entity, a data store or a recipient: a box with its kind. */
const EntityNode = ({ data }: NodeProps<Node<NodeData>>) => (
  <div
    className={classes(
      styles.node,
      styles[data.node.kind],
      data.dimmed && styles.dimmed,
      data.picked && styles.picked,
    )}
    title={`${KIND_LABEL[data.node.kind]}: ${data.node.label}`}
  >
    <Handle type="target" position={Position.Left} className={styles.handle} />
    <span className={styles.kind}>{data.node.detail ?? KIND_LABEL[data.node.kind]}</span>
    <span className={styles.label}>{data.node.label}</span>
    <Handle type="source" position={Position.Right} className={styles.handle} />
  </div>
)

/** A processing activity: a process of the diagram, with the highest level of its data. */
const ActivityNode = ({ data }: NodeProps<Node<NodeData>>) => (
  <div
    className={classes(
      styles.node,
      styles.activity,
      data.dimmed && styles.dimmed,
      data.picked && styles.picked,
    )}
    style={{ borderLeftColor: data.node.level ? LEVEL_COLOUR[data.node.level] : undefined }}
  >
    <Handle type="target" position={Position.Left} className={styles.handle} />
    <span className={styles.kind}>
      {data.node.detail}
      {data.node.level ? `, ${levelLabel(data.node.level)}` : ''}
    </span>
    <span className={styles.label}>{data.node.label}</span>
    <Handle type="source" position={Position.Right} className={styles.handle} />
  </div>
)

/** A department: the box its processing activities sit in. */
const DepartmentNode = ({ data }: NodeProps<Node<NodeData>>) => (
  <div className={classes(styles.department, data.dimmed && styles.dimmed)}>
    <span className={styles.departmentName}>{data.node.label}</span>
    <span className={styles.departmentCode}>{data.node.detail}</span>
  </div>
)

const NODE_TYPES = { entity: EntityNode, activity: ActivityNode, department: DepartmentNode }

const typeOf = (kind: FlowNodeKind) =>
  kind === 'activity' ? 'activity' : kind === 'department' ? 'department' : 'entity'

/** The PNG download: the whole diagram, whatever part is on screen. */
const DownloadButton = ({ fileName }: { fileName: string }) => {
  const { getNodes, getNodesBounds } = useReactFlow()
  const [busy, setBusy] = useState(false)
  const download = async () => {
    const viewport = document.querySelector<HTMLElement>('.react-flow__viewport')
    if (!viewport) return
    setBusy(true)
    try {
      // The instance's bounds place an activity inside its department's box.
      const bounds = getNodesBounds(getNodes())
      const width = Math.min(4000, Math.max(1200, bounds.width + 160))
      const height = Math.min(4000, Math.max(700, bounds.height + 160))
      const fit = getViewportForBounds(bounds, width, height, 0.2, 2, 0.06)
      const background =
        getComputedStyle(document.body).getPropertyValue('--color-surface').trim() || '#ffffff'
      const url = await toPng(viewport, {
        backgroundColor: background,
        width,
        height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.zoom})`,
        },
      })
      const link = document.createElement('a')
      link.download = fileName
      link.href = url
      link.click()
    } finally {
      setBusy(false)
    }
  }
  return (
    <button type="button" className={styles.tool} onClick={() => void download()} disabled={busy}>
      <Download size={14} aria-hidden="true" />
      {busy ? 'Preparing…' : 'Download PNG'}
    </button>
  )
}

/**
 * The data flow diagram of the record of processing, drawn with React Flow: pan and zoom, pick a
 * box or a line to see what flows there, narrow to one department, hide the data stores, and
 * download the picture.
 */
export const DataFlowCanvas = ({
  activities,
  departments: allDepartments,
  activityHref,
  fileName,
}: {
  activities: FlowActivity[]
  departments: { code: string; name: string }[]
  /** The page of an activity, from its ref. */
  activityHref: string
  fileName: string
}) => {
  const [picked, setPicked] = useState<Picked>(null)
  const [department, setDepartment] = useState('')
  const [stores, setStores] = useState(true)
  // Laid out afresh for what is shown: one department, with or without the data stores.
  const graph = useMemo(
    () =>
      dataFlowGraph(
        activities.filter((row) => !department || row.departmentCode === department),
        allDepartments,
        { stores },
      ),
    [activities, allDepartments, department, stores],
  )
  const byId = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes])
  const departments = allDepartments.filter((row) =>
    activities.some((activity) => activity.departmentCode === row.code),
  )

  // What the pick lights up: a box and its lines, or a line and its two ends.
  const lit = useMemo(() => {
    if (!picked) return null
    if (picked.type === 'edge') {
      const edge = graph.edges.find((item) => item.id === picked.id)
      return edge ? { nodes: new Set([edge.source, edge.target]), edges: new Set([edge.id]) } : null
    }
    const edges = graph.edges.filter(
      (edge) => edge.source === picked.id || edge.target === picked.id,
    )
    return {
      nodes: new Set([picked.id, ...edges.flatMap((edge) => [edge.source, edge.target])]),
      edges: new Set(edges.map((edge) => edge.id)),
    }
  }, [picked, graph.edges])

  const nodes: Node<NodeData>[] = useMemo(
    () =>
      [...graph.nodes]
        // A parent comes before its children.
        .sort((a, b) => Number(a.kind !== 'department') - Number(b.kind !== 'department'))
        .map((node) => ({
          id: node.id,
          type: typeOf(node.kind),
          position: { x: node.x, y: node.y },
          data: {
            node,
            dimmed: Boolean(lit && node.kind !== 'department' && !lit.nodes.has(node.id)),
            picked: picked?.type === 'node' && picked.id === node.id,
          },
          style: { width: node.width, height: node.height },
          ...(node.parentId ? { parentId: node.parentId, extent: 'parent' as const } : {}),
          selectable: node.kind !== 'department',
          draggable: node.kind !== 'department',
          zIndex: node.kind === 'department' ? 0 : 1,
        })),
    [graph.nodes, lit, picked],
  )

  const edges: Edge[] = useMemo(
    () =>
      graph.edges.map((edge) => {
        const colour = LEVEL_COLOUR[edge.level]
        const on = lit?.edges.has(edge.id) ?? false
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: 'default',
          markerEnd: { type: MarkerType.ArrowClosed, color: colour, width: 16, height: 16 },
          style: {
            stroke: colour,
            strokeWidth: on ? 2.5 : 1.5,
            strokeDasharray: edge.kind === 'transfer' ? '6 4' : undefined,
            opacity: lit && !on ? 0.12 : 0.85,
          },
          label: on
            ? `${edge.elements.length} data element${edge.elements.length === 1 ? '' : 's'}`
            : undefined,
          labelStyle: { fontSize: 11, fill: 'var(--color-text)' },
          labelBgStyle: { fill: 'var(--color-surface)' },
          zIndex: on ? 2 : 1,
        }
      }),
    [graph.edges, lit],
  )

  // A small diagram fits the frame; a large one opens readable at its top left.
  const onInit = (instance: ReactFlowInstance<Node<NodeData>, Edge>) => {
    if (graph.height * 0.62 <= CANVAS_HEIGHT) void instance.fitView({ padding: 0.08, maxZoom: 1 })
    else void instance.setViewport({ x: 24, y: 24, zoom: 0.62 })
  }

  const pickedNode = picked?.type === 'node' ? byId.get(picked.id) : undefined
  const pickedEdge =
    picked?.type === 'edge' ? graph.edges.find((edge) => edge.id === picked.id) : undefined
  const flowsOf = (id: string) =>
    graph.edges.filter((edge) => edge.source === id || edge.target === id)
  const labelOf = (id: string) => byId.get(id)?.label ?? id

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <label className={styles.filter}>
          <span>Department</span>
          <select
            value={department}
            onChange={(event) => {
              setDepartment(event.target.value)
              setPicked(null)
            }}
          >
            <option value="">All departments</option>
            {departments.map((row) => (
              <option key={row.code} value={row.code}>
                {row.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={stores}
            onChange={(event) => setStores(event.target.checked)}
          />
          <span>Data stores</span>
        </label>
        <p className={styles.hint}>Pick a box or a line to see what personal data flows there.</p>
      </div>
      <div className={styles.layout}>
        <div className={styles.canvas}>
          <ReactFlow
            key={`${department}:${String(stores)}`}
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            onInit={onInit}
            minZoom={0.15}
            maxZoom={2}
            nodesConnectable={false}
            edgesFocusable
            onNodeClick={(_, node) =>
              byId.get(node.id)?.kind === 'department'
                ? undefined
                : setPicked({ type: 'node', id: node.id })
            }
            onEdgeClick={(_, edge) => setPicked({ type: 'edge', id: edge.id })}
            onPaneClick={() => setPicked(null)}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={24} size={1} />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable className={styles.minimap} />
            <Panel position="top-right">
              <DownloadButton fileName={fileName} />
            </Panel>
          </ReactFlow>
        </div>
        {pickedNode || pickedEdge ? (
          <aside className={styles.details} aria-live="polite">
            <button
              type="button"
              className={styles.close}
              aria-label="Close the details"
              onClick={() => setPicked(null)}
            >
              <X size={16} aria-hidden="true" />
            </button>
            {pickedNode ? (
              <>
                <p className={styles.detailKind}>{KIND_LABEL[pickedNode.kind]}</p>
                <h3 className={styles.detailTitle}>{pickedNode.label}</h3>
                {pickedNode.kind === 'activity' && pickedNode.detail ? (
                  <Link href={`${activityHref}/${pickedNode.detail}`} className={styles.open}>
                    Open {pickedNode.detail}
                  </Link>
                ) : null}
                {pickedNode.kind === 'abroad'
                  ? flowsOf(pickedNode.id)
                      .flatMap((edge) => (edge.note ? [edge.note] : []))
                      .map((note) => (
                        <p key={note} className={styles.detailNote}>
                          Countries: {note}
                        </p>
                      ))
                  : null}
                <ul className={styles.flowList}>
                  {flowsOf(pickedNode.id).map((edge) => (
                    <FlowItem
                      key={edge.id}
                      edge={edge}
                      from={labelOf(edge.source)}
                      to={labelOf(edge.target)}
                    />
                  ))}
                </ul>
              </>
            ) : pickedEdge ? (
              <>
                <p className={styles.detailKind}>{FLOW_KIND_LABEL[pickedEdge.kind]}</p>
                <ul className={styles.flowList}>
                  <FlowItem
                    edge={pickedEdge}
                    from={labelOf(pickedEdge.source)}
                    to={labelOf(pickedEdge.target)}
                  />
                </ul>
              </>
            ) : null}
          </aside>
        ) : null}
      </div>
      <ul className={styles.legend} aria-label="Legend">
        <li>
          <span className={classes(styles.swatch, styles.principal)} /> Data principal or source
        </li>
        <li>
          <span className={classes(styles.swatch, styles.activity)} /> Processing activity
        </li>
        <li>
          <span className={classes(styles.swatch, styles.store)} /> Data store
        </li>
        <li>
          <span className={classes(styles.swatch, styles.processor)} /> Processor
        </li>
        <li>
          <span className={classes(styles.swatch, styles.recipient)} /> Recipient or department
        </li>
        <li>
          <span className={classes(styles.swatch, styles.abroad)} /> Outside India
        </li>
        {(['L4', 'L3', 'L2', 'L1'] as const).map((level) => (
          <li key={level}>
            <span className={styles.line} style={{ background: LEVEL_COLOUR[level] }} />{' '}
            {levelLabel(level)} data
          </li>
        ))}
      </ul>
    </div>
  )
}

const FlowItem = ({ edge, from, to }: { edge: FlowEdge; from: string; to: string }) => (
  <li className={styles.flowItem}>
    <p className={styles.flowHead}>
      {from} → {to}
    </p>
    <p className={styles.flowMeta}>
      {FLOW_KIND_LABEL[edge.kind]}, {levelLabel(edge.level)}
      {edge.note ? `, ${edge.note}` : ''}
    </p>
    {edge.elements.length ? (
      <p className={styles.flowData}>{edge.elements.join(', ')}</p>
    ) : (
      <p className={styles.flowData}>No personal data recorded on this activity yet.</p>
    )}
  </li>
)
