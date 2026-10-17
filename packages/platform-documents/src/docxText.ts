import JSZip from 'jszip'

// Reading a Word file back, for tests and checks: its paragraphs as text and its pictures.

const decode = (text: string) =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')

/** Each paragraph of the body (table cells included), in order, as plain text. */
export const documentText = async (docx: Buffer): Promise<string[]> => {
  const zip = await JSZip.loadAsync(docx)
  const xml = await zip.file('word/document.xml')?.async('string')
  if (!xml) throw new Error('Not a Word document: word/document.xml is missing.')
  return [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map((match) =>
    decode(
      [...match[0].matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>|<w:tab\/>/g)]
        .map((part) => (part[0] === '<w:tab/>' ? '\t' : (part[1] ?? '')))
        .join(''),
    ),
  )
}

/** The pictures in the file: their names and sizes in bytes. */
export const documentMedia = async (docx: Buffer): Promise<{ name: string; bytes: number }[]> => {
  const zip = await JSZip.loadAsync(docx)
  const media = Object.values(zip.files).filter(
    (file) => file.name.startsWith('word/media/') && !file.dir,
  )
  return Promise.all(
    media.map(async (file) => ({
      name: file.name,
      bytes: (await file.async('uint8array')).byteLength,
    })),
  )
}
