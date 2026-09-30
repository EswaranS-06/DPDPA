import { PageHeader } from '@duatf/core-ui'
import { listBands } from '@duatf/feature-compliance-api'
import type { Metadata } from 'next'
import { RiskBandsForm } from '@/components/forms/RiskForms'
import { requireCapability } from '@/server/auth'
import { database } from '@/server/runtime'
import { updateBandsAction } from '../../clients/[code]/risks/actions'
import styles from '../../clients/clients.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Risk bands' }

export default async function Page() {
  await requireCapability('platform.admin')
  const bands = await listBands(database().db)
  return (
    <div className={styles.page}>
      <PageHeader
        title="Risk bands"
        lede="How likelihood × impact scores (1 to 25) are rated in every client's risk register. Bands must run from 1 to 25 in order, each starting one above the previous end. Changes apply to all clients at once and are recorded in the audit log."
      />
      <div className={styles.panel}>
        <RiskBandsForm action={updateBandsAction} bands={bands} />
      </div>
    </div>
  )
}
