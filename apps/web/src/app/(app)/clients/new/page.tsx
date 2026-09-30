import { PageHeader } from '@duatf/core-ui'
import type { Metadata } from 'next'
import { ClientForm } from '@/components/forms/ClientForm'
import { requireCapability } from '@/server/auth'
import { clientFormOptions } from '@/server/clients'
import { createClientAction } from '../actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Onboard client' }

export default async function Page() {
  await requireCapability('client.create')
  return (
    <>
      <PageHeader
        title="Onboard a client"
        lede="The profile drives scoping: sector laws, applicability and the assessment period. You can change it later."
      />
      <ClientForm
        action={createClientAction}
        options={await clientFormOptions()}
        cancelHref="/clients"
      />
    </>
  )
}
