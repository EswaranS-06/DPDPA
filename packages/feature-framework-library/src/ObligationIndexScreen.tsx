import { KB_PATH, kbHref } from '@duatf/feature-framework-library-api'
import { EmptyState, PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi, ObligationListItem } from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import { ObligationRow } from './components/ObligationRow'
import { ACTOR_LABEL, PENALTY } from './consts/labels'
import styles from './screens.module.css'

export type ObligationSearchParams = {
  domain?: string
  phase?: string
  penalty?: string
  actor?: string
  text?: string
}

type Props = { api: FrameworkLibraryApi; today: string; params: ObligationSearchParams }

const PHASES = [
  { value: '0', label: 'Other Indian law, in force' },
  { value: '2', label: 'Phase 2, from 13 November 2026' },
  { value: '3', label: 'Phase 3, from 13 May 2027' },
]

const parsePhase = (value: string | undefined) =>
  value && /^\d$/.test(value) ? Number(value) : undefined

export const ObligationIndexScreen = async ({ api, today, params }: Props) => {
  const [domains, all, filtered] = await Promise.all([
    api.domains(),
    api.obligations(),
    api.obligations({
      domain: params.domain || undefined,
      phase: parsePhase(params.phase),
      penaltyTier: params.penalty || undefined,
      actor: params.actor || undefined,
      text: params.text?.trim() || undefined,
    }),
  ])
  const actors = [...new Set(all.map((item) => item.actor))].sort()
  const filtering = Boolean(
    params.domain || params.phase || params.penalty || params.actor || params.text,
  )
  const groups = domains
    .map((domain) => ({
      domain,
      items: filtered.filter((item) => item.domainCode === domain.code),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className={styles.page}>
      <PageHeader
        title="Obligations"
        lede="Each obligation is one duty from the DPDP Act, the Rules, or a linked Indian law. The citation sits in the margin."
      />

      <form method="get" action={KB_PATH} className={styles.filters}>
        <input type="hidden" name="section" value="obligations" />
        <label className={styles.field}>
          Domain
          <select name="domain" defaultValue={params.domain ?? ''}>
            <option value="">All domains</option>
            {domains.map((domain) => (
              <option key={domain.code} value={domain.code}>
                {domain.code} {domain.title}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Commencement
          <select name="phase" defaultValue={params.phase ?? ''}>
            <option value="">Any date</option>
            {PHASES.map((phase) => (
              <option key={phase.value} value={phase.value}>
                {phase.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Penalty
          <select name="penalty" defaultValue={params.penalty ?? ''}>
            <option value="">Any penalty</option>
            {Object.entries(PENALTY).map(([tier, penalty]) => (
              <option key={tier} value={tier}>
                {penalty.amount}, {penalty.basis}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Who it binds
          <select name="actor" defaultValue={params.actor ?? ''}>
            <option value="">Anyone</option>
            {actors.map((actor) => (
              <option key={actor} value={actor}>
                {ACTOR_LABEL[actor] ?? actor}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Words or citation
          <input
            name="text"
            type="search"
            defaultValue={params.text ?? ''}
            placeholder="s.8(6), withdrawal"
          />
        </label>
        <button type="submit" className={styles.button}>
          Show obligations
        </button>
        {filtering ? (
          <Link href={kbHref('obligations')} className={styles.linkButton}>
            Clear filters
          </Link>
        ) : null}
      </form>

      <p className={styles.resultCount} aria-live="polite">
        {filtering
          ? `${filtered.length} of ${all.length} obligations match.`
          : `${all.length} obligations in ${groups.length} domains.`}
      </p>

      {groups.length === 0 ? (
        <EmptyState title="No obligation matches these filters.">
          Remove a filter, or search by citation such as s.8(6) or R7.
        </EmptyState>
      ) : (
        groups.map((group) => (
          <section key={group.domain.code} className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Link href={kbHref('domains', group.domain.code)} className={styles.indexTitle}>
                {group.domain.code} {group.domain.title}
              </Link>
            </h2>
            <ul className={styles.plainList}>
              {group.items.map((item: ObligationListItem) => (
                <ObligationRow key={item.code} item={item} today={today} showDomain={false} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
