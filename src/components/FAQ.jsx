const FAQS = [
  {
    q: 'What is SinhaManga?',
    a: 'SinhaManga is a free AI tool that translates manga and comic pages into Sinhala. It detects the text inside speech bubbles in your browser, translates the dialogue with DeepSeek, and re-typesets it into the original bubbles — so the artwork and layout stay exactly as the artist made them.',
  },
  {
    q: 'Is it really free? Do I need an account?',
    a: 'For readers: completely free, no signup, no limits. The site owner simply pays a tiny amount per translated page through their own DeepSeek API key (fractions of a cent). If you are hosting your own copy, the key goes in your .env file.',
  },
  {
    q: 'Which file formats are supported?',
    a: 'PNG, JPG and WEBP images — up to 10 pages at a time, 8 MB each. Full PDF chapter support is on the roadmap.',
  },
  {
    q: 'Which source languages can it read?',
    a: 'Japanese (vertical and horizontal — vertical is the default, best for typical manga), English, Korean, Chinese (Simplified and Traditional). Mixed Japanese + English pages are handled by the default option.',
  },
  {
    q: 'Can I edit the translations?',
    a: 'Yes! Every translated page has a built-in editor — click "Edit Sinhala text" to fine-tune any line, and the page re-renders instantly before you download it.',
  },
  {
    q: 'Are my images uploaded anywhere?',
    a: 'No. The text detection (OCR) runs entirely inside your browser — your images never leave your device. Only the detected text lines are sent to the translation server, which forwards them to DeepSeek.',
  },
  {
    q: 'Can I use translated pages commercially?',
    a: 'Translations are meant for personal reading. Manga is copyrighted work — for any commercial use or redistribution, get permission from the original author or publisher first.',
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="scroll-mt-20 bg-white py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-extrabold tracking-[0.22em] text-indigo-600 uppercase">FAQ</p>
          <h2 className="font-display mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-slate-200 bg-slate-50/60 open:border-indigo-200 open:bg-indigo-50/40"
              open={i === 0}
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-left font-semibold text-slate-800">
                {f.q}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5 shrink-0 text-indigo-500 transition group-open:rotate-180"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </summary>
              <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
