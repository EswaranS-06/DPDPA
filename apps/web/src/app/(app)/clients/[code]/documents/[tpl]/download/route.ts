import {
  DOCUMENT_FORMATS,
  exportClientDocument,
  RECORD_DOCUMENTS,
  type DocumentFormat,
  type RecordKind,
} from '@duatf/feature-compliance-api'
import { loadClient } from '@/server/clients'
import { fileDownload } from '@/server/fileResponse'
import { serviceContext } from '@/server/services'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ code: string; tpl: string }> }

/** One library document as Word, Markdown or HTML: ?format=docx&draft=1&record=BRE-… */
export const GET = async (request: Request, { params }: Context) => {
  const { code, tpl } = await params
  const client = await loadClient(code)
  const query = new URL(request.url).searchParams
  const requested = query.get('format') ?? 'docx'
  const format: DocumentFormat = (DOCUMENT_FORMATS as readonly string[]).includes(requested)
    ? (requested as DocumentFormat)
    : 'docx'
  const kind = (RECORD_DOCUMENTS as Record<string, RecordKind | undefined>)[tpl.toUpperCase()]
  const record = query.get('record')
  return fileDownload(async () =>
    exportClientDocument(await serviceContext(), client.id, tpl, {
      format,
      draft: query.get('draft') === '1',
      record: kind && record ? { kind, code: record } : undefined,
    }),
  )
}
