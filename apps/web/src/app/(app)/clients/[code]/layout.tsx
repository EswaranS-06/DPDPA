import type { ReactNode } from 'react'
import { ApplicabilityChip, ClientStatusChip } from '@/components/ClientChips'
import { ClientTabs } from '@/components/ClientTabs'
import { loadClient } from '@/server/clients'
import styles from '../clients.module.css'

export const dynamic = 'force-dynamic'

type Props = { children: ReactNode; params: Promise<{ code: string }> }

export default async function ClientLayout({ children, params }: Props) {
  const client = await loadClient((await params).code)
  const base = `/clients/${client.code}`
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.code}>{client.code}</span>
        <h1 className={styles.title}>{client.name}</h1>
        <div className={styles.chips}>
          <ClientStatusChip status={client.status} />
          <ApplicabilityChip applicability={client.applicability} />
        </div>
      </header>
      <ClientTabs
        tabs={[
          { href: base, label: 'Overview' },
          { href: `${base}/departments`, label: `Departments (${client.departmentCount})` },
          { href: `${base}/people`, label: 'People' },
        ]}
      />
      {children}
    </div>
  )
}
