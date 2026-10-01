import { PageHeader } from '@duatf/core-ui'
import type { Metadata } from 'next'
import { ClientForm } from '@/components/forms/ClientForm'
import { PermissionNotice } from '@/components/PermissionNotice'
import { permissionFor } from '@/server/auth'
import { clientFormOptions } from '@/server/clients'
import { createClientAction } from '../actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Onboard client' }

export default async function Page() {
  const { denial } = await permissionFor('client.create')
  if (denial)
    return (
      <PermissionNotice denial={denial} back={{ href: '/clients', label: 'Back to clients' }} />
    )
  return (
    <>
      <PageHeader
        title="Onboard a client"
        lede="The profile drives scoping: the sector overlay, whether the DPDP Act applies and the assessment period. You can change it later."
      />
      <ClientForm
        action={createClientAction}
        options={await clientFormOptions()}
        cancelHref="/clients"
      />
    </>
  )
}
