import { AccessDeniedError } from '@duatf/core-access'
import { evidenceDownloadUrl, getEvidence, NotFoundError } from '@duatf/feature-compliance-api'
import { NextResponse } from 'next/server'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ code: string; evd: string }> }

/** Checks access, records the download, then sends the browser to a five-minute link. */
export const GET = async (_request: Request, { params }: Context) => {
  const { code, evd } = await params
  try {
    const client = await loadClient(code)
    const ctx = await serviceContext()
    const item = await getEvidence(ctx, client.id, decodeURIComponent(evd))
    const url = await evidenceDownloadUrl(ctx, client.id, item.id)
    return NextResponse.redirect(url, { status: 303, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AccessDeniedError) {
      return new NextResponse('Not found', { status: 404 })
    }
    throw error
  }
}
