import {
  Brush,
  Eraser,
  FormInput,
  Highlighter,
  Image,
  Link,
  Redo2,
  Shapes,
  Signature,
  Type,
  Undo2,
} from 'lucide-react'

const TOOLS = [
  { id: 'text', label: 'Text', icon: Type },
  { id: 'links', label: 'Links (soon)', icon: Link, comingSoon: true },
  { id: 'forms', label: 'Forms (soon)', icon: FormInput, comingSoon: true },
  { id: 'images', label: 'Images', icon: Image },
  { id: 'sign', label: 'Sign', icon: Signature },
  { id: 'whiteout', label: 'Whiteout', icon: Eraser },
  { id: 'annotate', label: 'Annotate', icon: Highlighter },
  { id: 'shapes', label: 'Shapes', icon: Shapes },
]

function ToolButton({ tool, active, disabled, onClick }) {
  const Icon = tool.icon

  return (
    <button
      type="button"
      disabled={disabled || tool.comingSoon}
      onClick={() => onClick(tool.id)}
      title={tool.comingSoon ? `${tool.label} — coming soon` : tool.label}
      className={[
        'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition',
        disabled ? 'cursor-not-allowed border-slate-800 text-slate-500' : 'hover:border-cyan-300/60 hover:text-cyan-200',
        active ? 'border-cyan-300 bg-cyan-400/20 text-cyan-200' : 'border-slate-700 text-slate-300',
      ].join(' ')}
    >
      <Icon size={15} />
      <span>{tool.label}</span>
    </button>
  )
}

export function MainToolbar({ selectedTool, onSelectTool, hasDocument, canUndo, canRedo, onUndo, onRedo }) {
  return (
    <div className="border-b border-slate-800 bg-[var(--color-surface)] px-3 py-2">
      <div className="flex gap-2 overflow-x-auto">
        {TOOLS.map((tool) => (
          <ToolButton
            key={tool.id}
            tool={tool}
            active={selectedTool === tool.id}
            disabled={!hasDocument || tool.comingSoon}
            onClick={onSelectTool}
          />
        ))}

        <div className="mx-1 h-9 w-px bg-slate-700" />

        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo"
          className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/60 hover:text-cyan-200 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
        >
          <Undo2 size={15} />
          <span>Undo</span>
        </button>

        <button
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          title="Redo"
          className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/60 hover:text-cyan-200 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
        >
          <Redo2 size={15} />
          <span>Redo</span>
        </button>

        <div className="inline-flex items-center rounded-md border border-slate-800 bg-slate-900/70 px-3 text-[11px] text-slate-400">
          <Brush size={12} className="mr-1.5 text-cyan-300" />
          Phase 2: Basic editing active
        </div>
      </div>
    </div>
  )
}
