/** A path on this site to return to after sign-in; anything else becomes "/". */
export const safeReturnTo = (value: string | null | undefined): string =>
  typeof value === 'string' &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !value.startsWith('/\\')
    ? value
    : '/'
