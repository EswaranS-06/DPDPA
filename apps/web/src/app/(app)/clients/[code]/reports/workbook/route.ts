import { AccessDeniedError } from '@duatf/core-access'
import { buildComplianceWorkbook } from '@duatf/feature-compliance-api'
import { NextResponse } from 'next/server'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import { workbookResponse } from '@/server/workbook'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ code: string }> }

/** The client's workbook: dashboard, departments, risk register, findings, remediation, answers. */
export const GET = async (_request: Request, { params }: Context) => {
  const client = await loadClient((await params).code)
  try {
    return workbookResponse(await buildComplianceWorkbook(await serviceContext(), client.id))
  } catch (error) {
    if (error instanceof AccessDeniedError) return new NextResponse('Not found', { status: 404 })
    throw error
  }
}
