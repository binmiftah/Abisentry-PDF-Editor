import { useCallback, useEffect, useRef, useState } from 'react'
import { PageStage } from './PageStage.tsx'
import type { StrokeStyle, TextStyle } from './types.ts'
import './editor.css'

const DEFAULT_STROKE: StrokeStyle = {
  color: '#0f172a',
  strokeWidth: 2,
  fill: null,
  fillOpacity: 1,
  opacity: 1,
  cap: 'round',
  dash: null,
  brush: 'pen',
}

const DEFAULT_TEXT_STYLE: TextStyle = {
  fontId: 'helvetica',
  fontSize: 18,
  color: '#111827',
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  align: 'left',
  width: 220,
  autoWidth: true,
  height: null,
}

export function ReferenceTextPage({
  pdfDocument,
  pageNumber,
  zoom,
  annotations,
  onAnnotationsChange,
  onPushBaseline,
  onVisible,
  interactive = true,
  onAddText,
}) {
  const pageIndex = pageNumber - 1
  const [selectedId, setSelectedId] = useState(null)
  const [hoverId, setHoverId] = useState(null)
  const [focusId, setFocusId] = useState(null)
  const [selectedContent, setSelectedContent] = useState(null)
  const wrapperRef = useRef(null)
  const annotationsRef = useRef(annotations)
  annotationsRef.current = annotations
  const epochRef = useRef(0)

  const [pageProxy, setPageProxy] = useState(null)

  useEffect(() => {
    let active = true
    setPageProxy(null)
    pdfDocument.getPage(pageNumber).then((loadedPage) => {
      if (active) setPageProxy(loadedPage)
    }).catch(() => undefined)
    return () => { active = false }
  }, [pdfDocument, pageNumber])

  const getAnnotations = useCallback(() => annotationsRef.current, [])
  const replaceAnnotations = useCallback((next) => {
    annotationsRef.current = next
    epochRef.current += 1
    onAnnotationsChange(pageNumber, next)
  }, [onAnnotationsChange, pageNumber])
  const pushBaseline = useCallback((baseline) => {
    onPushBaseline(pageNumber, baseline)
  }, [onPushBaseline, pageNumber])
  const consumeFocus = useCallback(() => setFocusId(null), [])
  const requestFocus = useCallback((id) => setFocusId(id), [])
  const handleVisible = useCallback(() => onVisible?.(pageNumber), [onVisible, pageNumber])
  const handleDoubleClick = useCallback((event) => {
    if (!interactive || !onAddText) return
    const target = event.target
    if (target instanceof Element && target.closest('.content-editor, .content-cover, .content-graphic, .content-tail, .content-glyphs, .hit-layer, .rotate-handle, button')) return
    const bounds = wrapperRef.current?.getBoundingClientRect()
    if (!bounds) return
    onAddText({ x: event.clientX - bounds.left, y: event.clientY - bounds.top })
  }, [interactive, onAddText])

  useEffect(() => {
    const node = wrapperRef.current
    if (!node) return undefined
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) handleVisible()
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0.25 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [handleVisible, pageProxy])

  if (!pageProxy) {
    return <section data-page-number={pageNumber} className="mx-auto min-h-[400px] bg-white shadow-lg" />
  }

  const viewport = pageProxy.getViewport({ scale: 1 })

  return (
    <section
      ref={wrapperRef}
      data-page-number={pageNumber}
      className="w-fit"
      onMouseEnter={handleVisible}
      onDoubleClick={handleDoubleClick}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: interactive ? 10 : 1,
        pointerEvents: interactive ? 'auto' : 'none',
        width: viewport.width * zoom,
        height: viewport.height * zoom,
        '--paper': '#ffffff',
        '--paper-edge': '#cbd5e1',
        '--ink': '#0f172a',
        '--ink-muted': '#64748b',
        '--panel': '#ffffff',
        '--section': '#f1f5f9',
        '--field': '#ffffff',
        '--line': 'rgba(15, 23, 42, 0.14)',
        '--edge': '#cbd5e1',
        '--accent': '#0891b2',
        '--on-accent': '#ffffff',
        '--ff-sans': 'Arial, sans-serif',
        '--round-md': '8px',
        '--elev-2': '0 8px 24px rgba(0,0,0,.16)',
      }}
    >
      <PageStage
        page={pageProxy}
        pageIndex={pageIndex}
        scale={zoom}
        baseWidth={viewport.width}
        baseHeight={viewport.height}
        rotation={0}
        spin={0}
        annotations={annotations}
        tool="select"
        shape="rect"
        stroke={DEFAULT_STROKE}
        textStyle={DEFAULT_TEXT_STYLE}
        selectedId={selectedId}
        hoverId={hoverId}
        listHoverId={null}
        objectNumbers={new Map()}
        onHover={setHoverId}
        focusId={focusId}
        getAnnotations={getAnnotations}
        onReplace={replaceAnnotations}
        onPushBaseline={pushBaseline}
        onSelect={setSelectedId}
        onRequestFocus={requestFocus}
        onConsumeFocus={consumeFocus}
        getEpoch={() => epochRef.current}
        selectedContent={selectedContent}
        onSelectContent={setSelectedContent}
        onFormatState={() => undefined}
        registerFormat={() => undefined}
      />
    </section>
  )
}
