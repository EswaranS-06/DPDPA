import { AccessDeniedError } from '@duatf/core-access'
import { Callout, PageHeader } from '@duatf/core-ui'
import { activityForm, NotFoundError, parseRef } from '@duatf/feature-compliance-api'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ActivityForm } from '@/components/data/ActivityForm'
import { loadClient } from '@/server/clients'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import { deleteActivityAction, saveActivityAction } from '../../actions'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string; ref: string }>; searchParams: SearchParams }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: `Processing activity ${decodeURIComponent((await params).ref).toUpperCase()}`,
})

export default async function Page({ params, searchParams }: Props) {
  const { code, ref: raw } = await params
  const client = await loadClient(code)
  const ref = parseRef(decodeURIComponent(raw))
  if (ref === null) notFound()
  const ctx = await serviceContext()
  const form = await activityForm(ctx, client.id, ref).catch((error: unknown) => {
    if (error instanceof NotFoundError || error instanceof AccessDeniedError) notFound()
    throw error
  })
  const department = form.departments.find((row) => row.code === form.values.departmentCode)
  const process = form.kb.processes.find((row) => row.code === form.values.templateCode)
  const target = { clientId: client.id, clientCode: client.code }
  return (
    <>
      <PageHeader
        kicker={<span className="code">{form.refLabel}</span>}
        title={form.values.name}
        lede={[
          department ? `A processing activity of ${department.name}` : 'A processing activity',
          process ? `, started from catalogue process ${process.code}` : '',
          '. It is one row of the record of processing (RoPA).',
        ].join('')}
      />
      {firstValue((await searchParams).saved) ? (
        <Callout tone="success" title="Activity saved">
          <p>
            Its personal data is also listed on the department’s personal data page. Review each
            answer the catalogue suggested.
          </p>
        </Callout>
      ) : null}
      <ActivityForm
        action={saveActivityAction.bind(null, { ...target, ref })}
        deleteAction={deleteActivityAction.bind(null, { ...target, ref })}
        values={form.values}
        kb={form.kb}
        held={form.held}
        departments={form.departments.map((row) => ({ code: row.code, name: row.name }))}
        owners={form.owners}
        disabled={!form.canEdit}
      />
    </>
  )
}
