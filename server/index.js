import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { translateBatch } from './deepseek.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '2mb' }));

// ── API ────────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    apiKeyConfigured: Boolean(process.env.DEEPSEEK_API_KEY),
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  });
});

app.post('/api/translate', async (req, res) => {
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
          'DEEPSEEK_API_KEY is not configured on the server. Copy .env.example to .env, paste your DeepSeek key, and restart the server.',
      });
    }

    const translations = await translateBatch(texts, source || 'the original language');
    return res.json({ translations });
  } catch (err) {
    console.error('[translate] failed:', err.message);
    return res.status(err.status || 502).json({ error: err.message || 'Translation failed.' });
  }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));

// ── Static client (production build) ───────────────────────────────────────

const dist = path.resolve(__dirname, '..', 'dist');
app.use(express.static(dist));
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(dist, 'index.html'), (err) => {
    if (err) res.status(404).send('Client build not found. Run "npm run build" first, or use "npm run dev".');
  });
});

// JSON body parse errors and anything else that slipped through
app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }
  console.error('[server] error:', err.message);
  return res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`SinhaManga server listening on http://localhost:${PORT}`);
  if (!process.env.DEEPSEEK_API_KEY) {
    console.warn('⚠ DEEPSEEK_API_KEY is not set — translation will fail until you add it to .env');
  } else {
    console.log(`✔ DeepSeek API configured (model: ${process.env.DEEPSEEK_MODEL || 'deepseek-chat'})`);
  }
});
