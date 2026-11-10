import { useEffect, useRef, useState } from 'react';
import { LANGS, langSourceLabel } from '../lib/langs.js';
import { runOcr } from '../lib/ocr.js';
import { loadSinhalaFont, renderTranslatedCanvas, canvasToBlob } from '../lib/render.js';
import { checkHealth, translateTexts } from '../lib/api.js';
import ImageCard from './ImageCard.jsx';

const MAX_FILES = 10;
const MAX_SIZE = 8 * 1024 * 1024;
const OK_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

let uid = 0;

function friendlyError(err) {
  const msg = err?.message || String(err);
  if (/DEEPSEEK_API_KEY/.test(msg)) {
    return 'The server has no DeepSeek API key. Add DEEPSEEK_API_KEY to your .env file and restart the server (see README).';
  }
  if (/401/.test(msg)) return 'DeepSeek rejected the API key (401). Check the key in your .env file.';
  if (/402/.test(msg)) return 'Your DeepSeek account has insufficient balance (402). Top up at platform.deepseek.com.';
  if (/429|rate limit/i.test(msg)) return 'DeepSeek rate limit hit — wait a few seconds and try again.';
  if (/network|reach|timed out|timeout/i.test(msg)) return 'Could not reach the DeepSeek API. Check the server and your internet connection.';
  return msg;
}

