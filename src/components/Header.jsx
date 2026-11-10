function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#db2777" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#logo-grad)" />
      <path
        d="M17 15h30a7 7 0 0 1 7 7v13a7 7 0 0 1-7 7H31l-11 9v-9h-3a7 7 0 0 1-7-7V22a7 7 0 0 1 7-7Z"
        fill="#fff"
      />
      <text
        x="34"
        y="37"
        textAnchor="middle"
        fontSize="22"
        fontWeight="700"
        fill="#4f46e5"
        fontFamily="'Noto Sans Sinhala','Nirmala UI',sans-serif"
      >
        අ
      </text>
    </svg>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="leading-tight">
            <span className="font-display block text-lg font-bold text-slate-900">SinhaManga</span>
            <span className="block text-[11px] font-semibold text-slate-500">
              Manga → <span className="font-sinhala">සිංහල</span>, instantly
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
          <a href="#translator" className="transition hover:text-indigo-600">Translator</a>
          <a href="#features" className="transition hover:text-indigo-600">Features</a>
          <a href="#how" className="transition hover:text-indigo-600">How it works</a>
          <a href="#faq" className="transition hover:text-indigo-600">FAQ</a>
        </nav>

        <a
          href="#translator"
          className="rounded-full bg-linear-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition hover:opacity-90"
        >
          Translate Now
        </a>
      </div>
    </header>
  );
}
