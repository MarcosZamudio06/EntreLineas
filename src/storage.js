import { WORD_BY_ID } from './data.js';

export function readStorage(storage, key, fallback) {
  try {
    const raw = storage?.getItem(key);
    return raw === null || raw === undefined ? fallback : JSON.parse(raw);
  } catch { return fallback; }
}

export function writeStorage(storage, key, value) {
  try { storage?.setItem(key, JSON.stringify(value)); return Boolean(storage); }
  catch { return false; }
}

export function sanitizeSavedIdeas(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.filter(idea => {
    if (!idea || typeof idea.id !== 'string' || !idea.id || idea.id.length > 100 || seen.has(idea.id) || !Array.isArray(idea.words) || ![2, 3].includes(idea.words.length)) return false;
    if (new Set(idea.words).size !== idea.words.length || !idea.words.every(id => WORD_BY_ID.has(id))) return false;
    seen.add(idea.id);
    return true;
  }).slice(0, 100).map(idea => ({
    id: idea.id.slice(0, 100), words: [...idea.words],
    note: typeof idea.note === 'string' ? idea.note.slice(0, 10000) : '',
    createdAt: Number.isFinite(idea.createdAt) && idea.createdAt >= 0 && idea.createdAt <= 8640000000000000 ? idea.createdAt : 0
  }));
}
