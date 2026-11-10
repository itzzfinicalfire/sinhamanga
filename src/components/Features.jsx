const FEATURES = [
  {
    title: 'Speech bubbles stay intact',
    body: 'The AI finds every bubble and text region on the page, covers only the original text, and typesets the Sinhala translation right there — the artwork is never touched.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
      />
    ),
  },
  {
    title: 'Batch up to 10 pages',
    body: 'Drop a whole scene at once. Every page gets live progress — reading, translating, typesetting — then a side-by-side preview and one-click PNG download.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122"
      />
    ),
  },
  {
    title: 'Native Sinhala typesetting',
    body: 'Proper Sinhala fonts with real glyph shaping, auto-fitted to each bubble. Translations are colloquial and comic-ready — tuned by DeepSeek for dialogue, tone and sound effects.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m-18.432 0A8.959 8.959 0 0 1 3 12c0-.778.099-1.533.284-2.253"
      />
    ),
  },
];

export default function Features() {
  return (
    <section id="features" className="scroll-mt-20 bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-extrabold tracking-[0.22em] text-indigo-600 uppercase">Features</p>
          <h2 className="font-display mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            A translator built for Sinhala readers
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Everything the big multi-language translators do — focused entirely on one target
            language, done properly.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-3xl border border-slate-200 bg-slate-50/60 p-6 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-300/50">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
                  {f.icon}
                </svg>
              </div>
              <h3 className="font-display mt-4 text-lg font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm font-bold text-slate-400">
          <span>Reads:</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">日本語 (vertical)</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">English</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">한국어</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">中文</span>
          <span className="text-slate-500">→</span>
          <span className="font-sinhala rounded-full bg-linear-to-r from-indigo-600 to-fuchsia-600 px-3 py-1 text-white">
            සිංහල
          </span>
        </div>
      </div>
    </section>
  );
}
