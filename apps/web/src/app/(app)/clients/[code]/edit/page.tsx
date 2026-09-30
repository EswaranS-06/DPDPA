import type { Metadata } from 'next'
import { ClientForm } from '@/components/forms/ClientForm'
import { requireCapability } from '@/server/auth'
import { clientFormOptions, clientFormValues, loadClient } from '@/server/clients'
import { updateClientAction } from '../../actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Edit client' }

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const client = await loadClient((await params).code)
  await requireCapability('client.edit', { clientId: client.id })
  return (
    <ClientForm
      action={updateClientAction.bind(null, client.id, client.code)}
      options={await clientFormOptions()}
      initial={clientFormValues(client)}
      cancelHref={`/clients/${client.code}`}
    />
  )
}
