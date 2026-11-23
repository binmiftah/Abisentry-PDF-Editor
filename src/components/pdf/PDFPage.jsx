import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, Circle, FabricImage, IText, Line, PencilBrush, Rect, Textbox } from 'fabric'
import { ReferenceTextPage } from '../../integrations/editmypdf/ReferenceTextPage.tsx'

function configureCanvasForTool(canvas, selectedTool) {
  canvas.isDrawingMode = false
  canvas.selection = true
  canvas.skipTargetFind = false
  canvas.defaultCursor = 'default'
  canvas.hoverCursor = 'move'

  if (selectedTool === 'annotate') {
    if (!canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush = new PencilBrush(canvas)
    }

    canvas.isDrawingMode = true
    canvas.freeDrawingBrush.color = 'rgba(245, 158, 11, 0.32)'
    canvas.freeDrawingBrush.width = 14
    canvas.defaultCursor = 'crosshair'
    return
  }

  if (selectedTool === 'whiteout' || selectedTool === 'shapes' || selectedTool === 'text' || selectedTool === 'images' || selectedTool === 'sign') {
    canvas.defaultCursor = 'crosshair'
    canvas.hoverCursor = 'text'
  }
}

export function PDFPage({
  pdfDocument,
  pageNumber,
  zoom,
  selectedTool,
  editState,
  onEditStateChange,
  onSelectObject,
  onClearObject,
  onRegisterCanvas,
  onUnregisterCanvas,
  onVisible,
  referenceAnnotations = [],
  onReferenceAnnotationsChange,
  onPushReferenceBaseline,
}) {
  const wrapperRef = useRef(null)
  const editCanvasRef = useRef(null)
  const fabricCanvasRef = useRef(null)
  const isRestoringRef = useRef(false)
  const imageInputRef = useRef(null)
  const signatureInputRef = useRef(null)
  const pendingPlacementRef = useRef(null)
  const [shapeMode, setShapeMode] = useState('rect')
  const [signatureMode, setSignatureMode] = useState('type')
  const [isRendering, setIsRendering] = useState(false)
  const [size, setSize] = useState({ width: 0, height: 0 })

  const createEditState = useCallback((canvas) => {
    const json = canvas.toJSON(['objectType', 'dataURL', 'linkUrl', 'formFieldType'])
    if (!json.objects?.length) {
      return null
    }

    return {
      width: canvas.getWidth(),
      height: canvas.getHeight(),
      json,
    }
  }, [])

  const publishSelection = useCallback((target) => {
    if (!target) {
      onClearObject()
      return
    }

    onSelectObject({
      pageNumber,
      type: target.type,
      fill: target.fill,
      fontSize: target.fontSize,
      fontFamily: target.fontFamily,
      fontWeight: target.fontWeight,
      fontStyle: target.fontStyle,
      textAlign: target.textAlign,
      objectType: target.objectType,
    })
  }, [onClearObject, onSelectObject, pageNumber])


  const addNewTextAtPointer = useCallback((pointer) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) return
    const text = new Textbox('', {
      left: pointer.x,
      top: pointer.y,
      width: 180,
      fill: '#0f172a',
      fontSize: 18,
      fontFamily: 'Helvetica',
      editable: true,
      splitByGrapheme: false,
      objectType: 'text',
      padding: 0,
    })
    canvas.add(text)
    canvas.setActiveObject(text)
    text.enterEditing()
    text.hiddenTextarea?.focus()
    canvas.requestRenderAll()
    publishSelection(text)
  }, [publishSelection])

  const addShapeAtPointer = useCallback((pointer) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) {
      return
    }

    if (shapeMode === 'rect') {
      canvas.add(
        new Rect({
          left: pointer.x,
          top: pointer.y,
          width: 160,
          height: 90,
          fill: 'rgba(34, 197, 94, 0.15)',
          stroke: '#22c55e',
          strokeWidth: 2,
          rx: 4,
          ry: 4,
          objectType: 'shape-rect',
        }),
      )
      return
    }

    if (shapeMode === 'circle') {
      canvas.add(
        new Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 45,
          fill: 'rgba(56, 189, 248, 0.16)',
          stroke: '#0ea5e9',
          strokeWidth: 2,
          objectType: 'shape-circle',
        }),
      )
      return
    }

    const line = new Line([pointer.x, pointer.y, pointer.x + 180, pointer.y], {
      stroke: '#f97316',
      strokeWidth: 3,
      objectType: shapeMode === 'arrow' ? 'shape-arrow' : 'shape-line',
    })

    canvas.add(line)

    if (shapeMode === 'arrow') {
      const arrowHead = new Line([pointer.x + 160, pointer.y - 10, pointer.x + 180, pointer.y], {
        stroke: '#f97316',
        strokeWidth: 3,
        objectType: 'shape-arrow',
      })
      canvas.add(arrowHead)
    }
  }, [shapeMode])

  const addSignatureTextAtPointer = useCallback((pointer) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) {
      return
    }

    const text = new IText('Sign here', {
      left: pointer.x,
      top: pointer.y,
      fill: '#111827',
      fontFamily: 'cursive',
      fontSize: 34,
      objectType: 'signature-text',
    })

    canvas.add(text)
    canvas.setActiveObject(text)
    text.enterEditing()
    publishSelection(text)
  }, [publishSelection])

  const addImageFromDataUrl = useCallback(async (dataURL, pointer, objectType) => {
    const canvas = fabricCanvasRef.current
    if (!canvas) {
      return
    }

    const image = await FabricImage.fromURL(dataURL)
    image.set({
      left: pointer?.x ?? canvas.getWidth() / 2 - 80,
      top: pointer?.y ?? canvas.getHeight() / 2 - 80,
      objectType,
      dataURL,
      cornerColor: '#22d3ee',
      cornerStrokeColor: '#0891b2',
      transparentCorners: false,
    })

    const maxWidth = Math.max(120, canvas.getWidth() * 0.35)
    if (image.width && image.width > maxWidth) {
      image.scale(maxWidth / image.width)
    }

    canvas.add(image)
    canvas.setActiveObject(image)
    publishSelection(image)
  }, [publishSelection])

  useEffect(() => {
    const element = wrapperRef.current
    if (!element) {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onVisible(pageNumber)
          }
        })
      },
      {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0.25,
      },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [onVisible, pageNumber])

  useEffect(() => {
    let mounted = true
    if (!pdfDocument) return undefined

    setIsRendering(true)
    pdfDocument.getPage(pageNumber).then((page) => {
      if (!mounted) return
      const viewport = page.getViewport({ scale: zoom })
      setSize({ width: viewport.width, height: viewport.height })
    }).catch(() => undefined).finally(() => {
      if (mounted) setIsRendering(false)
    })

    return () => {
      mounted = false
    }
  }, [pdfDocument, pageNumber, zoom])

  useEffect(() => {
    if (!editCanvasRef.current) {
      return undefined
    }

    const canvas = new Canvas(editCanvasRef.current, {
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
      backgroundColor: 'transparent',
    })

    fabricCanvasRef.current = canvas

    // Fabric.js 7 wraps the supplied <canvas> in its own .canvas-container.
    // Position that generated wrapper over the PDF.js canvas; positioning only
    // the original canvas element does not position Fabric's wrapper.
    const fabricContainer = canvas.elements?.container
    if (fabricContainer) {
      Object.assign(fabricContainer.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        zIndex: '5',
        pointerEvents: 'auto',
      })
    }

    canvas.on('selection:created', ({ selected }) => publishSelection(selected?.[0]))
    canvas.on('selection:updated', ({ selected }) => publishSelection(selected?.[0]))
    canvas.on('selection:cleared', () => publishSelection(null))
    canvas.on('object:added', ({ target }) => publishSelection(target))
    onClearObject()

    return () => {
      canvas.off('selection:created')
      canvas.off('selection:updated')
      canvas.off('selection:cleared')
      canvas.off('object:added')
      canvas.dispose()
      fabricCanvasRef.current = null
    }
  }, [onClearObject, publishSelection])

  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) {
      return
    }

    if (selectedTool === 'sign' && signatureMode === 'draw') {
      if (!canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush = new PencilBrush(canvas)
      }

      canvas.isDrawingMode = true
      canvas.freeDrawingBrush.color = '#111827'
      canvas.freeDrawingBrush.width = 2.5
      canvas.defaultCursor = 'crosshair'
      canvas.hoverCursor = 'crosshair'
      return
    }

    configureCanvasForTool(canvas, selectedTool)
    const fabricContainer = canvas.elements?.container
    if (fabricContainer) {
      fabricContainer.style.pointerEvents = selectedTool === 'text' ? 'none' : 'auto'
      fabricContainer.style.zIndex = selectedTool === 'text' ? '15' : '5'
    }
    canvas.requestRenderAll()
  }, [selectedTool, signatureMode])

  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) {
      return
    }

    if (typeof onSelectObject === 'function') {
      publishSelection(canvas.getActiveObject() || null)
    }
  }, [onSelectObject, pageNumber, publishSelection])

  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) {
      return undefined
    }

    window.requestAnimationFrame(() => {
      onSelectObject && publishSelection(canvas.getActiveObject() || null)
    })

    return undefined
  }, [onSelectObject, publishSelection, selectedTool])

  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas || !size.width || !size.height) {
      return
    }

    let cancelled = false

    async function restoreEditState() {
      // Do not reload the canvas just because the user switched tools or
      // because this page's current canvas state was just persisted to Zustand.
      // Reload only when the stored state differs (e.g. undo/redo or page restore).
      const currentJson = canvas.toJSON(['objectType', 'dataURL', 'linkUrl', 'formFieldType'])
      const currentHasObjects = Boolean(currentJson.objects?.length)
      const storedHasObjects = Boolean(editState?.json?.objects?.length)
      const sameObjects =
        JSON.stringify(currentJson) === JSON.stringify(editState?.json || { ...currentJson, objects: [] })
      const sameDimensions =
        canvas.getWidth() === size.width && canvas.getHeight() === size.height

      if (sameObjects && sameDimensions) {
        configureCanvasForTool(canvas, selectedTool)
        return
      }

      isRestoringRef.current = true
      try {
        // Resize the editing surface to exactly match the PDF.js page.
        canvas.setDimensions({ width: size.width, height: size.height })

        if (!storedHasObjects) {
          if (currentHasObjects) {
            canvas.clear()
          }
        } else if (!sameObjects || !sameDimensions) {
          await canvas.loadFromJSON(editState.json)

          if (cancelled) {
            return
          }

          if (editState.width && editState.height) {
            const scaleX = size.width / editState.width
            const scaleY = size.height / editState.height

            if (scaleX !== 1 || scaleY !== 1) {
              canvas.getObjects().forEach((object) => {
                object.set({
                  left: (object.left || 0) * scaleX,
                  top: (object.top || 0) * scaleY,
                  scaleX: (object.scaleX || 1) * scaleX,
                  scaleY: (object.scaleY || 1) * scaleY,
                })
                object.setCoords()
              })
            }
          }
        }

        configureCanvasForTool(canvas, selectedTool)
        canvas.requestRenderAll()
        publishSelection(canvas.getActiveObject() || null)
      } finally {
        isRestoringRef.current = false
      }
    }

    restoreEditState()

    return () => {
      cancelled = true
    }
  }, [editState, publishSelection, selectedTool, size.height, size.width])

  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) {
      return undefined
    }

    onRegisterCanvas(pageNumber, canvas)

    return () => {
      onUnregisterCanvas(pageNumber)
    }
  }, [onRegisterCanvas, onUnregisterCanvas, pageNumber])

  useEffect(() => {
    const canvas = fabricCanvasRef.current
    if (!canvas) {
      return undefined
    }

    const persistState = () => {
      if (isRestoringRef.current) {
        return
      }

      onEditStateChange(pageNumber, createEditState(canvas))
    }

    const handleMouseDown = (event) => {
      if (canvas.isDrawingMode || event.target) {
        return
      }

      // Fabric 7 exposes the canvas-local scene point directly on the event.
      // This avoids pointer offsets caused by the wrapped canvas/container.
      const pointer = event.scenePoint || canvas.getScenePoint(event.e)
      const common = {
        left: pointer.x,
        top: pointer.y,
      }

      if (selectedTool === 'images') {
        pendingPlacementRef.current = pointer
        imageInputRef.current?.click()
        return
      }

      if (selectedTool === 'sign') {
        if (signatureMode === 'type') {
          addSignatureTextAtPointer(pointer)
          return
        }

        if (signatureMode === 'upload') {
          pendingPlacementRef.current = pointer
          signatureInputRef.current?.click()
        }

        return
      }

      if (selectedTool === 'whiteout') {
        canvas.add(
          new Rect({
            ...common,
            width: 160,
            height: 36,
            fill: '#ffffff',
            stroke: '#d1d5db',
            strokeWidth: 1,
            objectType: 'whiteout',
          }),
        )
        return
      }

      if (selectedTool === 'shapes') {
        addShapeAtPointer(pointer)
      }
    }

    const handleObjectDoubleClick = (event) => {
      const target = event.target
      if (!target || !['i-text', 'textbox', 'text'].includes(target.type)) {
        return
      }

      target.enterEditing()
      canvas.setActiveObject(target)
      publishSelection(target)
    }

    const isTypingTarget = (target) => {
      if (!(target instanceof HTMLElement)) return false
      return Boolean(
        target.isContentEditable ||
        target.closest('input, textarea, select, [contenteditable="true"]') ||
        canvas.getActiveObject()?.isEditing
      )
    }

    const handleKeyboardDelete = (event) => {
      if (selectedTool === 'text') return
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      // Fabric uses a hidden textarea while editing. Let the browser/Fabric
      // process Backspace and Delete there; only delete the object when it is
      // selected but not in text-editing mode.
      if (isTypingTarget(event.target)) return

      const activeObject = canvas.getActiveObject()
      if (!activeObject) return

      event.preventDefault()
      canvas.remove(activeObject)
      canvas.discardActiveObject()
      canvas.requestRenderAll()
      publishSelection(null)
    }

    const handleKeyboardDuplicate = (event) => {
      const isModifier = event.ctrlKey || event.metaKey
      if (!isModifier || event.key.toLowerCase() !== 'd' || isTypingTarget(event.target)) return

      const activeObject = canvas.getActiveObject()
      if (!activeObject) return

      event.preventDefault()
      activeObject.clone().then((clone) => {
        clone.set({
          left: (activeObject.left || 0) + 18,
          top: (activeObject.top || 0) + 18,
        })
        canvas.add(clone)
        canvas.setActiveObject(clone)
        canvas.requestRenderAll()
      })
    }

    const persistAfterTextEditing = () => {
      persistState()
      const active = canvas.getActiveObject()
      if (active) publishSelection(active)
    }

    canvas.on('object:added', persistState)
    canvas.on('object:modified', persistState)
    canvas.on('object:removed', persistState)
    canvas.on('path:created', persistState)
    canvas.on('text:changed', persistState)
    canvas.on('text:editing:exited', persistAfterTextEditing)
    canvas.on('mouse:down', handleMouseDown)
    canvas.on('mouse:dblclick', handleObjectDoubleClick)
    window.addEventListener('keydown', handleKeyboardDelete)
    window.addEventListener('keydown', handleKeyboardDuplicate)

    return () => {
      canvas.off('object:added', persistState)
      canvas.off('object:modified', persistState)
      canvas.off('object:removed', persistState)
      canvas.off('path:created', persistState)
      canvas.off('text:changed', persistState)
      canvas.off('text:editing:exited', persistAfterTextEditing)
      canvas.off('mouse:down', handleMouseDown)
      canvas.off('mouse:dblclick', handleObjectDoubleClick)
      window.removeEventListener('keydown', handleKeyboardDelete)
      window.removeEventListener('keydown', handleKeyboardDuplicate)
    }
  }, [
    addShapeAtPointer,
    addSignatureTextAtPointer,
    createEditState,
    onEditStateChange,
    pageNumber,
    publishSelection,
    selectedTool,
    signatureMode,
  ])

  const handleImageUpload = async (event) => {
    const [file] = event.target.files || []
    event.target.value = ''
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      return
    }

    const dataURL = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Failed to read image file'))
      reader.readAsDataURL(file)
    })

    await addImageFromDataUrl(dataURL, pendingPlacementRef.current, 'image')
  }

  const handleSignatureUpload = async (event) => {
    const [file] = event.target.files || []
    event.target.value = ''
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      return
    }

    const dataURL = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Failed to read signature image'))
      reader.readAsDataURL(file)
    })

    await addImageFromDataUrl(dataURL, pendingPlacementRef.current, 'signature-image')
  }


  return (
    <section
      ref={wrapperRef}
      data-page-number={pageNumber}
      className="relative mx-auto overflow-hidden rounded border border-slate-700/70 bg-white shadow-[0_10px_24px_rgba(0,0,0,0.28)]"
      style={{ width: size.width || undefined, minHeight: size.height || 400 }}
    >
      <ReferenceTextPage
        pdfDocument={pdfDocument}
        pageNumber={pageNumber}
        zoom={zoom}
        annotations={referenceAnnotations}
        onAnnotationsChange={onReferenceAnnotationsChange}
        onPushBaseline={onPushReferenceBaseline}
        onVisible={onVisible}
        interactive={selectedTool === 'text'}
        onAddText={addNewTextAtPointer}
      />
      <canvas ref={editCanvasRef} className="block" />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg"
        onChange={handleImageUpload}
        className="hidden"
      />
      <input
        ref={signatureInputRef}
        type="file"
        accept="image/png,image/jpeg"
        onChange={handleSignatureUpload}
        className="hidden"
      />
      {selectedTool === 'shapes' ? (
        <div className="absolute left-3 top-3 z-20 inline-flex gap-1 rounded border border-slate-400/60 bg-white/92 p-1 text-[11px] text-slate-700 shadow">
          {['rect', 'circle', 'line', 'arrow'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setShapeMode(mode)}
              className={[
                'rounded px-2 py-1 capitalize',
                shapeMode === mode ? 'bg-cyan-100 text-cyan-900' : 'hover:bg-slate-100',
              ].join(' ')}
            >
              {mode}
            </button>
          ))}
        </div>
      ) : null}
      {selectedTool === 'sign' ? (
        <div className="absolute left-3 top-3 z-20 inline-flex gap-1 rounded border border-slate-400/60 bg-white/92 p-1 text-[11px] text-slate-700 shadow">
          {['type', 'draw', 'upload'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSignatureMode(mode)}
              className={[
                'rounded px-2 py-1 capitalize',
                signatureMode === mode ? 'bg-cyan-100 text-cyan-900' : 'hover:bg-slate-100',
              ].join(' ')}
            >
              {mode}
            </button>
          ))}
        </div>
      ) : null}
      {isRendering ? (
        <div className="absolute inset-0 grid place-items-center bg-slate-50/85 text-xs font-medium text-slate-600">
          Rendering page {pageNumber}...
        </div>
      ) : null}
    </section>
  )
}
