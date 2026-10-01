import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

type Tokens = Record<string, string | undefined>

const block = (pattern: RegExp): Tokens => {
  const found = pattern.exec(css)?.[1]
  if (!found) throw new Error(`No token block for ${pattern}`)
  return Object.fromEntries(
    [...found.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((match) => [
      match[1] ?? '',
      match[2]?.trim(),
    ]),
  )
}

const light = block(/^:root \{([\s\S]*?)\n\}/m)
const darkExplicit = block(/:root\[data-theme='dark'\] \{([\s\S]*?)\n\}/)
const darkSystem = block(
  /@media \(prefers-color-scheme: dark\) \{\s*:root[^{]*\{([\s\S]*?)\n {2}\}/,
)
const themes: Record<string, Tokens> = {
  light,
  dark: { ...light, ...darkExplicit },
  contrast: { ...light, ...block(/:root\[data-theme='contrast'\] \{([\s\S]*?)\n\}/) },
}

const resolve = (tokens: Tokens, name: string): string => {
  let value = tokens[name]
  while (value?.startsWith('var(--')) value = tokens[value.slice(6, -1)]
  if (!value?.startsWith('#')) throw new Error(`--${name} is not a colour: ${value}`)
  return value
}

const luminance = (hex: string) => {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

/** WCAG 2.2 contrast ratio between two colours. */
const ratio = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

// Text pairs need 4.5:1 (WCAG 1.4.3); control edges and focus need 3:1 (WCAG 1.4.11).
const PAIRS: [string, string, number][] = [
  ['text', 'bg', 4.5],
  ['text', 'surface', 4.5],
  ['text-secondary', 'bg', 4.5],
  ['text-secondary', 'surface', 4.5],
  ['text-secondary', 'surface-subtle', 4.5],
  ['text-secondary', 'surface-hover', 4.5],
  ['text-muted', 'bg', 4.5],
  ['text-muted', 'surface', 4.5],
  ['text-muted', 'surface-subtle', 4.5],
  ['link', 'surface', 4.5],
  ['link', 'bg', 4.5],
  ['on-primary', 'primary', 4.5],
  ['on-primary', 'primary-hover', 4.5],
  ['primary-text', 'primary-subtle', 4.5],
  ['primary-text', 'surface', 4.5],
  ['primary', 'surface', 3],
  ['border-control', 'surface', 3],
  ['border-control', 'bg', 3],
  ...['success', 'warning', 'danger', 'info', 'neutral', 'pending'].flatMap(
    (tone): [string, string, number][] => [
      [`${tone}-text`, `${tone}-bg`, 4.5],
      [`${tone}-text`, 'surface', 4.5],
    ],
  ),
]

describe('design tokens', () => {
  it('TC-C16.1-01 every text and control colour meets WCAG AA in light, dark and high contrast', () => {
    const failures = Object.entries(themes).flatMap(([theme, tokens]) =>
      PAIRS.filter(
        ([front, back, minimum]) =>
          ratio(resolve(tokens, `color-${front}`), resolve(tokens, `color-${back}`)) < minimum,
      ).map(([front, back, minimum]) => {
        const actual = ratio(resolve(tokens, `color-${front}`), resolve(tokens, `color-${back}`))
        return `${theme}: ${front} on ${back} is ${actual.toFixed(2)}, needs ${minimum}`
      }),
    )
    expect(failures).toEqual([])
    // The system-dark block and the chosen-dark block must be the same palette.
    expect(darkSystem).toEqual(darkExplicit)
  })
})
