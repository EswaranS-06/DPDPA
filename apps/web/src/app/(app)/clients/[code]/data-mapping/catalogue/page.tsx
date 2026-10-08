import { AccessDeniedError } from '@duatf/core-access'
import { buttonClass, EmptyState, PageHeader } from '@duatf/core-ui'
import { NotFoundError, ropaCatalogue } from '@duatf/feature-compliance-api'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CatalogueForm } from '@/components/data/CatalogueForm'
import { loadClient } from '@/server/clients'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import { adoptProcessesAction } from '../actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Add from the process catalogue' }

type Props = { params: Promise<{ code: string }>; searchParams: SearchParams }

export default async function Page({ params, searchParams }: Props) {
  const client = await loadClient((await params).code)
  const focus = firstValue((await searchParams).department)?.toUpperCase()
  const ctx = await serviceContext()
  const catalogue = await ropaCatalogue(ctx, client.id).catch((error: unknown) => {
    if (error instanceof NotFoundError || error instanceof AccessDeniedError) notFound()
    throw error
  })
  if (!catalogue.canEdit) notFound()
  const base = `/clients/${client.code}`
  const departments = catalogue.departments.filter((row) => !focus || row.code === focus)
  const suggested = departments.reduce(
    (total, row) => total + row.suggested.filter((code) => !row.adopted.includes(code)).length,
    0,
  )
  return (
    <>
      <PageHeader
        title="Add from the process catalogue"
        lede={`The knowledge base’s catalogue holds the processes most organisations run, with the processes of this client’s sector. Each department’s usual processes are ticked (${suggested} in all); every activity starts with the catalogue’s purpose, data principals, personal data, recipients, retention, deletion and safeguards, ready to review.`}
        actions={
          focus ? (
            <Link href={`${base}/data-mapping/catalogue`} className={buttonClass('secondary')}>
              All departments
            </Link>
          ) : null
        }
      />
      {departments.length ? (
        <CatalogueForm
          action={adoptProcessesAction.bind(null, { clientId: client.id, clientCode: client.code })}
          departments={departments}
          processes={catalogue.processes}
        />
      ) : (
        <EmptyState
          title="No departments yet"
          action={
            <Link href={`${base}/departments/new`} className={buttonClass('primary')}>
              Add a department
            </Link>
          }
        >
          <p>Processing activities belong to departments. Add the client’s departments first.</p>
        </EmptyState>
      )}
    </>
  )
}
