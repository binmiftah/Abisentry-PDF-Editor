import { useEffect } from 'react'

export function useKeyboardShortcuts({
  hasDocument,
  onUndo,
  onRedo,
  onExport,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onPreviousPage,
  onNextPage,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target
      const isEditableTarget =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          Boolean(target.closest('input, textarea, select, [contenteditable="true"]')))

      // Do not hijack text editing shortcuts (including undo/redo) in form
      // controls or Fabric's hidden textarea.
      if (isEditableTarget) return

      const isModifier = event.ctrlKey || event.metaKey

      if (isModifier && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault()
        onUndo()
        return
      }

      if (isModifier && event.key.toLowerCase() === 'z' && event.shiftKey) {
        event.preventDefault()
        onRedo()
        return
      }

      if (isModifier && event.key.toLowerCase() === 's') {
        event.preventDefault()
        if (hasDocument) {
          onExport()
        }
        return
      }

      if (isModifier && (event.key === '=' || event.key === '+')) {
        event.preventDefault()
        onZoomIn()
        return
      }

      if (isModifier && event.key === '-') {
        event.preventDefault()
        onZoomOut()
        return
      }

      if (isModifier && event.key === '0') {
        event.preventDefault()
        onResetZoom()
        return
      }

      if (!hasDocument) {
        return
      }

      if (event.key === 'PageUp') {
        event.preventDefault()
        onPreviousPage()
      }

      if (event.key === 'PageDown') {
        event.preventDefault()
        onNextPage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    hasDocument,
    onExport,
    onNextPage,
    onPreviousPage,
    onRedo,
    onResetZoom,
    onUndo,
    onZoomIn,
    onZoomOut,
  ])
}
