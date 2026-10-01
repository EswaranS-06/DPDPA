import { PageHeader } from '@duatf/core-ui'
import type { Metadata } from 'next'
import { ClientForm } from '@/components/forms/ClientForm'
import { PermissionNotice } from '@/components/PermissionNotice'
import { permissionFor } from '@/server/auth'
import { clientFormOptions, clientFormValues, loadClient } from '@/server/clients'
import { updateClientAction } from '../../actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Edit client' }

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const client = await loadClient((await params).code)
  const { denial } = await permissionFor('client.edit', { clientId: client.id })
  if (denial) {
    return (
      <PermissionNotice
        denial={denial}
        back={{ href: `/clients/${client.code}`, label: `Back to ${client.name}` }}
      />
    )
  }
  return (
    <>
      <PageHeader
        kicker={<span className="code">{client.code}</span>}
        title="Edit profile"
        lede="The organisation's details, contacts, applicability and assessment period."
      />
      <ClientForm
        action={updateClientAction.bind(null, client.id, client.code)}
        options={await clientFormOptions()}
        initial={clientFormValues(client)}
        cancelHref={`/clients/${client.code}`}
      />
    </>
  )
}
