export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 64 64" className="h-9 w-9" aria-hidden="true">
              <defs>
                <linearGradient id="footer-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#818cf8" />
                  <stop offset="1" stopColor="#f472b6" />
                </linearGradient>
              </defs>
              <rect width="64" height="64" rx="16" fill="url(#footer-grad)" />
              <path
                d="M17 15h30a7 7 0 0 1 7 7v13a7 7 0 0 1-7 7H31l-11 9v-9h-3a7 7 0 0 1-7-7V22a7 7 0 0 1 7-7Z"
                fill="#0f172a"
              />
              <text
                x="34"
                y="37"
                textAnchor="middle"
                fontSize="22"
                fontWeight="700"
                fill="#c7d2fe"
                fontFamily="'Noto Sans Sinhala','Nirmala UI',sans-serif"
              >
                අ
              </text>
            </svg>
            <span className="font-display text-lg font-bold text-white">SinhaManga</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-400">
            Free AI manga translator for Sinhala readers. Bubbles preserved, artwork untouched,
            powered by DeepSeek.
          </p>
          <a
            href="https://github.com/itzzfinicalfire"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3.5 py-1.5 text-xs font-bold text-slate-200 transition hover:border-indigo-400 hover:text-indigo-300"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 2.87-.39c.97 0 1.95.13 2.87.39 2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12v3.14c0 .3.21.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
            </svg>
            Built by Finicalfire
          </a>
        </div>

        <div>
          <h3 className="text-sm font-bold tracking-wider text-white uppercase">Quick links</h3>
          <ul className="mt-4 space-y-2.5 text-sm font-medium">
            <li>
              <a href="#translator" className="transition hover:text-indigo-300">Translator</a>
            </li>
            <li>
              <a href="#features" className="transition hover:text-indigo-300">Features</a>
            </li>
            <li>
              <a href="#how" className="transition hover:text-indigo-300">How it works</a>
            </li>
            <li>
              <a href="#faq" className="transition hover:text-indigo-300">FAQ</a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold tracking-wider text-white uppercase">Good to know</h3>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-400">
            <li>🔒 Images are processed in your browser — never uploaded.</li>
            <li>🧠 Translations by DeepSeek, tuned for comic dialogue.</li>
            <li>අ Typeset with real Sinhala fonts, auto-fitted to bubbles.</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:px-6">
          <span>© 2026 SinhaManga — built by Finicalfire with ❤️ for Sinhala manga fans.</span>
          <span>
            Personal use only — respect the original manga creators. Not affiliated with
            manga-translator.ai.
          </span>
        </div>
      </div>
    </footer>
  );
}
