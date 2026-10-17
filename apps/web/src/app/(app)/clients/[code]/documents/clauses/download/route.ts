import { DOCUMENT_FORMATS, exportClause, type DocumentFormat } from '@duatf/feature-compliance-api'
import { loadClient } from '@/server/clients'
import { fileDownload } from '@/server/fileResponse'
import { serviceContext } from '@/server/services'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ code: string }> }

/** A clause or a clause pack as a file, with the same choices as the clause page. */
export const GET = async (request: Request, { params }: Context) => {
  const client = await loadClient((await params).code)
  const query = new URL(request.url).searchParams
  const requested = query.get('format') ?? 'docx'
  const format: DocumentFormat = (DOCUMENT_FORMATS as readonly string[]).includes(requested)
    ? (requested as DocumentFormat)
    : 'docx'
  return fileDownload(async () =>
    exportClause(
      await serviceContext(),
      client.id,
      {
        templateId: query.get('doc') || undefined,
        presets: query.getAll('preset'),
        number: query.get('number') || undefined,
        title: query.get('title') || undefined,
        intro: query.get('intro') || undefined,
        replace: query.get('replace') ?? undefined,
      },
      format,
    ),
  )
}
