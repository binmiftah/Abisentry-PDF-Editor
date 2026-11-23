import { useEffect, useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight, Expand, Minus, Plus } from 'lucide-react'
import { PDFPage } from '../pdf/PDFPage'
import { PDFUploader } from '../pdf/PDFUploader'

function clampZoom(value) {
  return Math.min(Math.max(value, 0.25), 4)
}

export function Workspace({
  hasDocument,
  pages,
  pageEdits,
  referenceAnnotations,
  onReferenceAnnotationsChange,
  onPushReferenceBaseline,
  pdfDocument,
  currentPage,
  zoom,
  fitMode,
  selectedTool,
  setCurrentPage,
  setZoom,
  setFitMode,
  setPageEdits,
  onSelectObject,
  onClearObject,
  onRegisterCanvas,
  onUnregisterCanvas,
  onFileSelected,
}) {
  const scrollRef = useRef(null)

  useEffect(() => {
    const container = scrollRef.current
    if (!container || !hasDocument) {
      return
    }

    const target = container.querySelector(`[data-page-number="${currentPage}"]`)
    if (target) {
      target.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [currentPage, hasDocument])

  const activePage = useMemo(
    () => pages.find((page) => page.pageNumber === currentPage) || pages[0],
    [currentPage, pages],
  )

  useEffect(() => {
    if (!fitMode || !activePage || !hasDocument) {
      return
    }

    const container = scrollRef.current
    if (!container) {
      return
    }

    const containerWidth = container.clientWidth - 64
    const containerHeight = container.clientHeight - 64

    if (containerWidth <= 0 || containerHeight <= 0) {
      return
    }

    const widthZoom = containerWidth / activePage.width
    const pageZoom = Math.min(widthZoom, containerHeight / activePage.height)

    const nextZoom = fitMode === 'width' ? widthZoom : pageZoom
    setZoom(clampZoom(nextZoom))
  }, [activePage, fitMode, hasDocument, setZoom])

  useEffect(() => {
    if (!fitMode) {
      return
    }

    const container = scrollRef.current
    if (!container) {
      return
    }

    const resizeObserver = new ResizeObserver(() => {
      if (!activePage) {
        return
      }

      const containerWidth = container.clientWidth - 64
      const containerHeight = container.clientHeight - 64
      const widthZoom = containerWidth / activePage.width
      const pageZoom = Math.min(widthZoom, containerHeight / activePage.height)
      const nextZoom = fitMode === 'width' ? widthZoom : pageZoom
      setZoom(clampZoom(nextZoom))
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [activePage, fitMode, setZoom])

  const onZoomIn = () => setZoom(clampZoom(zoom + 0.1))
  const onZoomOut = () => setZoom(clampZoom(zoom - 0.1))

  if (!hasDocument) {
    return (
      <main className="grid flex-1 place-items-center bg-[var(--color-bg)] p-4">
        <PDFUploader onFileSelected={onFileSelected} />
      </main>
    )
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-[var(--color-bg)]">
      <div className="border-b border-slate-800 px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-cyan-300/50 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={14} />
            Prev
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= pages.length}
            className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-cyan-300/50 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight size={14} />
          </button>

          <div className="mx-1 h-6 w-px bg-slate-700" />

          <button
            type="button"
            onClick={onZoomOut}
            className="inline-flex items-center rounded border border-slate-700 p-1 text-slate-300 hover:border-cyan-300/50 hover:text-cyan-200"
            title="Zoom out"
          >
            <Minus size={14} />
          </button>
          <span className="min-w-14 text-center text-xs font-semibold text-slate-300">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={onZoomIn}
            className="inline-flex items-center rounded border border-slate-700 p-1 text-slate-300 hover:border-cyan-300/50 hover:text-cyan-200"
            title="Zoom in"
          >
            <Plus size={14} />
          </button>

          <button
            type="button"
            onClick={() => setFitMode('width')}
            className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-cyan-300/50 hover:text-cyan-200"
          >
            Fit Width
          </button>
          <button
            type="button"
            onClick={() => setFitMode('page')}
            className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-cyan-300/50 hover:text-cyan-200"
          >
            <Expand size={12} />
            Fit Page
          </button>

          <div className="ml-auto rounded border border-slate-700 px-2 py-1 text-xs text-slate-400">
            Page {currentPage} / {pages.length}
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto px-8 py-8">
        <div className="space-y-8">
          {pages.map((page) => (
            <PDFPage
              key={page.pageNumber}
              pdfDocument={pdfDocument}
              pageNumber={page.pageNumber}
              zoom={zoom}
              selectedTool={selectedTool}
              editState={pageEdits[page.pageNumber]}
              referenceAnnotations={referenceAnnotations?.[page.pageNumber] || []}
              onReferenceAnnotationsChange={onReferenceAnnotationsChange}
              onPushReferenceBaseline={onPushReferenceBaseline}
              onEditStateChange={setPageEdits}
              onSelectObject={onSelectObject}
              onClearObject={onClearObject}
              onRegisterCanvas={onRegisterCanvas}
              onUnregisterCanvas={onUnregisterCanvas}
              onVisible={setCurrentPage}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
