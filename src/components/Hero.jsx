function Bubble({ children, className = '', tailClassName = 'left-5' }) {
  return (
    <div className={`relative inline-block rounded-2xl bg-white px-3.5 py-2 shadow-md ${className}`}>
      {children}
      <span className={`absolute -bottom-1.5 ${tailClassName} h-3 w-3 rotate-45 bg-white`} aria-hidden="true" />
    </div>
  );
}

function MangaPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
      {/* manga page */}
      <div className="relative rotate-2 rounded-3xl border-4 border-white bg-white p-3 shadow-2xl shadow-indigo-200/70">
        {/* panel 1 — original Japanese */}
        <div className="relative h-48 overflow-hidden rounded-xl bg-linear-to-br from-sky-100 via-indigo-50 to-fuchsia-100">
          {/* speed lines */}
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'repeating-linear-gradient(105deg, transparent 0 14px, #c7d2fe 14px 16px)',
            }}
            aria-hidden="true"
          />
          {/* character silhouette */}
          <div className="absolute bottom-0 left-1/2 h-28 w-24 -translate-x-1/2">
            <div className="mx-auto h-14 w-14 rounded-full bg-slate-700/85" />
            <div className="mx-auto -mt-2 h-16 w-20 rounded-t-[3rem] bg-slate-700/85" />
          </div>
          <div className="absolute right-3 top-3 rotate-2">
            <Bubble tailClassName="left-6">
              <span className="block text-sm font-bold text-slate-800">おはよう！</span>
            </Bubble>
          </div>
          <span className="absolute bottom-2 left-2 text-[10px] font-bold tracking-widest text-slate-400">
            ORIGINAL PAGE
          </span>
        </div>

        {/* translate chip */}
        <div className="relative z-10 -my-3 flex justify-center">
          <span className="flex items-center gap-1.5 rounded-full bg-linear-to-r from-indigo-600 to-fuchsia-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg">
            ✦ AI TRANSLATE
          </span>
        </div>

        {/* panel 2 — translated Sinhala */}
        <div className="relative h-48 overflow-hidden rounded-xl border-2 border-fuchsia-200 bg-slate-800">
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                'repeating-linear-gradient(75deg, transparent 0 14px, #f0abfc 14px 16px)',
            }}
            aria-hidden="true"
          />
          <div className="absolute bottom-0 left-1/2 h-28 w-24 -translate-x-1/2">
            <div className="mx-auto h-14 w-14 rounded-full bg-slate-600" />
            <div className="mx-auto -mt-2 h-16 w-20 rounded-t-[3rem] bg-slate-600" />
          </div>
          <div className="absolute left-3 top-4 -rotate-2">
            <Bubble tailClassName="left-8">
              <span className="font-sinhala block text-sm font-bold text-slate-800">සුබ උදෑසනක්!</span>
            </Bubble>
          </div>
          <span className="absolute bottom-2 right-2 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
            <span className="font-sinhala">සිංහල</span> • DEEPSEEK
          </span>
        </div>
      </div>

      {/* floating chips */}
      <span className="animate-floaty absolute -left-4 top-8 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-lg">
        日本語 → <span className="font-sinhala text-fuchsia-600">සිංහල</span>
      </span>
      <span className="animate-floaty-slow absolute -right-3 bottom-16 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-lg">
        🔒 OCR in your browser
      </span>
    </div>
  );
}

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* background blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-200/50 blur-3xl" />
        <div className="absolute right-0 top-8 h-96 w-96 rounded-full bg-fuchsia-200/50 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-100/70 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-2 lg:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3.5 py-1.5 text-xs font-bold text-indigo-700 shadow-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Powered by DeepSeek AI • Free • No signup
          </span>

          <h1 className="font-display mt-5 text-4xl leading-[1.08] font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Read any manga in{' '}
            <span className="font-sinhala text-gradient">සිංහල</span>
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            Upload a manga page — the AI reads the speech bubbles right in your browser, translates
            the dialogue into natural Sinhala, and typesets it back into the original artwork.
            Bubbles preserved. Artwork untouched.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#translator" className="btn-primary text-base">
              Start translating — free
              <span aria-hidden="true">→</span>
            </a>
            <a href="#how" className="btn-secondary text-base">
              See how it works
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-bold text-slate-400">
            <span>日本語</span>
            <span aria-hidden="true">•</span>
            <span>English</span>
            <span aria-hidden="true">•</span>
            <span>한국어</span>
            <span aria-hidden="true">•</span>
            <span>中文</span>
            <span className="text-slate-500">→</span>
            <span className="font-sinhala rounded-full bg-fuchsia-100 px-2.5 py-1 text-fuchsia-700">සිංහල</span>
          </div>

          <p className="mt-6 flex items-center gap-2 text-xs font-medium text-slate-400">
            🔒 Your images never leave this browser — only the detected text lines are sent for
            translation.
          </p>
        </div>

        <MangaPreview />
      </div>
    </section>
  );
}
