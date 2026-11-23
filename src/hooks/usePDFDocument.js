import { useCallback } from 'react'
import { getPdfPageMeta, loadPdfFromBytes } from '../services/pdfRenderer'
import { useEditorStore } from '../store/editorStore'
import { validatePdfFile } from '../utils/fileValidation'

export function usePDFDocument() {
  const setLoading = useEditorStore((state) => state.setLoading)
  const setError = useEditorStore((state) => state.setError)
  const setStatus = useEditorStore((state) => state.setStatus)
  const loadDocumentState = useEditorStore((state) => state.loadDocumentState)
  const clearDocumentState = useEditorStore((state) => state.clearDocument)

  const openPdfFile = useCallback(
    async (file) => {
      const validationError = validatePdfFile(file)
      if (validationError) {
        setError(validationError)
        return false
      }

      setLoading(true)
      setError('')
      setStatus('Loading PDF...')

      try {
        const sourceBytes = await file.arrayBuffer()
        const pdfDocument = await loadPdfFromBytes(sourceBytes)
        const pages = await getPdfPageMeta(pdfDocument)

        loadDocumentState({
          fileName: file.name,
          fileSize: file.size,
          sourceBytes,
          pdfDocument,
          pages,
        })

        return true
      } catch (error) {
        if (error?.name === 'PasswordException') {
          setError('Password-protected PDFs are not supported in this version.')
        } else {
          setError('Unable to open this PDF. The file may be invalid or corrupted.')
        }
        setStatus('Open failed')
        return false
      } finally {
        setLoading(false)
      }
    },
    [loadDocumentState, setError, setLoading, setStatus],
  )

  const resetSession = useCallback(() => {
    clearDocumentState()
  }, [clearDocumentState])

  return {
    openPdfFile,
    resetSession,
  }
}
