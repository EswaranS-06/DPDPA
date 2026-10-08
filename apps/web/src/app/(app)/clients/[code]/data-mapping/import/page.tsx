import { can } from '@duatf/core-access'
import { PageHeader } from '@duatf/core-ui'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ImportForm } from '@/components/data/ImportForm'
import { loadClient } from '@/server/clients'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import { importAction } from '../actions'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string }>; searchParams: SearchParams }

const KINDS = {
  ropa: {
    title: 'Import the record of processing',
    lede: 'Bring back a RoPA workbook exported from DUATF and edited in Excel. Rows with an Activity ID change that activity; rows without one add an activity; rows marked Remove delete theirs. Rows taken out of the sheet are left alone.',
    noun: { one: 'activity', many: 'activities' },
    file: 'ropa',
    view: 'ropa',
  },
  elements: {
    title: 'Import data elements',
    lede: 'Bring back a data element workbook exported from DUATF and edited in Excel. Each row is one data element of one department: a new row adds it, a changed row updates it, and a row marked Remove takes it off the department.',
    noun: { one: 'data element', many: 'data elements' },
    file: 'elements',
    view: 'elements',
  },
} as const

export const generateMetadata = async ({ searchParams }: Props): Promise<Metadata> => ({
  title:
    firstValue((await searchParams).kind) === 'elements'
      ? 'Import data elements'
      : 'Import the RoPA',
})

export default async function Page({ params, searchParams }: Props) {
  const client = await loadClient((await params).code)
  const kind = firstValue((await searchParams).kind) === 'elements' ? 'elements' : 'ropa'
  const ctx = await serviceContext()
  if (!can(ctx.principal, 'department.manage', { clientId: client.id })) notFound()
  const copy = KINDS[kind]
  const base = `/clients/${client.code}/data-mapping`
  return (
    <>
      <PageHeader title={copy.title} lede={copy.lede} />
      <ImportForm
        action={importAction.bind(null, { clientId: client.id, clientCode: client.code, kind })}
        noun={copy.noun}
        exportHref={`${base}/${copy.file}`}
        doneHref={`${base}?view=${copy.view}`}
      />
    </>
  )
}
