import ePub from 'epubjs'

export async function extractEpubCoverDataUrl(buffer: ArrayBuffer): Promise<string | null> {
  const book = ePub(buffer.slice(0))
  await book.ready
  try {
    const url = await book.coverUrl()
    if (!url) return null
    const res = await fetch(url)
    const blob = await res.blob()
    return await blobToDataUrl(blob)
  } catch {
    return null
  } finally {
    book.destroy()
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}
