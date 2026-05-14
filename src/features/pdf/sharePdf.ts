export async function sharePdf(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: 'application/pdf' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      throw err
    }
  } else {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}
