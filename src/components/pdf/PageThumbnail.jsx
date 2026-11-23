import { useEffect, useRef, useState } from 'react'
import { renderPageToCanvas } from '../../services/pdfRenderer'

export function PageThumbnail({ pdfDocument, pageNumber, active, onClick }) {
  const canvasRef = useRef(null)
  const [isRendering, setIsRendering] = useState(false)

  useEffect(() => {
    let mounted = true

    async function renderThumbnail() {
      if (!pdfDocument || !canvasRef.current) {
        return
      }

      setIsRendering(true)
      try {
        await renderPageToCanvas({
          pdfDocument,
          pageNumber,
          scale: 0.18,
          canvas: canvasRef.current,
        })
      } catch {
        // Non-blocking thumbnail failures should not break page navigation.
      } finally {
        if (mounted) {
          setIsRendering(false)
        }
      }
    }

    renderThumbnail()

    return () => {
      mounted = false
    }
  }, [pdfDocument, pageNumber])

  return (
    <button
      type="button"
      onClick={() => onClick(pageNumber)}
      className={[
        'group w-full rounded-lg border p-2 text-left transition',
        active
          ? 'border-cyan-300 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(68,205,244,0.25)]'
          : 'border-slate-700 bg-slate-900/40 hover:border-cyan-300/40',
      ].join(' ')}
    >
      <div className="mb-2 flex items-center justify-between px-1 text-[11px] text-slate-400">
        <span>Page {pageNumber}</span>
        {isRendering ? <span className="text-cyan-200">rendering</span> : null}
      </div>
      <div className="overflow-hidden rounded border border-slate-700 bg-white">
        <canvas ref={canvasRef} className="block h-auto w-full" />
      </div>
    </button>
  )
}
