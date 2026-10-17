import { exportDocumentPack } from '@duatf/feature-compliance-api'
import { loadClient } from '@/server/clients'
import { fileDownload } from '@/server/fileResponse'
import { serviceContext } from '@/server/services'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ code: string }> }

/** The documents the client needs, as Word files in one ZIP; ?draft=1 while checks are open. */
export const GET = async (request: Request, { params }: Context) => {
  const client = await loadClient((await params).code)
  const draft = new URL(request.url).searchParams.get('draft') === '1'
  return fileDownload(async () => exportDocumentPack(await serviceContext(), client.id, { draft }))
}
