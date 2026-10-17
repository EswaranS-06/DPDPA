import { AccessDeniedError } from '@duatf/core-access'
import { NotFoundError } from '@duatf/feature-compliance-api'
import { NextResponse } from 'next/server'

/** A Word file as a download that is never cached. */
export const documentResponse = (file: { fileName: string; content: Buffer }) =>
  new NextResponse(new Uint8Array(file.content), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${file.fileName.replace(/["\\\r\n]/g, '_')}"`,
      'Cache-Control': 'no-store',
    },
  })

/** Builds a download, answering "not found" to someone who may not have it or a record that is not there. */
export const download = async (build: () => Promise<{ fileName: string; content: Buffer }>) => {
  try {
    return documentResponse(await build())
  } catch (error) {
    if (error instanceof AccessDeniedError || error instanceof NotFoundError) {
      return new NextResponse('Not found', { status: 404 })
    }
    throw error
  }
}
