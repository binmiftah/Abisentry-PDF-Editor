import { Download, FileUp, ShieldCheck } from 'lucide-react'

function HeaderButton({ icon: Icon, label, onClick, disabled = false, variant = 'default' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40',
        variant === 'primary'
          ? 'border-cyan-300 bg-cyan-400 text-slate-950 hover:bg-cyan-300'
          : 'border-slate-700 bg-slate-900/70 text-slate-200 hover:border-cyan-300/50 hover:text-cyan-200',
      ].join(' ')}
    >
      <Icon size={15} />
      <span>{label}</span>
    </button>
  )
}

export function AppHeader({ fileName, onOpen, onExport, hasDocument, status }) {
  return (
    <header className="border-b border-slate-800 bg-[var(--color-bg-secondary)] px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px]">
          <p className="font-heading text-sm uppercase tracking-[0.24em] text-cyan-300">ABYSENTRY</p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-300">PDF Editor</p>
        </div>

        <div className="flex min-w-[220px] flex-1 items-center rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2">
          <p className="truncate text-sm text-slate-200">{fileName || 'No document open'}</p>
        </div>

        <div className="flex items-center gap-2">
          <HeaderButton icon={FileUp} label="Open PDF" onClick={onOpen} />
          <HeaderButton
            icon={Download}
            label="Export PDF"
            onClick={onExport}
            disabled={!hasDocument}
            variant="primary"
          />
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
        <ShieldCheck size={14} className="text-cyan-300" />
        <span>Local processing only. Files stay in your browser.</span>
        <span className="text-slate-500">•</span>
        <span>{status}</span>
      </div>
    </header>
  )
}
