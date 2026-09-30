export type SearchParams = Promise<Record<string, string | string[] | undefined>>

/** The first value of a query parameter, or undefined when absent or empty. */
export const firstValue = (value: string | string[] | undefined): string | undefined => {
  const first = Array.isArray(value) ? value[0] : value
  return first === undefined || first === '' ? undefined : first
}
