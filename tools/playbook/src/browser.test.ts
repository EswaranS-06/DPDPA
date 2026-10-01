import { describe, expect, it } from 'vitest'
import { pickTab, type TabLike } from './browser.ts'

const BASE = 'http://192.168.0.110:53000'

const tab = (url: string, closed = false): TabLike & { name: string } => ({
  name: url,
  url: () => url,
  isClosed: () => closed,
})

const windowWith = (...pages: ReturnType<typeof tab>[]) => {
  const opened: ReturnType<typeof tab>[] = []
  return {
    opened,
    pages: () => pages,
    newPage: () => {
      const page = tab('about:blank')
      opened.push(page)
      return Promise.resolve(page)
    },
  }
}

describe('guide window tabs', () => {
  it('TC-C18.2-01 reuses the tab the playbook opened and opens a new one only when none is left', async () => {
    // A DUATF tab is reused, even when other tabs are open.
    const onApp = windowWith(tab('https://example.org/'), tab(`${BASE}/clients/NADALL`))
    const first = await pickTab(onApp, BASE)
    expect([first.page.name, first.reused, onApp.opened.length]).toEqual([
      `${BASE}/clients/NADALL`,
      true,
      0,
    ])

    // A tab on the sign-in page is the same tab, half-way through signing in.
    const signingIn = windowWith(
      tab('http://192.168.0.110:58080/realms/duatf/protocol/openid-connect/auth'),
    )
    const second = await pickTab(signingIn, BASE)
    expect([second.reused, signingIn.opened.length]).toEqual([true, 0])

    // A freshly opened window's empty tab is used, and reported as new.
    const fresh = windowWith(tab('about:blank'))
    const third = await pickTab(fresh, BASE)
    expect([third.page.name, third.reused, fresh.opened.length]).toEqual(['about:blank', false, 0])

    // Closed tabs do not count; with nothing left a new tab opens.
    const closed = windowWith(tab(`${BASE}/`, true))
    const fourth = await pickTab(closed, BASE)
    expect([fourth.reused, closed.opened.length]).toEqual([false, 1])
  })
})
