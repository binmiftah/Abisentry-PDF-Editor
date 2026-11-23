import { create } from 'zustand'

const canvasRegistry = new Map()

function createEditStateFromCanvas(canvas) {
  const json = canvas.toJSON(['objectType', 'dataURL', 'linkUrl', 'formFieldType'])
  if (!json.objects?.length) {
    return null
  }

  return {
    width: canvas.getWidth(),
    height: canvas.getHeight(),
    json,
  }
}

function isSameEditState(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

const initialState = {
  fileName: '',
  fileSize: 0,
  sourceBytes: null,
  pdfDocument: null,
  pages: [],
  pageEdits: {},
  pageHistory: {},
  referenceAnnotations: {},
  referenceHistory: {},
  currentPage: 1,
  zoom: 1,
  fitMode: 'width',
  selectedTool: 'text',
  selectedObject: null,
  isLoading: false,
  error: '',
  status: 'Ready',
}

export const useEditorStore = create((set) => ({
  ...initialState,

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setStatus: (status) => set({ status }),
  setSelectedTool: (selectedTool) => set({ selectedTool }),
  setSelectedObject: (selectedObject) => set({ selectedObject }),
  clearSelectedObject: () => set({ selectedObject: null }),

  registerPageCanvas: (pageNumber, canvas) => {
    canvasRegistry.set(pageNumber, canvas)
  },

  unregisterPageCanvas: (pageNumber) => {
    canvasRegistry.delete(pageNumber)
  },

  setPageEdits: (pageNumber, editState) =>
    set((state) => {
      const nextPageEdits = { ...state.pageEdits }
      const existingHistory = state.pageHistory[pageNumber] || { stack: [null], index: 0 }

      if (!editState) {
        delete nextPageEdits[pageNumber]
      } else {
        nextPageEdits[pageNumber] = editState
      }

      const currentHistoryState = existingHistory.stack[existingHistory.index]
      if (isSameEditState(currentHistoryState, editState)) {
        return { pageEdits: nextPageEdits }
      }

      const nextStack = [...existingHistory.stack.slice(0, existingHistory.index + 1), editState]
      const nextHistory = {
        stack: nextStack,
        index: nextStack.length - 1,
      }

      return {
        pageEdits: nextPageEdits,
        pageHistory: {
          ...state.pageHistory,
          [pageNumber]: nextHistory,
        },
      }
    }),


  setReferenceAnnotations: (pageNumber, annotations) =>
    set((state) => {
      const current = state.referenceAnnotations[pageNumber] || []
      if (JSON.stringify(current) === JSON.stringify(annotations)) return {}
      const history = state.referenceHistory[pageNumber] || { stack: [current], index: 0 }
      const stack = [...history.stack.slice(0, history.index + 1), annotations]
      return {
        referenceAnnotations: { ...state.referenceAnnotations, [pageNumber]: annotations },
        referenceHistory: {
          ...state.referenceHistory,
          [pageNumber]: { stack, index: stack.length - 1 },
        },
      }
    }),

  // PageStage calls this to delimit gestures. Each committed replacement is already
  // captured by setReferenceAnnotations, so no extra snapshot is needed here.
  pushReferenceBaseline: () => {},

  undoReferencePage: (pageNumber) =>
    set((state) => {
      const history = state.referenceHistory[pageNumber]
      if (!history || history.index <= 0) return {}
      const index = history.index - 1
      const annotations = history.stack[index] || []
      return {
        referenceAnnotations: { ...state.referenceAnnotations, [pageNumber]: annotations },
        referenceHistory: { ...state.referenceHistory, [pageNumber]: { ...history, index } },
      }
    }),

  redoReferencePage: (pageNumber) =>
    set((state) => {
      const history = state.referenceHistory[pageNumber]
      if (!history || history.index >= history.stack.length - 1) return {}
      const index = history.index + 1
      const annotations = history.stack[index] || []
      return {
        referenceAnnotations: { ...state.referenceAnnotations, [pageNumber]: annotations },
        referenceHistory: { ...state.referenceHistory, [pageNumber]: { ...history, index } },
      }
    }),

  capturePageEditFromCanvas: (pageNumber) => {
    const canvas = canvasRegistry.get(pageNumber)
    if (!canvas) {
      return
    }

    const editState = createEditStateFromCanvas(canvas)
    useEditorStore.getState().setPageEdits(pageNumber, editState)
  },

  undoPageEdit: (pageNumber) =>
    set((state) => {
      const history = state.pageHistory[pageNumber]
      if (!history || history.index <= 0) {
        return {}
      }

      const nextIndex = history.index - 1
      const nextEditState = history.stack[nextIndex]
      const nextPageEdits = { ...state.pageEdits }

      if (!nextEditState) {
        delete nextPageEdits[pageNumber]
      } else {
        nextPageEdits[pageNumber] = nextEditState
      }

      return {
        pageEdits: nextPageEdits,
        pageHistory: {
          ...state.pageHistory,
          [pageNumber]: {
            ...history,
            index: nextIndex,
          },
        },
      }
    }),

  redoPageEdit: (pageNumber) =>
    set((state) => {
      const history = state.pageHistory[pageNumber]
      if (!history || history.index >= history.stack.length - 1) {
        return {}
      }

      const nextIndex = history.index + 1
      const nextEditState = history.stack[nextIndex]
      const nextPageEdits = { ...state.pageEdits }

      if (!nextEditState) {
        delete nextPageEdits[pageNumber]
      } else {
        nextPageEdits[pageNumber] = nextEditState
      }

      return {
        pageEdits: nextPageEdits,
        pageHistory: {
          ...state.pageHistory,
          [pageNumber]: {
            ...history,
            index: nextIndex,
          },
        },
      }
    }),

  getPageCanvas: (pageNumber) => canvasRegistry.get(pageNumber),

  updateSelectedTextStyle: (stylePatch) => {
    const state = useEditorStore.getState()
    const canvas = canvasRegistry.get(state.currentPage)
    const target = canvas?.getActiveObject()

    if (!canvas || !target || !['i-text', 'textbox', 'text'].includes(target.type)) {
      return
    }

    target.set(stylePatch)
    target.setCoords()
    canvas.requestRenderAll()
    state.capturePageEditFromCanvas(state.currentPage)
    state.setSelectedObject({
      pageNumber: state.currentPage,
      type: target.type,
      fill: target.fill,
      fontSize: target.fontSize,
      fontFamily: target.fontFamily,
      fontWeight: target.fontWeight,
      fontStyle: target.fontStyle,
      textAlign: target.textAlign,
    })
  },

  setCurrentPage: (currentPage) =>
    set((state) => ({
      currentPage: Math.min(Math.max(1, currentPage), Math.max(1, state.pages.length)),
      selectedObject: null,
    })),

  setZoom: (zoom) => set({ zoom: Math.min(Math.max(0.25, zoom), 4), fitMode: null }),
  setFitMode: (fitMode) => set({ fitMode }),

  loadDocumentState: ({ fileName, fileSize, sourceBytes, pdfDocument, pages }) => {
    canvasRegistry.clear()
    set({
      fileName,
      fileSize,
      sourceBytes,
      pdfDocument,
      pages,
      pageEdits: {},
      pageHistory: {},
  referenceAnnotations: {},
  referenceHistory: {},
      currentPage: 1,
      selectedObject: null,
      error: '',
      status: 'Document loaded',
    })
  },

  clearDocument: () => {
    canvasRegistry.clear()
    set({
      ...initialState,
      status: 'Session reset',
    })
  },
}))
