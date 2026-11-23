import { GlobalWorkerOptions, Util, getDocument } from 'pdfjs-dist'

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

export async function loadPdfFromBytes(bytes) {
  const loadingTask = getDocument({ data: bytes })
  return loadingTask.promise
}

export async function getPdfPageMeta(pdfDocument) {
  const pages = []

  for (let index = 1; index <= pdfDocument.numPages; index += 1) {
    const page = await pdfDocument.getPage(index)
    const viewport = page.getViewport({ scale: 1 })

    pages.push({
      pageNumber: index,
      width: viewport.width,
      height: viewport.height,
      rotation: viewport.rotation,
    })
  }

  return pages
}

export async function renderPageToCanvas({ pdfDocument, pageNumber, scale, canvas }) {
  const page = await pdfDocument.getPage(pageNumber)
  const viewport = page.getViewport({ scale })

  const outputScale = window.devicePixelRatio || 1
  canvas.width = Math.floor(viewport.width * outputScale)
  canvas.height = Math.floor(viewport.height * outputScale)
  canvas.style.width = `${viewport.width}px`
  canvas.style.height = `${viewport.height}px`

  const context = canvas.getContext('2d', { alpha: false })
  const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null

  const renderTask = page.render({
    canvasContext: context,
    viewport,
    transform,
  })

  await renderTask.promise

  return {
    width: viewport.width,
    height: viewport.height,
  }
}

export async function getPageTextRegions({ pdfDocument, pageNumber, scale }) {
  const page = await pdfDocument.getPage(pageNumber)
  const viewport = page.getViewport({ scale })
  const textContent = await page.getTextContent()

  return textContent.items
    .filter((item) => typeof item.str === 'string' && item.str.trim().length)
    .map((item) => {
      const transform = Util.transform(viewport.transform, item.transform)
      const x = transform[4]
      const y = transform[5]

      const fontHeight = Math.max(8, Math.hypot(transform[2], transform[3]))
      const width = Math.max(4, item.width * viewport.scale)
      const height = Math.max(10, fontHeight * 1.2)

      return {
        text: item.str,
        x,
        top: y - fontHeight,
        width,
        height,
        fontSize: fontHeight,
      }
    })
}
