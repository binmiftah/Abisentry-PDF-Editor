import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib'

function clamp01(value) {
  return Math.max(0, Math.min(1, value))
}

function parseColor(value, fallback = rgb(0, 0, 0)) {
  if (!value || typeof value !== 'string') {
    return fallback
  }

  if (value.startsWith('#')) {
    const hex = value.slice(1)
    const normalized =
      hex.length === 3
        ? `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
        : hex.slice(0, 6)

    if (normalized.length === 6) {
      const red = Number.parseInt(normalized.slice(0, 2), 16) / 255
      const green = Number.parseInt(normalized.slice(2, 4), 16) / 255
      const blue = Number.parseInt(normalized.slice(4, 6), 16) / 255
      return rgb(clamp01(red), clamp01(green), clamp01(blue))
    }
  }

  const rgbaMatch = value.match(/rgba?\(([^)]+)\)/i)
  if (rgbaMatch) {
    const values = rgbaMatch[1].split(',').map((item) => item.trim())
    const red = (Number.parseFloat(values[0]) || 0) / 255
    const green = (Number.parseFloat(values[1]) || 0) / 255
    const blue = (Number.parseFloat(values[2]) || 0) / 255
    return rgb(clamp01(red), clamp01(green), clamp01(blue))
  }

  return fallback
}

function getPdfBoxFromCanvasObject(viewport, objectJson) {
  const left = objectJson.left || 0
  const top = objectJson.top || 0
  const width = (objectJson.width || 0) * (objectJson.scaleX || 1)
  const height = (objectJson.height || 0) * (objectJson.scaleY || 1)

  const [x1, y1] = viewport.convertToPdfPoint(left, top)
  const [x2, y2] = viewport.convertToPdfPoint(left + width, top + height)

  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  }
}

function toUint8ArrayFromDataUrl(dataURL) {
  const base64 = dataURL.split(',')[1]
  if (typeof atob === 'function') {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }

    return bytes
  }

  if (typeof globalThis.Buffer !== 'undefined') {
    return Uint8Array.from(globalThis.Buffer.from(base64, 'base64'))
  }

  throw new Error('Unable to decode image data URL in this environment')
}

function resolveFontName(objectJson) {
  const family = String(objectJson.fontFamily || 'Helvetica').toLowerCase()
  const isBold = String(objectJson.fontWeight || '').toLowerCase() === 'bold' || Number(objectJson.fontWeight) >= 600
  const isItalic = String(objectJson.fontStyle || '').toLowerCase() === 'italic'

  if (family.includes('courier')) {
    if (isBold && isItalic) return StandardFonts.CourierBoldOblique
    if (isBold) return StandardFonts.CourierBold
    if (isItalic) return StandardFonts.CourierOblique
    return StandardFonts.Courier
  }

  if (family.includes('times') || family.includes('georgia')) {
    if (isBold && isItalic) return StandardFonts.TimesRomanBoldItalic
    if (isBold) return StandardFonts.TimesRomanBold
    if (isItalic) return StandardFonts.TimesRomanItalic
    return StandardFonts.TimesRoman
  }

  if (isBold && isItalic) return StandardFonts.HelveticaBoldOblique
  if (isBold) return StandardFonts.HelveticaBold
  if (isItalic) return StandardFonts.HelveticaOblique
  return StandardFonts.Helvetica
}

export async function exportEditedPdf({ sourceBytes, pageEdits, pages, pdfDocumentProxy }) {
  if (!sourceBytes) {
    throw new Error('Missing source PDF bytes')
  }

  const outputPdf = await PDFDocument.load(sourceBytes)
  const outputPages = outputPdf.getPages()

  const fontCache = new Map()

  for (const pageMeta of pages) {
    const pageNumber = pageMeta.pageNumber
    const editState = pageEdits[pageNumber]
    if (!editState?.json?.objects?.length) {
      continue
    }

    const outputPage = outputPages[pageNumber - 1]
    if (!outputPage) {
      continue
    }

    const viewportScale = editState.width / pageMeta.width
    const pdfJsPage = await pdfDocumentProxy.getPage(pageNumber)
    const viewport = pdfJsPage.getViewport({ scale: viewportScale })

    for (const objectJson of editState.json.objects) {
      const type = objectJson.type

      if (type === 'i-text' || type === 'textbox' || type === 'text') {
        const fontName = resolveFontName(objectJson)
        if (!fontCache.has(fontName)) {
          const embeddedFont = await outputPdf.embedFont(fontName)
          fontCache.set(fontName, embeddedFont)
        }

        const box = getPdfBoxFromCanvasObject(viewport, objectJson)
        const fontSizeInPixels = (objectJson.fontSize || 16) * (objectJson.scaleY || 1)
        const fontSize = fontSizeInPixels / viewportScale
        const text = objectJson.text || ''

        outputPage.drawText(text, {
          x: box.x,
          y: box.y + Math.max(0, box.height - fontSize),
          size: Math.max(2, fontSize),
          font: fontCache.get(fontName),
          color: parseColor(objectJson.fill, rgb(0.06, 0.09, 0.16)),
          maxWidth: Math.max(1, box.width),
          lineHeight: Math.max(2, fontSize * (objectJson.lineHeight || 1.16)),
          wordBreaks: [' '],
          align: ['left', 'center', 'right'].includes(objectJson.textAlign)
            ? objectJson.textAlign
            : 'left',
          rotate: degrees(-(objectJson.angle || 0)),
        })
        continue
      }

      if (type === 'rect') {
        const box = getPdfBoxFromCanvasObject(viewport, objectJson)
        const strokeWidth = (objectJson.strokeWidth || 0) / viewportScale

        outputPage.drawRectangle({
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          color: parseColor(objectJson.fill, rgb(1, 1, 1)),
          borderColor: objectJson.stroke ? parseColor(objectJson.stroke, rgb(0.82, 0.84, 0.86)) : undefined,
          borderWidth: strokeWidth > 0 ? strokeWidth : undefined,
          rotate: degrees(-(objectJson.angle || 0)),
        })
        continue
      }

      if (type === 'circle') {
        const box = getPdfBoxFromCanvasObject(viewport, objectJson)
        outputPage.drawEllipse({
          x: box.x + box.width / 2,
          y: box.y + box.height / 2,
          xScale: box.width / 2,
          yScale: box.height / 2,
          color: parseColor(objectJson.fill, rgb(0.13, 0.77, 0.37)),
          borderColor: objectJson.stroke ? parseColor(objectJson.stroke, rgb(0.13, 0.77, 0.37)) : undefined,
          borderWidth: objectJson.strokeWidth ? objectJson.strokeWidth / viewportScale : undefined,
        })
        continue
      }

      if (type === 'line') {
        const left = objectJson.left || 0
        const top = objectJson.top || 0
        const x1Canvas = left + (objectJson.x1 || 0) * (objectJson.scaleX || 1)
        const y1Canvas = top + (objectJson.y1 || 0) * (objectJson.scaleY || 1)
        const x2Canvas = left + (objectJson.x2 || 0) * (objectJson.scaleX || 1)
        const y2Canvas = top + (objectJson.y2 || 0) * (objectJson.scaleY || 1)

        const [x1, y1] = viewport.convertToPdfPoint(x1Canvas, y1Canvas)
        const [x2, y2] = viewport.convertToPdfPoint(x2Canvas, y2Canvas)

        outputPage.drawLine({
          start: { x: x1, y: y1 },
          end: { x: x2, y: y2 },
          thickness: Math.max(0.5, (objectJson.strokeWidth || 2) / viewportScale),
          color: parseColor(objectJson.stroke || objectJson.fill, rgb(0.13, 0.77, 0.37)),
        })
        continue
      }

      if (type === 'image') {
        const dataURL = objectJson.dataURL || objectJson.src
        if (!dataURL || typeof dataURL !== 'string' || !dataURL.startsWith('data:image/')) {
          continue
        }

        const imageBytes = toUint8ArrayFromDataUrl(dataURL)
        const image = dataURL.includes('image/png')
          ? await outputPdf.embedPng(imageBytes)
          : await outputPdf.embedJpg(imageBytes)

        const box = getPdfBoxFromCanvasObject(viewport, objectJson)
        outputPage.drawImage(image, {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          rotate: degrees(-(objectJson.angle || 0)),
        })
      }
    }
  }

  return outputPdf.save()
}
