// Vercel serverless function: POST /api/translate
// Same contract as the local Express server (server/index.js) — the frontend
// calls whichever host it is deployed on. The DeepSeek key comes from the
// DEEPSEEK_API_KEY environment variable configured in the Vercel dashboard,
// so it never appears in the repository or the browser.

import { translateBatch } from '../server/deepseek.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST with a JSON body.' });
  }

  try {
    const { texts, source } = req.body || {};

    if (!Array.isArray(texts) || texts.length === 0 || !texts.every((t) => typeof t === 'string')) {
      return res.status(400).json({ error: 'Invalid request: "texts" must be a non-empty array of strings.' });
    }
    if (texts.length > 120) {
      return res.status(400).json({ error: 'Too many lines in one request (max 120).' });
    }
    if (!process.env.DEEPSEEK_API_KEY) {
      return res.status(500).json({
        error:
          'DEEPSEEK_API_KEY is not configured. Add it as an environment variable in your Vercel project settings and redeploy.',
      });
    }

    const translations = await translateBatch(texts, source || 'the original language');
    return res.status(200).json({ translations });
  } catch (err) {
    console.error('[translate] failed:', err.message);
    return res.status(err.status || 502).json({ error: err.message || 'Translation failed.' });
  }
}
