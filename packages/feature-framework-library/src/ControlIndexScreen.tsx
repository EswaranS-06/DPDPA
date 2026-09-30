import { KB_PATH, kbHref } from '@duatf/feature-framework-library-api'
import { Citation, DataTable, EmptyState, PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import styles from './screens.module.css'

export type ControlSearchParams = { domain?: string; type?: string; text?: string }

type Props = { api: FrameworkLibraryApi; params: ControlSearchParams }

const TYPES = ['Directive', 'Preventive', 'Detective', 'Corrective']

export const ControlIndexScreen = async ({ api, params }: Props) => {
  const [domains, controls] = await Promise.all([
    api.domains(),
    api.controls({
      domain: params.domain || undefined,
      controlType: params.type || undefined,
      text: params.text?.trim() || undefined,
    }),
  ])
  const filtering = Boolean(params.domain || params.type || params.text)

  return (
    <div className={styles.page}>
      <PageHeader
        title="Controls"
        lede="What an organisation puts in place to meet its obligations, with how to test each one and what evidence to collect."
      />
      <form method="get" action={KB_PATH} className={styles.filters}>
        <input type="hidden" name="section" value="controls" />
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
          Type
          <select name="type" defaultValue={params.type ?? ''}>
            <option value="">Any type</option>
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Words or code
          <input
            name="text"
            type="search"
            defaultValue={params.text ?? ''}
            placeholder="consent, CTL-SEC"
          />
        </label>
        <button type="submit" className={styles.button}>
          Show controls
        </button>
        {filtering ? (
          <Link href={kbHref('controls')} className={styles.linkButton}>
            Clear filters
          </Link>
        ) : null}
      </form>
      <p className={styles.resultCount}>{controls.length} controls.</p>
      {controls.length === 0 ? (
        <EmptyState title="No control matches these filters.">
          Remove a filter to see more.
        </EmptyState>
      ) : (
        <DataTable
          rows={controls}
          rowKey={(row) => row.code}
          columns={[
            {
              key: 'code',
              header: 'Control',
              width: '7rem',
              render: (row) => <Citation>{row.code}</Citation>,
            },
            {
              key: 'title',
              header: 'Title',
              render: (row) => (
                <>
                  <Link className={styles.inlineLink} href={kbHref('controls', row.code)}>
                    {row.title}
                  </Link>
                  <span className={styles.indexMeta}>{row.description}</span>
                </>
              ),
            },
            { key: 'type', header: 'Type', render: (row) => row.controlType },
            { key: 'frequency', header: 'Frequency', render: (row) => row.frequency },
            { key: 'owner', header: 'Usual owner', render: (row) => row.ownerRole },
            {
              key: 'count',
              header: 'Obligations',
              align: 'end',
              render: (row) => row.obligationCount,
            },
          ]}
        />
      )}
    </div>
  )
}
