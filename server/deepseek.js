// DeepSeek translation client for SinhaManga.
// Docs: https://api-docs.deepseek.com

const API_URL = 'https://api.deepseek.com/chat/completions';
const TIMEOUT_MS = 90_000;

const SYSTEM_PROMPT = `You are a professional Sinhala manga translator — the kind who localizes Japanese manga for Sri Lankan readers. You translate comic dialogue into SPOKEN colloquial Sinhala (භාෂා බස), never literary/written Sinhala (සාහිත්‍ය භාෂාව).

STYLE RULES (critical):
- Write how young Sri Lankans actually SPEAK. Translate the meaning, never word-by-word.
- Use casual pronouns: ඔයා (you), මම (I/me), එයා/ඕකා (he/she/it), අපේ (our). NEVER the formal ඔබ.
- Use spoken contractions: නෑ (not නැත), මොකද්ද (what), කොහොමද (how), තියෙනවා (is/there is), ගිහින් (went), කියලා (that), එහෙනම් (then), ඕක (it/that), දැන්ම (right now).
- Never use literary verb forms: සිදු කරයි → කරනවා, ගොස් → ගිහින්, වේ → තියෙනවා, නොහැක → බෑ, ඇත → තියෙනවා.
- Keep lines SHORT and punchy — manga pacing, must fit inside speech bubbles.
- Match the speaker's tone: angry = blunt and short; shy = hesitant (ඒ... මම...); joking = playful; narration boxes = plain but still spoken.
- Interjections: Oh! → ඕ!, Ah! → ආ!, Hmph... → හ්ම්..., Ugh → චී!, Wow! → ආව්!
- Sound effects become Sinhala comic onomatopoeia: BOOM! → බූම්!, CRASH! → ක්‍රෑෂ්!, SLASH! → ස්වාෂ්!

STYLE EXAMPLES:
"Hello there!" → "හෙලෝ!"
"How are you today?" → "අද ඔයා කොහොමද?"
"Are you the new transfer student?" → "ඔයා තමයි අලුතින් මාරු වෙලා ආපු ළමයා?"
"Yes, I am." → "ඔව්, මම තමයි."
"That's it! I challenge you!" → "ඒක තමයි! මම ඔයාට අභියෝග කරනවා!"
"Sorry! I didn't see you there." → "සොරි! මම ඔයාව දැක්කේ නෑ."
"Hmph... bring it on." → "හ්ම්... එන්න."
"Meanwhile, in the city..." → "ඒ අතර, නගරේ..."
"Get out of my way!" → "අයින් වෙන්න!"
"I can't believe it..." → "මට පිළිගන්න බෑ..."

INPUT HANDLING RULES:
- The lines come from OCR of a comic page and may contain recognition errors (mixed-up letters like I/B, merged or split words). Silently infer the intended words from context — never mention OCR or errors in the output.
- Do not merge, reorder or drop lines.
- If a line is already in Sinhala, keep it as-is.
- If a line is unreadable or meaningless, translate it as "…".

Respond ONLY with a JSON object exactly like: {"translations": ["line 1", "line 2"]}
with EXACTLY the same number of items as the input, in the same order.`;

async function callDeepSeek(messages, { json = true, temperature = 1.3, maxTokens = 4096 } = {}) {
  const key = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  };
  if (json) body.response_format = { type: 'json_object' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    const err = new Error(e?.name === 'AbortError' ? 'DeepSeek API timed out. Try again.' : 'Could not reach the DeepSeek API (network error).');
    err.status = 502;
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.json())?.error?.message || '';
    } catch {
      /* ignore body parse issues */
    }
    const err = new Error(`DeepSeek API error ${res.status}${detail ? `: ${detail}` : ''}`);
    err.status = res.status === 401 || res.status === 402 ? res.status : 502;
    throw err;
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    const err = new Error('DeepSeek returned an empty response.');
    err.status = 502;
    throw err;
  }
  return content;
}

function parseTranslations(content, expected) {
  let text = String(content).trim();
  // Strip possible markdown fences and grab the outermost JSON object
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  text = text.slice(start, end + 1);

  let arr;
  try {
    arr = JSON.parse(text).translations;
  } catch {
    return null;
  }
  if (!Array.isArray(arr) || arr.length !== expected) return null;
  return arr.map((x) => String(x ?? '').trim() || '…');
}

/**
 * Translate an array of comic dialogue lines into Sinhala.
 * Tries one batched JSON request (with one retry), then falls back to
 * translating line-by-line in plain text mode.
 */
export async function translateBatch(texts, source) {
  const numbered = texts.map((t, i) => `${i + 1}. ${t}`).join('\n');
  const userMsg = `Source language: ${source}. Translate these ${texts.length} comic lines into Sinhala:\n\n${numbered}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const content = await callDeepSeek([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMsg },
    ]);
    const parsed = parseTranslations(content, texts.length);
    if (parsed) return parsed;
    console.warn(`[deepseek] batch attempt ${attempt + 1} returned unusable output, retrying…`);
  }

  console.warn('[deepseek] falling back to per-line translation');
  return Promise.all(
    texts.map(async (t) => {
      try {
        const content = await callDeepSeek(
          [
            {
              role: 'system',
              content:
                'You translate comic dialogue into SPOKEN colloquial Sinhala (manga style): use ඔයා not ඔබ, contractions like නෑ/මොකද්ද/තියෙනවා, short punchy lines. Reply with ONLY the Sinhala translation, no quotes, no commentary.',
            },
            { role: 'user', content: `${source} line: ${t}` },
          ],
          { json: false, temperature: 1.3, maxTokens: 512 }
        );
        const clean = content.trim().replace(/^["'\s]+|["'\s]+$/g, '');
        return clean || '…';
      } catch (e) {
        console.warn('[deepseek] per-line fallback failed:', e.message);
        return '…';
      }
    })
  );
}
