/** Display preferences, kept in cookies so the server renders the right theme on first paint. */
export const THEMES = ['system', 'light', 'dark', 'contrast'] as const
export type Theme = (typeof THEMES)[number]

export const DENSITIES = ['comfortable', 'compact'] as const
export type Density = (typeof DENSITIES)[number]

export const THEME_COOKIE = 'duatf-theme'
export const DENSITY_COOKIE = 'duatf-density'

export const THEME_LABEL: Record<Theme, string> = {
  system: 'Match the system',
  light: 'Light',
  dark: 'Dark',
  contrast: 'High contrast',
}

export const DENSITY_LABEL: Record<Density, string> = {
  comfortable: 'Comfortable',
  compact: 'Compact',
}

export const asTheme = (value: string | undefined): Theme =>
  THEMES.find((theme) => theme === value) ?? 'system'

export const asDensity = (value: string | undefined): Density =>
  DENSITIES.find((density) => density === value) ?? 'comfortable'
