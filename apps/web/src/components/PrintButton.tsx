'use client'

import { buttonClass } from '@duatf/core-ui'

/** Opens the browser's print dialog, where the report can also be saved as PDF. */
export const PrintButton = () => (
  <button type="button" className={`${buttonClass()} no-print`} onClick={() => window.print()}>
    Print or save as PDF
  </button>
)
