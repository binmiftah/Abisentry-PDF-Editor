import { FileText, Ruler } from 'lucide-react'

function formatFileSize(bytes) {
  if (!bytes) {
    return '-'
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function PropertiesPanel({
  fileName,
  fileSize,
  page,
  pageCount,
  selectedTool,
  selectedObject,
  onTextStyleChange,
}) {
  const isTextObject = Boolean(selectedObject && ['textbox', 'i-text', 'text'].includes(selectedObject.type))

  return (
    <aside className="hidden w-[280px] shrink-0 border-l border-slate-800 bg-[var(--color-bg-secondary)] xl:flex xl:flex-col">
      <div className="border-b border-slate-800 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Properties</p>
      </div>

      <div className="space-y-4 p-4">
        <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Selected tool</p>
          <p className="mt-1 text-sm font-medium capitalize text-cyan-200">{selectedTool}</p>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
          <div className="mb-2 flex items-center gap-2 text-slate-200">
            <FileText size={15} />
            <p className="text-sm font-medium">Document</p>
          </div>
          <p className="truncate text-xs text-slate-300">{fileName || 'No file loaded'}</p>
          <p className="mt-1 text-xs text-slate-400">Size: {formatFileSize(fileSize)}</p>
          <p className="text-xs text-slate-400">Pages: {pageCount || '-'}</p>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
          <div className="mb-2 flex items-center gap-2 text-slate-200">
            <Ruler size={15} />
            <p className="text-sm font-medium">Active page</p>
          </div>
          {page ? (
            <>
              <p className="text-xs text-slate-300">Page {page.pageNumber}</p>
              <p className="text-xs text-slate-400">{Math.round(page.width)} x {Math.round(page.height)} pt</p>
              <p className="text-xs text-slate-400">Rotation: {page.rotation}°</p>
            </>
          ) : (
            <p className="text-xs text-slate-400">Open a PDF to inspect page details.</p>
          )}
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
          <p className="mb-2 text-xs uppercase tracking-[0.12em] text-slate-400">Selection</p>
          {selectedObject ? (
            <p className="text-xs capitalize text-slate-300">
              Page {selectedObject.pageNumber} • {selectedObject.objectType || selectedObject.type}
            </p>
          ) : (
            <p className="text-xs text-slate-500">No object selected.</p>
          )}

          {isTextObject ? (
            <div className="mt-3 space-y-2">
              <label className="block text-[11px] uppercase tracking-[0.08em] text-slate-400">
                Font size
                <input
                  type="number"
                  min={8}
                  max={140}
                  value={Math.round(selectedObject.fontSize || 16)}
                  onChange={(event) => onTextStyleChange({ fontSize: Number(event.target.value) || 16 })}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-950/80 px-2 py-1 text-xs text-slate-200"
                />
              </label>

              <label className="block text-[11px] uppercase tracking-[0.08em] text-slate-400">
                Color
                <input
                  type="color"
                  value={selectedObject.fill || '#0f172a'}
                  onChange={(event) => onTextStyleChange({ fill: event.target.value })}
                  className="mt-1 h-8 w-full rounded border border-slate-600 bg-slate-950/80 p-1"
                />
              </label>

              <label className="block text-[11px] uppercase tracking-[0.08em] text-slate-400">
                Font family
                <select
                  value={selectedObject.fontFamily || 'Helvetica'}
                  onChange={(event) => onTextStyleChange({ fontFamily: event.target.value })}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-950/80 px-2 py-1 text-xs text-slate-200"
                >
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Arial">Arial</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onTextStyleChange({ fontWeight: selectedObject.fontWeight === 'bold' ? 'normal' : 'bold' })}
                  className="rounded border border-slate-600 bg-slate-950/70 px-2 py-1 text-xs text-slate-200"
                >
                  Bold
                </button>
                <button
                  type="button"
                  onClick={() => onTextStyleChange({ fontStyle: selectedObject.fontStyle === 'italic' ? 'normal' : 'italic' })}
                  className="rounded border border-slate-600 bg-slate-950/70 px-2 py-1 text-xs text-slate-200"
                >
                  Italic
                </button>
              </div>

              <label className="block text-[11px] uppercase tracking-[0.08em] text-slate-400">
                Alignment
                <select
                  value={selectedObject.textAlign || 'left'}
                  onChange={(event) => onTextStyleChange({ textAlign: event.target.value })}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-950/80 px-2 py-1 text-xs text-slate-200"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
            </div>
          ) : null}
        </div>

        <p className="text-xs leading-relaxed text-slate-500">
          Whiteout and annotation tools will overlay content visually. Secure redaction is planned separately.
        </p>
      </div>
    </aside>
  )
}
