import { AccessDeniedError } from '@duatf/core-access'
import { Callout, PageHeader } from '@duatf/core-ui'
import { activityForm, NotFoundError } from '@duatf/feature-compliance-api'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ActivityForm } from '@/components/data/ActivityForm'
import { loadClient } from '@/server/clients'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import { saveActivityAction } from '../../actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Add a processing activity' }

type Props = { params: Promise<{ code: string }>; searchParams: SearchParams }

export default async function Page({ params, searchParams }: Props) {
  const client = await loadClient((await params).code)
  const query = await searchParams
  const ctx = await serviceContext()
  const form = await activityForm(ctx, client.id, null, {
    department: firstValue(query.department),
    process: firstValue(query.process),
  }).catch((error: unknown) => {
    if (error instanceof NotFoundError || error instanceof AccessDeniedError) notFound()
    throw error
  })
  if (!form.canEdit) notFound()
  const process = form.kb.processes.find((row) => row.code === form.values.templateCode)
  return (
    <>
      <PageHeader
        title="Add a processing activity"
        lede="One row of the record of processing: what the department does with personal data, why, on what basis, with whose data, who receives it, how long it is kept and how it is protected."
      />
      {process ? (
        <Callout tone="info" title={`Started from ${process.code} ${process.title}`}>
          <p>
            The answers below are the knowledge base’s defaults for this process. Check each one
            against what the department really does before saving.
          </p>
        </Callout>
      ) : null}
      <ActivityForm
        action={saveActivityAction.bind(null, {
          clientId: client.id,
          clientCode: client.code,
          ref: null,
        })}
        values={form.values}
        kb={form.kb}
        held={form.held}
        departments={form.departments.map((row) => ({ code: row.code, name: row.name }))}
        owners={form.owners}
      />
    </>
  )
}
