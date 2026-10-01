'use client'

import {
  BookOpen,
  Building,
  ClipboardList,
  CornerDownLeft,
  FileCheck,
  ListChecks,
  Network,
  Search,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { NAV_ICON } from './icons'
import { clientSections, type NavClient, type Navigation } from './navigation'
import styles from './CommandPalette.module.css'

/** One result row; "page" rows come from the navigation, the rest from /search/suggest. */
export type PaletteHit = {
  kind:
    | 'page'
    | 'client'
    | 'assessment'
    | 'finding'
    | 'action'
    | 'evidence'
    | 'department'
    | 'knowledge'
  title: string
  detail: string
  href: string
}

const GROUP_LABEL: Record<PaletteHit['kind'], string> = {
  page: 'Go to',
  client: 'Clients',
  assessment: 'Assessments',
  finding: 'Findings',
  action: 'Remediation actions',
  evidence: 'Evidence',
  department: 'Departments',
  knowledge: 'Knowledge base',
}

const KIND_ICON: Record<Exclude<PaletteHit['kind'], 'page'>, LucideIcon> = {
  client: Building,
  assessment: ClipboardList,
  finding: ListChecks,
  action: Wrench,
  evidence: FileCheck,
  department: Network,
  knowledge: BookOpen,
}

type Props = {
  open: boolean
  onClose: () => void
  navigation: Navigation
  client: NavClient | null
}

const pagesFor = (navigation: Navigation, client: NavClient | null) => [
  ...navigation.groups.flatMap((group) => group.links),
  ...(client ? clientSections(client.code).flatMap((group) => group.links) : []),
]

/** Search everything the user can open, from anywhere: Ctrl K or the search button. */
export const CommandPalette = ({ open, onClose, navigation, client }: Props) => {
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const listId = useId()
  const [query, setQuery] = useState('')
  const [remote, setRemote] = useState<{ query: string; hits: PaletteHit[] }>({
    query: '',
    hits: [],
  })
  const [active, setActive] = useState(0)

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) {
      element.showModal()
      input.current?.focus()
    } else if (!open && element.open) {
      element.close()
    }
  }, [open])

  const trimmed = query.trim()
  useEffect(() => {
    if (trimmed.length < 2) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      fetch(`/search/suggest?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((response) => (response.ok ? (response.json() as Promise<PaletteHit[]>) : []))
        .then((hits) => setRemote({ query: trimmed, hits }))
        .catch(() => undefined)
    }, 150)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [trimmed])

  const pages: PaletteHit[] = pagesFor(navigation, client)
    .filter((link) => !trimmed || link.label.toLowerCase().includes(trimmed.toLowerCase()))
    .map((link) => ({
      kind: 'page',
      title: link.label,
      detail: link.href.startsWith('/clients/') && client ? client.name : '',
      href: link.href,
    }))
  const hits = [...pages, ...(trimmed.length >= 2 && remote.query === trimmed ? remote.hits : [])]
  const loading = trimmed.length >= 2 && remote.query !== trimmed
  const current = Math.min(active, Math.max(hits.length - 1, 0))

  const go = (hit: PaletteHit | undefined) => {
    if (!hit) return
    onClose()
    setQuery('')
    router.push(hit.href)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((current + 1) % Math.max(hits.length, 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((current - 1 + hits.length) % Math.max(hits.length, 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      go(hits[current])
    }
  }

  const optionId = (index: number) => `${listId}-option-${index}`
  let lastKind: PaletteHit['kind'] | null = null

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-label="Search"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) onClose()
      }}
    >
      <div className={styles.panel}>
        <div className={styles.field}>
          <Search size={18} strokeWidth={2} aria-hidden="true" />
          <input
            ref={input}
            className={styles.input}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={hits.length ? optionId(current) : undefined}
            aria-autocomplete="list"
            placeholder="Search clients, findings, actions, questions or s.8(6)"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
          />
          <kbd className={styles.kbd}>Esc</kbd>
        </div>
        <ul id={listId} role="listbox" aria-label="Results" className={styles.results}>
          {hits.map((hit, index) => {
            const heading = hit.kind !== lastKind ? GROUP_LABEL[hit.kind] : null
            lastKind = hit.kind
            const Icon =
              hit.kind === 'page'
                ? NAV_ICON[
                    pagesFor(navigation, client).find((link) => link.href === hit.href)?.icon ??
                      'overview'
                  ]
                : KIND_ICON[hit.kind]
            return (
              <li key={`${hit.kind}-${hit.href}`} role="presentation">
                {heading ? (
                  <p className={styles.group} aria-hidden="true">
                    {heading}
                  </p>
                ) : null}
                <div
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === current}
                  className={
                    index === current ? `${styles.option} ${styles.active}` : styles.option
                  }
                  onMouseMove={() => setActive(index)}
                  onClick={() => go(hit)}
                >
                  <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span className={styles.optionText}>
                    <span className={styles.optionTitle}>{hit.title}</span>
                    {hit.detail ? <span className={styles.optionDetail}>{hit.detail}</span> : null}
                  </span>
                  {index === current ? (
                    <CornerDownLeft className={styles.enter} size={14} aria-hidden="true" />
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
        <div className={styles.footer}>
          <p className={styles.status} role="status">
            {loading
              ? 'Searching…'
              : trimmed.length >= 2 && hits.length === pages.length
                ? `Nothing you can open matches "${trimmed}". Try a code such as FND-NADALL-004 or a citation such as s.8(6).`
                : trimmed.length >= 2
                  ? `${hits.length} results`
                  : 'Type two or more letters. Up and down arrows move, Enter opens.'}
          </p>
          {trimmed.length >= 2 ? (
            <a
              href={`/search?q=${encodeURIComponent(trimmed)}`}
              className={styles.all}
              onClick={(event) => {
                event.preventDefault()
                go({
                  kind: 'page',
                  title: 'Search',
                  detail: '',
                  href: `/search?q=${encodeURIComponent(trimmed)}`,
                })
              }}
            >
              All results
            </a>
          ) : null}
        </div>
      </div>
    </dialog>
  )
}
