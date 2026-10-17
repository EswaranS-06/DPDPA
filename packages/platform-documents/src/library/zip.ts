import JSZip from 'jszip'

/** Files in one ZIP, each at its path. */
export const zipFiles = async (
  files: readonly { name: string; content: Buffer | string }[],
): Promise<Buffer> => {
  const zip = new JSZip()
  for (const file of files) zip.file(file.name, file.content)
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}
