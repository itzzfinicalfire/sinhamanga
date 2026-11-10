const STEPS = [
  {
    title: 'Upload your manga pages',
    body: 'Drag & drop, click, or paste up to 10 pages (PNG / JPG / WEBP). Everything stays in your browser.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
      />
    ),
  },
  {
    title: 'Pick the source language',
    body: 'Japanese, English, Korean or Chinese. The AI reads the bubbles in your browser and DeepSeek translates every line into natural Sinhala — tone, jokes and sound effects included.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 0.817A5.888 5.888 0 0 1 9 11m1.111-5.941c2.228.4 4.36 1.107 6.354 2.08"
      />
    ),
  },
  {
    title: 'Preview, edit & download',
    body: 'Compare the Sinhala page with the original, fine-tune any line in the built-in editor, then download the PNG — ready to read or share.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-extrabold tracking-[0.22em] text-indigo-600 uppercase">How it works</p>
          <h2 className="font-display mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Translated in three simple steps
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            No signup, no limits — upload, choose, and enjoy instant Sinhala manga.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="font-display absolute -top-4 left-6 flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-600 to-fuchsia-600 text-base font-extrabold text-white shadow-lg shadow-indigo-300/50">
                {i + 1}
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="mt-4 h-8 w-8 text-indigo-500"
              >
                {s.icon}
              </svg>
              <h3 className="font-display mt-3 text-lg font-bold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a href="#translator" className="btn-primary text-base">
            Ready to experience the easiest way to read manga? Start for free →
          </a>
        </div>
      </div>
    </section>
  );
}
