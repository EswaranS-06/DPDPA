import { buildGapReport } from '@duatf/feature-compliance-api'
import { loadClient } from '@/server/clients'
import { download } from '@/server/document'
import { serviceContext } from '@/server/services'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ code: string; asm: string }> }

/** The gap-assessment report of one cycle, as Word. */
export const GET = async (_request: Request, { params }: Context) => {
  const { code, asm } = await params
  const client = await loadClient(code)
  return download(async () => buildGapReport(await serviceContext(), client.id, asm))
}