export default function Translator() {
  const [files, setFiles] = useState([]);
  const [source, setSource] = useState(LANGS[0].value);
  const [running, setRunning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [health, setHealth] = useState(undefined); // undefined = checking
  const [notice, setNotice] = useState('');

  const filesRef = useRef(files);
  const rerenderTimers = useRef(new Map());
  const inputRef = useRef(null);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    checkHealth().then(setHealth);
  }, []);

  useEffect(() => {
    loadSinhalaFont();
  }, []);

  function addFiles(list) {
    const accepted = [];
    let skipped = 0;
    for (const f of list) {
      if (!OK_TYPES.has(f.type) || f.size > MAX_SIZE) {
        skipped += 1;
        continue;
      }
      accepted.push(f);
    }
    const room = MAX_FILES - filesRef.current.length;
    const take = accepted.slice(0, Math.max(0, room));
    skipped += accepted.length - take.length;

    if (skipped) {
      setNotice(`Skipped ${skipped} file${skipped > 1 ? 's' : ''} — only PNG/JPG/WEBP up to 8 MB each, max ${MAX_FILES} pages.`);
    } else {
      setNotice('');
    }
    if (!take.length) return;

    const entries = take.map((f) => ({
      id: ++uid,
      name: f.name,
      size: f.size,
      url: URL.createObjectURL(f),
      img: null,
      status: 'ready',
      progress: 0,
      stage: '',
      regions: null,
      translations: null,
      outUrl: null,
      error: null,
    }));
    setFiles((prev) => [...prev, ...entries]);

    for (const entry of entries) {
      const img = new Image();
      img.onload = () => setFiles((prev) => prev.map((x) => (x.id === entry.id ? { ...x, img } : x)));
      img.src = entry.url;
    }
  }

  // Paste images straight into the page
  useEffect(() => {
    const onPaste = (e) => {
      const imgs = [...(e.clipboardData?.files || [])].filter((f) => OK_TYPES.has(f.type));
      if (imgs.length) {
        e.preventDefault();
        addFiles(imgs);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = (id, p) => setFiles((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x)));

  async function updateOutput(id, regions, translations) {
    const entry = filesRef.current.find((x) => x.id === id);
    if (!entry?.img) return;
    const canvas = renderTranslatedCanvas(entry.img, regions, translations);
    const blob = await canvasToBlob(canvas);
    const outUrl = URL.createObjectURL(blob);
    if (entry.outUrl) URL.revokeObjectURL(entry.outUrl);
    patch(id, { status: 'done', regions, translations, outUrl, progress: 1, stage: '' });
  }

  async function processFile(id) {
    const entry = filesRef.current.find((x) => x.id === id);
    if (!entry) return;
    try {
      if (!entry.img) throw new Error('Image is still loading — try again in a second.');

      patch(id, { status: 'ocr', progress: 0.02, stage: 'Starting OCR engine…', error: null });
      const { regions } = await runOcr(entry.img, source, ({ stage, progress }) =>
        patch(id, { stage, progress: Math.max(0.03, progress) })
      );

      if (!regions.length) {
        patch(id, {
          status: 'error',
          error: 'No text was detected on this page. Try a different source language, or a larger / cleaner scan.',
        });
        return;
      }

      patch(id, {
        status: 'translating',
        progress: 1,
        stage: `Translating ${regions.length} line${regions.length > 1 ? 's' : ''} with DeepSeek…`,
      });
      const translations = await translateTexts(
        regions.map((r) => r.text),
        langSourceLabel(source)
      );

      patch(id, { status: 'rendering', stage: 'Typesetting Sinhala…' });
      await loadSinhalaFont();
      await updateOutput(id, regions, translations);
    } catch (err) {
      patch(id, { status: 'error', error: friendlyError(err) });
    }
  }

  async function runAll() {
    if (running) return;
    const targets = filesRef.current.filter((f) => f.status === 'ready' || f.status === 'error');
    if (!targets.length) return;
    setRunning(true);
    try {
      for (const f of targets) {
        await processFile(f.id);
      }
    } finally {
      setRunning(false);
    }
  }

  function removeFile(id) {
    const entry = filesRef.current.find((x) => x.id === id);
    if (entry) {
      if (entry.url) URL.revokeObjectURL(entry.url);
      if (entry.outUrl) URL.revokeObjectURL(entry.outUrl);
    }
    setFiles((prev) => prev.filter((x) => x.id !== id));
  }

  function editTranslation(id, index, value) {
    setFiles((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, translations: x.translations.map((t, i) => (i === index ? value : t)) } : x
      )
    );

    const timers = rerenderTimers.current;
    if (timers.has(id)) clearTimeout(timers.get(id));
    timers.set(
      id,
      setTimeout(async () => {
        timers.delete(id);
        const f = filesRef.current.find((x) => x.id === id);
        if (f?.status === 'done' && f.regions && f.translations) {
          try {
            await updateOutput(id, f.regions, f.translations);
          } catch {
            /* keep the previous output on failure */
          }
        }
      }, 450)
    );
  }

  function download(f) {
    if (!f.outUrl) return;
    const a = document.createElement('a');
    a.href = f.outUrl;
    a.download = `${f.name.replace(/\.[^.]+$/, '')}-sinhala.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function downloadAll() {
    const done = filesRef.current.filter((x) => x.outUrl);
    for (const f of done) {
      download(f);
      // Give the browser a beat between downloads
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  const pendingCount = files.filter((f) => f.status === 'ready' || f.status === 'error').length;
  const doneCount = files.filter((f) => f.status === 'done').length;
  const anyOut = files.some((f) => f.outUrl);
  const currentIdx = running ? files.findIndex((f) => ['ocr', 'translating', 'rendering'].includes(f.status)) : -1;

  return (
    <section id="translator" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="text-xs font-extrabold tracking-[0.22em] text-indigo-600 uppercase">The translator</p>
        <h2 className="font-display mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Manga → <span className="font-sinhala text-gradient">සිංහල</span> translator
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Upload up to 10 pages. Text is detected inside your browser, translated into natural
          Sinhala by DeepSeek, and typeset back into the speech bubbles.
        </p>
      </div>

      {/* server status */}
      <div className="mt-6 flex justify-center">
        {health === undefined ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-500">
            <span className="h-2 w-2 rounded-full bg-slate-300" /> Checking server…
          </span>
        ) : health === null ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-700">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Cannot reach the translation server — is it running? (npm run dev)
          </span>
        ) : health?.apiKeyConfigured ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> DeepSeek API connected
            <span className="font-normal text-emerald-600/70">({health.model})</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            DeepSeek API key missing — add DEEPSEEK_API_KEY to .env and restart the server
          </span>
        )}
      </div>

      {/* tool card */}
      <div
        className={`mt-8 rounded-3xl border-2 bg-white p-4 shadow-xl shadow-slate-200/60 transition sm:p-6 ${
          dragOver ? 'border-indigo-500 ring-4 ring-indigo-200' : 'border-slate-200'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        {files.length === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-6 py-14 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-12 w-12 text-indigo-500">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
              />
            </svg>
            <span className="font-display text-xl font-bold text-slate-800">Drop manga pages here</span>
            <span className="text-sm text-slate-500">
              or <span className="font-semibold text-indigo-600">click to browse</span> · paste with Ctrl+V
            </span>
            <span className="text-xs text-slate-400">
              PNG · JPG · WEBP — up to {MAX_FILES} pages, 8 MB each
            </span>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {files.map((f) => {
              const busy = ['ocr', 'translating', 'rendering'].includes(f.status);
              const ring =
                f.status === 'done'
                  ? 'border-emerald-400'
                  : f.status === 'error'
                    ? 'border-rose-400'
                    : busy
                      ? 'border-indigo-400'
                      : 'border-slate-300';
              return (
                <div key={f.id} className={`group relative aspect-[3/4] overflow-hidden rounded-xl border-2 ${ring} bg-slate-100`}>
                  <img src={f.url} alt={f.name} className="h-full w-full object-cover" />
                  {busy && (
                    <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/70">
                      <div
                        className="h-full bg-linear-to-r from-indigo-500 to-fuchsia-500 transition-all"
                        style={{ width: `${Math.round((f.progress || 0) * 100)}%` }}
                      />
                    </div>
                  )}
                  {f.status === 'done' && (
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                      ✓ {f.regions?.length ?? ''} bubbles
                    </span>
                  )}
                  {f.status === 'error' && (
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                      failed
                    </span>
                  )}
                  {!running && (
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      title="Remove page"
                      className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/60 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100 hover:bg-rose-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
            {files.length < MAX_FILES && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex aspect-[3/4] items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-indigo-400 hover:text-indigo-500"
              >
                <span className="text-center text-xs font-bold">
                  <span className="block text-2xl leading-none">＋</span>
                  Add pages
                </span>
              </button>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />

        <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600">
            Source language
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none"
            >
              {LANGS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                  {l.hint ? ` — ${l.hint}` : ''}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            {anyOut && (
              <button type="button" className="btn-secondary text-sm" onClick={downloadAll}>
                ⬇ Download all ({doneCount})
              </button>
            )}
            <button
              type="button"
              className="btn-primary text-sm"
              onClick={runAll}
              disabled={running || pendingCount === 0}
            >
              {running ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  {currentIdx >= 0 ? ` Page ${currentIdx + 1} / ${files.length}` : ' Working…'}
                </>
              ) : (
                <>Translate to Sinhala{pendingCount ? ` (${pendingCount})` : ''}</>
              )}
            </button>
          </div>
        </div>

        {notice && <p className="mt-3 text-sm font-medium text-rose-600">{notice}</p>}
      </div>

      {files.length > 0 && (
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
          {files.map((f) => (
            <ImageCard
              key={f.id}
              file={f}
              onRemove={removeFile}
              onRetry={processFile}
              onEdit={editTranslation}
              onDownload={download}
              disabled={running}
            />
          ))}
        </div>
      )}
    </section>
  );
}
