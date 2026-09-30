import { AccessDeniedError } from '@duatf/core-access'
import { buildDepartmentWorkbook, NotFoundError } from '@duatf/feature-compliance-api'
import { NextResponse } from 'next/server'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import { workbookResponse } from '@/server/workbook'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ code: string; dep: string }> }

/** One department's workbook: dashboard, answers, findings, remediation and evidence. */
export const GET = async (_request: Request, { params }: Context) => {
  const { code, dep } = await params
  const client = await loadClient(code)
  try {
    return workbookResponse(
      await buildDepartmentWorkbook(await serviceContext(), client.id, decodeURIComponent(dep)),
    )
  } catch (error) {
    if (error instanceof AccessDeniedError || error instanceof NotFoundError) {
      return new NextResponse('Not found', { status: 404 })
    }
    throw error
  }
}
