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
          <span>© 2026 SinhaManga — made with ❤️ for Sinhala manga fans.</span>
          <span>
            Personal use only — respect the original manga creators. Not affiliated with
            manga-translator.ai.
          </span>
        </div>
      </div>
    </footer>
  );
}
