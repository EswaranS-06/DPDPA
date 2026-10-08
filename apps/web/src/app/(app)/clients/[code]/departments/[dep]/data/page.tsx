import { AccessDeniedError } from '@duatf/core-access'
import { buttonClass, Callout, PageHeader, SectionHeader } from '@duatf/core-ui'
import { departmentData, NotFoundError } from '@duatf/feature-compliance-api'
import { ListPlus, Plus, Workflow } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DepartmentDataForm } from '@/components/data/DepartmentDataForm'
import styles from '@/components/data/Ropa.module.css'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import { saveDepartmentDataAction } from '../../../../actions'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; dep: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: `Personal data of ${decodeURIComponent((await params).dep).toUpperCase()}`,
})

export default async function Page({ params }: Props) {
  const { code, dep } = await params
  const client = await loadClient(code)
  const ctx = await serviceContext()
  const view = await departmentData(ctx, client.id, decodeURIComponent(dep)).catch(
    (error: unknown) => {
      if (error instanceof NotFoundError || error instanceof AccessDeniedError) notFound()
      throw error
    },
  )
  const { department, catalogue } = view
  const base = `/clients/${client.code}`
  const suggested = view.suggestion.processes.length
  return (
    <>
      <PageHeader
        kicker={<span className="code">{department.code}</span>}
        title={`Personal data: ${department.name}`}
        lede="What this department collects and keeps, and the processing activities it uses it for. Every department answers this; together the answers make the client’s data map and record of processing (RoPA). Change it whenever the department’s practice changes."
        actions={
          <Link href={`${base}/data-mapping?view=ropa`} className={buttonClass('secondary')}>
            <Workflow size={16} aria-hidden="true" />
            Record of processing
          </Link>
        }
      />
      {view.canEdit ? null : (
        <Callout tone="neutral" title="Read only">
          <p>The audit team keeps each department’s personal data up to date.</p>
        </Callout>
      )}

      <section className={styles.section} aria-labelledby="activities-heading">
        <SectionHeader
          id="activities-heading"
          title="Processing activities"
          count={view.activities.length}
          description="Each activity is one row of the RoPA: its purpose, lawful basis, people, data, recipients, retention and safeguards."
          actions={
            view.canEdit ? (
              <>
                <Link
                  href={`${base}/data-mapping/catalogue?department=${department.code}`}
                  className={buttonClass(view.activities.length ? 'secondary' : 'primary', 'sm')}
                >
                  <ListPlus size={16} aria-hidden="true" />
                  Add from the catalogue
                </Link>
                <Link
                  href={`${base}/data-mapping/activities/new?department=${department.code}`}
                  className={buttonClass('ghost', 'sm')}
                >
                  <Plus size={16} aria-hidden="true" />
                  Add activity
                </Link>
              </>
            ) : null
          }
        />
        {view.activities.length ? (
          <ul className={styles.activityList}>
            {view.activities.map((activity) => (
              <li key={activity.ref}>
                <Link
                  href={`${base}/data-mapping/activities/${activity.refLabel}`}
                  className={styles.activityLink}
                >
                  <span className="code">{activity.refLabel}</span>
                  <span className={styles.activityName}>{activity.name}</span>
                </Link>
                {activity.purpose ? <p className={styles.muted}>{activity.purpose}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>
            None yet.{' '}
            {suggested
              ? `The process catalogue suggests ${suggested} for a department like this one; add them in one step and adjust each.`
              : 'Add them from the process catalogue, or one by one.'}
          </p>
        )}
      </section>

      <DepartmentDataForm
        action={saveDepartmentDataAction.bind(null, {
          clientId: client.id,
          clientCode: client.code,
          departmentId: department.id,
        })}
        elements={view.elements}
        catalogue={catalogue.elements.map((row) => ({
          code: row.code,
          title: row.title,
          category: row.category,
          level: row.level,
          note: row.note,
          personalData: row.personalData,
        }))}
        departments={view.departments.map((row) => ({ code: row.code, name: row.name }))}
        suggestion={view.suggestion}
        disabled={!view.canEdit}
      />
    </>
  )
}
