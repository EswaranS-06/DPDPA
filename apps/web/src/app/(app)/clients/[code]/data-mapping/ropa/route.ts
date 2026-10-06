import { AccessDeniedError } from '@duatf/core-access'
import { buildRopaWorkbook, NotFoundError } from '@duatf/feature-compliance-api'
import { NextResponse } from 'next/server'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import { workbookResponse } from '@/server/workbook'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ code: string }> }

/** The record of processing: one row per department, the data inventory and the data flows. */
export const GET = async (_request: Request, { params }: Context) => {
  const client = await loadClient((await params).code)
  try {
    return workbookResponse(await buildRopaWorkbook(await serviceContext(), client.id))
  } catch (error) {
    if (error instanceof AccessDeniedError || error instanceof NotFoundError) {
      return new NextResponse('Not found', { status: 404 })
    }
    throw error
  }
}
