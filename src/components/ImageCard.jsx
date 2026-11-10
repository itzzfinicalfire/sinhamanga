import { useEffect, useState } from 'react';

const STATUS_META = {
  ready: { label: 'Ready', cls: 'bg-slate-200 text-slate-700' },
  ocr: { label: 'Reading text', cls: 'bg-indigo-600 text-white' },
  translating: { label: 'Translating', cls: 'bg-indigo-600 text-white' },
  rendering: { label: 'Typesetting', cls: 'bg-indigo-600 text-white' },
  done: { label: 'Translated', cls: 'bg-emerald-500 text-white' },
  error: { label: 'Failed', cls: 'bg-rose-500 text-white' },
};

export default function ImageCard({ file, onRemove, onRetry, onEdit, onDownload, disabled }) {
  const [view, setView] = useState('si');
  const busy = ['ocr', 'translating', 'rendering'].includes(file.status);
  const meta = STATUS_META[file.status] || STATUS_META.ready;

  useEffect(() => {
    if (file.status === 'done') setView('si');
  }, [file.status]);

  const showTranslated = file.outUrl && view === 'si';

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">
      {/* header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.cls}`}>{meta.label}</span>
          <span className="truncate text-sm font-semibold text-slate-700" title={file.name}>
            {file.name}
          </span>
        </div>
        {!busy && (
          <button
            type="button"
            onClick={() => onRemove(file.id)}
            disabled={disabled}
            title="Remove page"
            className="shrink-0 rounded-full px-2 py-1 text-sm font-bold text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-30"
          >
            ✕
          </button>
        )}
      </div>

      {/* preview */}
      <div className="checker relative flex justify-center p-3">
        <img
          src={showTranslated ? file.outUrl : file.url}
          alt={file.name}
          className="max-h-[70vh] rounded-xl object-contain shadow-md"
        />

        {busy && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur-[2px]">
            <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-indigo-200 border-t-indigo-600" />
            <p className="text-sm font-semibold text-indigo-700">{file.stage || 'Working…'}</p>
            <div className="h-2 w-48 overflow-hidden rounded-full bg-indigo-100">
              <div
                className="h-full rounded-full bg-linear-to-r from-indigo-500 to-fuchsia-500 transition-all"
                style={{ width: `${Math.round((file.progress || 0) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {file.status === 'ready' && !busy && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-500 shadow">
              Waiting to be translated
            </span>
          </div>
        )}
      </div>

      {/* error */}
      {file.status === 'error' && file.error && (
        <div className="mx-3 mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm font-medium text-rose-700">{file.error}</p>
          <button
            type="button"
            onClick={() => onRetry(file.id)}
            className="mt-2 rounded-full bg-rose-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-rose-700"
          >
            Try again
          </button>
        </div>
      )}

      {/* footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
        {file.outUrl ? (
          <div className="flex rounded-full bg-slate-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setView('si')}
              className={`rounded-full px-3 py-1 transition ${
                view === 'si' ? 'bg-white text-indigo-700 shadow' : 'text-slate-500'
              }`}
            >
              <span className="font-sinhala">සිංහල</span>
            </button>
            <button
              type="button"
              onClick={() => setView('orig')}
              className={`rounded-full px-3 py-1 transition ${
                view === 'orig' ? 'bg-white text-indigo-700 shadow' : 'text-slate-500'
              }`}
            >
              Original
            </button>
          </div>
        ) : (
          <span className="text-xs font-medium text-slate-400">
            {Math.max(1, Math.round(file.size / 1024))} KB
          </span>
        )}

        <button
          type="button"
          className="btn-primary px-4! py-2! text-sm"
          onClick={() => onDownload(file)}
          disabled={!file.outUrl}
        >
          ⬇ Download PNG
        </button>
      </div>

      {/* translation editor */}
      {file.status === 'done' && file.regions && file.translations && (
        <details className="group border-t border-slate-100">
          <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm font-semibold text-slate-600 transition hover:text-indigo-600">
            <span>✏️ Edit Sinhala text ({file.translations.length})</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4 transition group-open:rotate-180"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </summary>
          <div className="max-h-72 space-y-3 overflow-y-auto bg-slate-50/70 px-4 py-3">
            {file.regions.map((r, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="truncate text-xs text-slate-400" title={r.text}>
                  Original: {r.text}
                </p>
                <textarea
                  rows={2}
                  value={file.translations[i] ?? ''}
                  onChange={(e) => onEdit(file.id, i, e.target.value)}
                  className="font-sinhala mt-1.5 w-full resize-y rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none"
                />
              </div>
            ))}
          </div>
          <p className="px-4 pb-3 text-[11px] text-slate-400">
            Edits re-render the page automatically — the download always uses your latest text.
          </p>
        </details>
      )}
    </article>
  );
}
