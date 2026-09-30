export type ScanResult = { clean: boolean; engine: string; signature?: string }

export type FileScanner = {
  scan: (content: Buffer) => Promise<ScanResult>
}

/** Placeholder until ClamAV is added in C12; records that no scan engine ran. */
export const noopScanner: FileScanner = {
  scan: () => Promise.resolve({ clean: true, engine: 'none' }),
}
