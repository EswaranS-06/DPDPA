import { NextResponse, type NextRequest } from 'next/server'
import { currentSession } from '@/server/auth'
import { searchEverything } from '@/server/search'
import { serviceContext } from '@/server/services'

export const dynamic = 'force-dynamic'

/** Results for the search palette, as JSON. Only for signed-in users; never cached. */
export const GET = async (request: NextRequest) => {
  if (!(await currentSession())) {
    return NextResponse.json({ error: 'Sign in to search.' }, { status: 401 })
  }
  const hits = await searchEverything(
    await serviceContext(),
    request.nextUrl.searchParams.get('q') ?? '',
  )
  return NextResponse.json(hits, { headers: { 'Cache-Control': 'no-store' } })
}
