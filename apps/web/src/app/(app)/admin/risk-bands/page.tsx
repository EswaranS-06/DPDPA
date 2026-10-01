import { PageHeader, Panel } from '@duatf/core-ui'
import { listBands } from '@duatf/feature-compliance-api'
import type { Metadata } from 'next'
import { RiskBandsForm } from '@/components/forms/RiskForms'
import { PermissionNotice } from '@/components/PermissionNotice'
import { permissionFor } from '@/server/auth'
import { database } from '@/server/runtime'
import { updateBandsAction } from '../../clients/[code]/risks/actions'
import styles from '../../clients/clients.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Risk bands' }

export default async function Page() {
  const { denial } = await permissionFor('platform.admin')
  if (denial)
    return <PermissionNotice denial={denial} back={{ href: '/', label: 'Back to the overview' }} />
  const bands = await listBands(database().db)
  return (
    <div className={styles.page}>
      <PageHeader
        title="Risk bands"
        lede="How likelihood × impact scores (1 to 25) are rated in every client's risk register. Bands must run from 1 to 25 in order, each starting one above the previous end. Changes apply to all clients at once and are recorded in the audit log."
      />
      <Panel title="Bands" titleId="bands-title">
        <RiskBandsForm action={updateBandsAction} bands={bands} />
      </Panel>
    </div>
  )
}
