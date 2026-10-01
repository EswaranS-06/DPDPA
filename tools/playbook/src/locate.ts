import type { Locator, Page } from 'playwright-core'
import type { Target } from './types.ts'

export type Vars = Record<string, string>

/** Fills {name} placeholders such as {client}. */
export const fillVars = (text: string, vars: Vars): string =>
  text.replace(/\{(\w+)\}/g, (whole, name: string) => vars[name] ?? whole)

/** The Playwright locator for a tour target, the first match unless nth is given. */
export const locatorFor = (page: Page, target: Target, vars: Vars): Locator => {
  const scope: Page | Locator =
    'within' in target && target.within ? locatorFor(page, target.within, vars) : page
  let found: Locator
  if ('role' in target) {
    found = scope.getByRole(target.role, {
      ...(target.name === undefined ? {} : { name: fillVars(target.name, vars) }),
      exact: target.exact ?? false,
    })
  } else if ('label' in target) {
    found = page.getByLabel(target.label, { exact: target.exact ?? false })
  } else if ('text' in target) {
    found = scope.getByText(target.text, { exact: target.exact ?? false })
  } else {
    found = page.locator(fillVars(target.css, vars))
  }
  return target.nth === undefined ? found.first() : found.nth(target.nth)
}

/** Plain-language name of a target, for messages ("the Onboard client link"). */
export const describeTarget = (target: Target): string => {
  if ('role' in target) return target.name ? `"${target.name}"` : `the ${target.role}`
  if ('label' in target) return `the "${target.label}" field`
  if ('text' in target) return `"${target.text}"`
  return 'the highlighted item'
}
