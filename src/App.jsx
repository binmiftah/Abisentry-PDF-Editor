import { useCallback, useMemo, useRef } from 'react'
import { AppHeader } from './components/layout/AppHeader'
import { LeftSidebar } from './components/layout/LeftSidebar'
import { MainToolbar } from './components/layout/MainToolbar'
import { PropertiesPanel } from './components/layout/PropertiesPanel'
import { Workspace } from './components/layout/Workspace'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { usePDFDocument } from './hooks/usePDFDocument'
import { exportEditedPdf } from './services/pdfExport'
import { exportAnnotatedPdf } from './integrations/editmypdf/exportPdf.ts'
import { useEditorStore } from './store/editorStore'

function App() {
  const fileInputRef = useRef(null)

  const {
    fileName,
    fileSize,
    sourceBytes,
    pdfDocument,
    pages,
    pageEdits,
    pageHistory,
    referenceAnnotations,
    referenceHistory,
    setReferenceAnnotations,
    pushReferenceBaseline,
    undoReferencePage,
    redoReferencePage,
    currentPage,
    zoom,
    fitMode,
    selectedTool,
    selectedObject,
    isLoading,
    error,
    status,
    setCurrentPage,
    setZoom,
    setFitMode,
    setSelectedTool,
    setPageEdits,
    setSelectedObject,
    clearSelectedObject,
    registerPageCanvas,
    unregisterPageCanvas,
    updateSelectedTextStyle,
    undoPageEdit,
    redoPageEdit,
    setStatus,
  } = useEditorStore()

  const { openPdfFile } = usePDFDocument()

  const hasDocument = Boolean(pdfDocument && pages.length)
  const activePage = useMemo(
    () => pages.find((page) => page.pageNumber === currentPage),
    [currentPage, pages],
  )

  const handleOpenDialog = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event) => {
    const [file] = event.target.files || []
    if (!file) {
      return
    }

    await openPdfFile(file)
    event.target.value = ''
  }

  const handleFileSelected = useCallback(
    async (file) => {
      await openPdfFile(file)
    },
    [openPdfFile],
  )

  const currentHistory = pageHistory[currentPage]
  const currentReferenceHistory = referenceHistory[currentPage]
  const canUndo = Boolean(
    (currentReferenceHistory && currentReferenceHistory.index > 0) ||
    (currentHistory && currentHistory.index > 0),
  )
  const canRedo = Boolean(
    (currentReferenceHistory && currentReferenceHistory.index < currentReferenceHistory.stack.length - 1) ||
    (currentHistory && currentHistory.index < currentHistory.stack.length - 1),
  )

  const handleExport = useCallback(async () => {
    if (!pdfDocument || !pages.length) {
      return
    }

    try {
      setStatus('Exporting edited PDF...')
      const referenceMarks = Object.values(referenceAnnotations || {}).flat()
      let exportSourceBytes = sourceBytes
      if (referenceMarks.length) {
        const pageProxies = await Promise.all(
          pages.map((page) => pdfDocument.getPage(page.pageNumber)),
        )
        exportSourceBytes = await exportAnnotatedPdf(
          new Uint8Array(sourceBytes),
          referenceMarks,
          (pageIndex, x, y) => {
            const viewport = pageProxies[pageIndex]?.getViewport({ scale: 1 })
            if (!viewport) return { x, y }
            const [pdfX, pdfY] = viewport.convertToPdfPoint(x, y)
            return { x: pdfX ?? x, y: pdfY ?? y }
          },
          0,
          pageProxies,
        )
      }
      const bytes = await exportEditedPdf({
        sourceBytes: exportSourceBytes,
        pageEdits,
        pages,
        pdfDocumentProxy: pdfDocument,
      })

      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      const exportName = fileName ? fileName.replace(/\.pdf$/i, '') : 'document'
      anchor.href = url
      anchor.download = `${exportName}-edited.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
      setStatus('Export complete')
    } catch (exportError) {
      setStatus('Export failed')
      console.error(exportError)
    }
  }, [fileName, pageEdits, pages, pdfDocument, referenceAnnotations, setStatus, sourceBytes])

  const handleUndo = useCallback(() => {
    const history = useEditorStore.getState().referenceHistory[currentPage]
    if (history && history.index > 0) undoReferencePage(currentPage)
    else undoPageEdit(currentPage)
    setStatus(`Undo on page ${currentPage}`)
  }, [currentPage, setStatus, undoPageEdit, undoReferencePage])

  const handleRedo = useCallback(() => {
    const history = useEditorStore.getState().referenceHistory[currentPage]
    if (history && history.index < history.stack.length - 1) redoReferencePage(currentPage)
    else redoPageEdit(currentPage)
    setStatus(`Redo on page ${currentPage}`)
  }, [currentPage, setStatus, redoPageEdit, redoReferencePage])

  useKeyboardShortcuts({
    hasDocument,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onExport: handleExport,
    onZoomIn: () => setZoom(zoom + 0.1),
    onZoomOut: () => setZoom(zoom - 0.1),
    onResetZoom: () => setFitMode('width'),
    onPreviousPage: () => setCurrentPage(currentPage - 1),
    onNextPage: () => setCurrentPage(currentPage + 1),
  })

  return (
    <div className="flex h-screen flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      <AppHeader
        fileName={fileName}
        onOpen={handleOpenDialog}
        onExport={handleExport}
        hasDocument={hasDocument}
        status={isLoading ? 'Loading PDF...' : status}
      />

      <MainToolbar
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
        hasDocument={hasDocument}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {error ? (
        <div className="border-b border-red-700/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">{error}</div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        {hasDocument ? (
          <LeftSidebar
            pdfDocument={pdfDocument}
            pages={pages}
            currentPage={currentPage}
            onSelectPage={setCurrentPage}
          />
        ) : null}

        <Workspace
          hasDocument={hasDocument}
          pages={pages}
          pageEdits={pageEdits}
          referenceAnnotations={referenceAnnotations}
          onReferenceAnnotationsChange={setReferenceAnnotations}
          onPushReferenceBaseline={pushReferenceBaseline}
          pdfDocument={pdfDocument}
          currentPage={currentPage}
          zoom={zoom}
          fitMode={fitMode}
          selectedTool={selectedTool}
          setCurrentPage={setCurrentPage}
          setZoom={setZoom}
          setFitMode={setFitMode}
          setPageEdits={setPageEdits}
          onSelectObject={setSelectedObject}
          onClearObject={clearSelectedObject}
          onRegisterCanvas={registerPageCanvas}
          onUnregisterCanvas={unregisterPageCanvas}
          onFileSelected={handleFileSelected}
        />

        <PropertiesPanel
          fileName={fileName}
          fileSize={fileSize}
          page={activePage}
          pageCount={pages.length}
          selectedTool={selectedTool}
          selectedObject={selectedObject}
          onTextStyleChange={updateSelectedTextStyle}
        />
      </div>
    </div>
  )
}

export default App
