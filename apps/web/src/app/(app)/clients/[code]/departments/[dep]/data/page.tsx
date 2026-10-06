import { AccessDeniedError } from '@duatf/core-access'
import { buttonClass, Callout, PageHeader } from '@duatf/core-ui'
import { departmentData, NotFoundError } from '@duatf/feature-compliance-api'
import { Workflow } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DepartmentDataForm } from '@/components/data/DepartmentDataForm'
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
  const { department, profile, catalogue } = view
  const base = `/clients/${client.code}`
  return (
    <>
      <PageHeader
        kicker={<span className="code">{department.code}</span>}
        title={`Personal data: ${department.name}`}
        lede="What this department collects, from whom, where it keeps it and who receives it. Every department answers this question; together the answers make the client’s data map and record of processing. Change it whenever the department’s practice changes."
        actions={
          <Link href={`${base}/data-mapping`} className={buttonClass('secondary')}>
            <Workflow size={16} aria-hidden="true" />
            Data mapping
          </Link>
        }
      />
      {view.canEdit ? null : (
        <Callout tone="neutral" title="Read only">
          <p>The audit team keeps each department’s personal data up to date.</p>
        </Callout>
      )}
      <DepartmentDataForm
        action={saveDepartmentDataAction.bind(null, {
          clientId: client.id,
          clientCode: client.code,
          departmentId: department.id,
        })}
        elements={view.elements}
        profile={
          profile
            ? {
                purposes: profile.purposes,
                lawfulBases: profile.lawfulBases,
                systems: profile.systems,
                sharedWith: profile.sharedWith,
                recipients: profile.recipients,
                transfersAbroad: profile.transfersAbroad,
                countries: profile.countries,
                retention: profile.retention,
                security: profile.security,
              }
            : null
        }
        catalogue={catalogue.elements.map((row) => ({
          code: row.code,
          title: row.title,
          category: row.category,
          level: row.level,
          note: row.note,
          personalData: row.personalData,
        }))}
        bases={catalogue.bases}
        departments={view.departments.map((row) => ({ code: row.code, name: row.name }))}
        suggestion={view.suggestion}
        disabled={!view.canEdit}
      />
    </>
  )
}
