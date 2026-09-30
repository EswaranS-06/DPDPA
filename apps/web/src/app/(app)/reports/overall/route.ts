import { AccessDeniedError } from '@duatf/core-access'
import { buildPortfolioWorkbook } from '@duatf/feature-compliance-api'
import { NextResponse } from 'next/server'
import { serviceContext } from '@/server/services'
import { workbookResponse } from '@/server/workbook'

export const dynamic = 'force-dynamic'

/** The overall workbook across every client the user may export. */
export const GET = async () => {
  try {
    return workbookResponse(await buildPortfolioWorkbook(await serviceContext()))
  } catch (error) {
    if (error instanceof AccessDeniedError) return new NextResponse('Not found', { status: 404 })
    throw error
  }
}
