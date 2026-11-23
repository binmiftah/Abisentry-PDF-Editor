import { Copy, GripVertical, Plus, Trash2 } from 'lucide-react'
import { PageThumbnail } from '../pdf/PageThumbnail'

export function LeftSidebar({ pdfDocument, pages, currentPage, onSelectPage }) {
  return (
    <aside className="hidden w-[260px] shrink-0 border-r border-slate-800 bg-[var(--color-bg-secondary)] md:flex md:flex-col">
      <div className="border-b border-slate-800 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Pages</p>
      </div>

      <div className="flex gap-1 border-b border-slate-800 p-2">
        <button
          type="button"
          disabled
          title="Phase 4"
          className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-400 disabled:opacity-50"
        >
          <Plus size={12} />
          Insert
        </button>
        <button
          type="button"
          disabled
          title="Phase 4"
          className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-400 disabled:opacity-50"
        >
          <Copy size={12} />
          Duplicate
        </button>
        <button
          type="button"
          disabled
          title="Phase 4"
          className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-400 disabled:opacity-50"
        >
          <Trash2 size={12} />
          Delete
        </button>
        <button
          type="button"
          disabled
          title="Phase 4"
          className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-400 disabled:opacity-50"
        >
          <GripVertical size={12} />
          Reorder
        </button>
      </div>

      <div className="space-y-2 overflow-y-auto p-2">
        {pages.map((page) => (
          <PageThumbnail
            key={page.pageNumber}
            pdfDocument={pdfDocument}
            pageNumber={page.pageNumber}
            active={page.pageNumber === currentPage}
            onClick={onSelectPage}
          />
        ))}
      </div>
    </aside>
  )
}
