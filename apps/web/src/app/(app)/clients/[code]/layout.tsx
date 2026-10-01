import type { ReactNode } from 'react'
import { loadClient } from '@/server/clients'
import styles from '../clients.module.css'

export const dynamic = 'force-dynamic'

type Props = { children: ReactNode; params: Promise<{ code: string }> }

/** A client's pages. The sidebar carries the client and its sections; each page has its title. */
export default async function ClientLayout({ children, params }: Props) {
  await loadClient((await params).code)
  return <div className={styles.page}>{children}</div>
}
