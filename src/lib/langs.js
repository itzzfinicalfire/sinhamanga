// Source languages the OCR engine can read (Tesseract language codes).
// The target language is always Sinhala.

export const LANGS = [
  {
    value: 'jpn_vert+eng',
    label: 'Japanese (vertical) + English',
    hint: 'best for manga',
    source: 'Japanese (with occasional English)',
  },
  { value: 'jpn', label: 'Japanese (horizontal)', source: 'Japanese' },
  { value: 'eng', label: 'English', source: 'English' },
  { value: 'kor', label: 'Korean', source: 'Korean' },
  { value: 'chi_sim', label: 'Chinese (Simplified)', source: 'Chinese (Simplified)' },
  { value: 'chi_tra', label: 'Chinese (Traditional)', source: 'Chinese (Traditional)' },
];

export function langMeta(value) {
  return LANGS.find((l) => l.value === value) || LANGS[0];
}

export function langSourceLabel(value) {
  return langMeta(value).source;
}

// Japanese and Chinese comics traditionally read right-to-left.
export function isRtlLang(value) {
  return /^(jpn|chi)/.test(value);
}
