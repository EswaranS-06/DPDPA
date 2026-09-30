import { PlaybookIndexScreen } from '@duatf/feature-framework-library'
import type { Metadata } from 'next'
import { libraryApi } from '../../../server/api'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Playbooks' }

export default function Page() {
  return <PlaybookIndexScreen api={libraryApi()} />
}
