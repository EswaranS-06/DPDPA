import { AccessDeniedError } from '@duatf/core-access'
import { NotFoundError, RuleError, ValidationError } from '@duatf/feature-compliance-api'
import { NextResponse } from 'next/server'

type File = { fileName: string; content: Buffer; contentType: string }

/** A generated file as a download that is never cached; refusals answer in plain words. */
export const fileDownload = async (build: () => Promise<File>) => {
  try {
    const file = await build()
    return new NextResponse(new Uint8Array(file.content), {
      headers: {
        'Content-Type': file.contentType,
        'Content-Disposition': `attachment; filename="${file.fileName.replace(/["\\\r\n]/g, '_')}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    if (error instanceof AccessDeniedError || error instanceof NotFoundError) {
      return new NextResponse('Not found', { status: 404 })
    }
    if (error instanceof RuleError || error instanceof ValidationError) {
      return new NextResponse(error.message, {
        status: 409,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }
    throw error
  }
}
