// Thin client for the SinhaManga API (proxied to DeepSeek by the Express server).

export async function checkHealth() {
  try {
    const r = await fetch('/api/health');
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function translateTexts(texts, source) {
  let r;
  try {
    r = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, source }),
    });
  } catch {
    throw new Error('Could not reach the translation server. Is it running? (npm run dev)');
  }

  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `Translation failed (${r.status}).`);
  if (!Array.isArray(data.translations) || data.translations.length !== texts.length) {
    throw new Error('The translation server returned an unexpected response.');
  }
  return data.translations;
}
