# SinhaManga — AI Manga Translator to Sinhala සිංහල

**Built by [Finicalfire](https://github.com/itzzfinicalfire)**

A free, no-signup web app that translates manga/comic pages into **Sinhala** — in the spirit of
[manga-translator.ai](https://manga-translator.ai/), but focused on a single target language and
powered by **your own DeepSeek API key**.

Upload a page → the AI reads the speech bubbles **in your browser** → DeepSeek translates the
dialogue into natural Sinhala → the translation is typeset back into the original bubbles →
preview, tweak, download.

---

## ✨ Features

- **Speech bubbles preserved** — text is detected, covered and re-typeset inside the original bubbles; artwork untouched
- **Batch upload** — up to 10 pages at once (PNG / JPG / WEBP, 8 MB each), with live per-page progress
- **In-browser OCR** (Tesseract.js) — images never leave the user's device; only detected text lines are sent to the server
- **DeepSeek translation** — colloquial, comic-ready Sinhala with tone, jokes and sound effects; full-page context, JSON-validated output with per-line fallback
- **Native Sinhala typesetting** — locally hosted Noto Sans Sinhala, real glyph shaping, auto-fit font size & wrapping on canvas
- **Built-in editor** — edit any translated line; the page re-renders instantly
- **Reading order aware** — right-to-left ordering for Japanese/Chinese pages, top-to-bottom bands, vertical-text column merging
- **No signup, no tracking**

## 🧱 Stack

| Layer     | Tech                                                     |
| --------- | -------------------------------------------------------- |
| Frontend  | React 19 + Vite 6 + Tailwind CSS 4                       |
| OCR       | Tesseract.js 7 (WASM, in-browser, language data cached)  |
| Rendering | HTML5 Canvas + Noto Sans Sinhala (bundled font)          |
| Backend   | Node.js + Express (API proxy — keeps your key server-side) |
| LLM       | DeepSeek `deepseek-chat` (configurable via `.env`)       |

## 🚀 Quick start

**Prerequisites:** [Node.js](https://nodejs.org) 20+ and a DeepSeek API key
([get one here](https://platform.deepseek.com)).

```bash
# 1. Install dependencies
npm install

# 2. Configure your API key
copy .env.example .env      # Windows
# cp .env.example .env      # macOS / Linux
# → open .env and paste your DEEPSEEK_API_KEY

# 3. Run in dev mode (client on :5173, API on :3001)
npm run dev
# → open http://localhost:5173
```

### Production

```bash
npm run build     # builds the client into dist/
npm start         # serves the app + API on http://localhost:3001
```

> **Windows note:** if `npm` complains about scripts being disabled, use `npm.cmd run dev`.

## ⚙️ Configuration (`.env`)

| Variable           | Default         | Description                       |
| ------------------ | --------------- | --------------------------------- |
| `DEEPSEEK_API_KEY` | — (required)    | Your key from platform.deepseek.com |
| `DEEPSEEK_MODEL`   | `deepseek-chat` | e.g. `deepseek-reasoner` for extra quality (slower) |
| `PORT`             | `3001`          | API / production server port      |

## 🧠 How the pipeline works

```
┌─────────────┐   ┌──────────────────┐   ┌───────────────┐   ┌──────────────────┐
│  Upload     │ → │ OCR (browser)    │ → │ POST /api/    │ → │ DeepSeek API     │
│  up to 10   │   │ Tesseract.js     │   │ translate     │   │ batch translate  │
│  pages      │   │ lines → bubbles  │   │ (text only!)  │   │ to Sinhala (JSON)│
└─────────────┘   └──────────────────┘   └───────────────┘   └──────────────────┘
                          │                                          │
                          ▼                                          ▼
                  ┌───────────────────────────────────────────────────────┐
                  │ Canvas render: cover original text → fit & wrap       │
                  │ Sinhala text (Noto Sans Sinhala) → preview → download │
                  └───────────────────────────────────────────────────────┘
```

1. **OCR** runs client-side. Small scans are auto-upscaled for accuracy. Word boxes are grouped
   into bubble regions with dilation clustering (handles multi-line bubbles and vertical Japanese
   columns), then ordered in comic reading order (RTL for JP/ZH).
2. **Translation** happens on the Express server so your API key is never exposed. Lines for a
   whole page are sent together (keeps narrative context), with strict JSON output, a retry, and a
   per-line fallback.
3. **Rendering** samples the bubble's background colour to cover the original text, then
   auto-fits the Sinhala translation (font size, wrapping, centering) inside the box.

## ☁️ Deploying

### Vercel (recommended — free 24/7, never sleeps)

The repo is already Vercel-ready: `api/` contains the serverless functions
(`/api/translate`, `/api/health`) and `vercel.json` wires up the Vite build + SPA routing.
Your DeepSeek key lives in Vercel's environment variables — never in the code.

From the dashboard: push this repo to GitHub → vercel.com → Add New → Project → import the
repo → add the environment variable `DEEPSEEK_API_KEY` → Deploy.

Or with the CLI:

```bash
npm install -g vercel
vercel login
vercel project add sinhamanga
vercel link --project sinhamanga
# paste your key when prompted (or: echo YOUR_KEY | vercel env add DEEPSEEK_API_KEY production)
vercel env add DEEPSEEK_API_KEY production
vercel deploy --prod --yes
```

Every `git push` to GitHub now redeploys automatically (if you imported via the dashboard).

> Free-tier notes (Hobby plan): 100 GB bandwidth + 1M function calls per month, functions up
> to 300 s, no cold-start sleeps, no card. Personal / non-commercial use only. Translation
> usage still bills to your DeepSeek account (fractions of a cent per page).

### Any other Node host

The Express server (`npm run build && npm start`) serves the same site + API on one port —
works on Render, Railway, a VPS, etc. Set `DEEPSEEK_API_KEY` in the host's env vars.


## 🛠 Troubleshooting

- **"DeepSeek API key missing"** — create `.env` from `.env.example`, paste your key, restart the server.
- **401 / 402 from DeepSeek** — invalid key / insufficient balance on platform.deepseek.com.
- **No text detected** — pick the right source language (vertical vs horizontal Japanese matters!), and use reasonably sharp scans. The first run downloads the OCR language pack (~10–20 MB, cached afterwards).
- **Weird text boxes** — very stylised fonts, halftone backgrounds or heavy SFX can confuse OCR. You can fix any line in the editor.
- **Sinhala looks wrong** — the bundled font (`public/fonts/NotoSansSinhala.ttf`) must exist; if you deleted it, re-download [Noto Sans Sinhala](https://fonts.google.com/noto/specimen/Noto+Sans+Sinhala) or rely on the system fallback (Nirmala UI on Windows).

## 🗺 Roadmap ideas

- PDF chapter upload (pdf.js → page images)
- Server-side detection models (e.g. comic-text-detector) for tougher layouts
- Glossary / character-name memory across pages
- More source languages (just add Tesseract codes in `src/lib/langs.js`)
