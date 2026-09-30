import { NextResponse } from 'next/server'

/** An Excel workbook as a download that is never cached. */
export const workbookResponse = (workbook: { fileName: string; content: Buffer }) =>
  new NextResponse(new Uint8Array(workbook.content), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${workbook.fileName.replace(/["\\\r\n]/g, '_')}"`,
      'Cache-Control': 'no-store',
    },
  })
