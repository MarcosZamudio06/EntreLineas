import { WORDS, WORD_BY_ID } from './data.js';

export function combinationKey(words) {
  return words.map(word => typeof word === 'string' ? word : word.id).sort().join('|');
}

export function generateCombination({ count = 3, categories = [], locks = [], previous = [], random = Math.random } = {}) {
  if (count !== 2 && count !== 3) throw new RangeError('Choose two or three words.');
  const allowed = new Set(categories);
  const pool = WORDS.filter(word => allowed.has(word.category));
  if (pool.length < count) return [];
  const used = new Set();
  const result = Array(count).fill(null);
  const validLocks = new Set();
  for (let i = 0; i < count; i++) {
    const word = WORD_BY_ID.get(locks[i]);
    if (word && allowed.has(word.category) && !used.has(word.id)) {
      result[i] = word;
      used.add(word.id);
      validLocks.add(i);
    }
  }
  const remaining = pool.filter(word => !used.has(word.id));
  for (let i = 0; i < count; i++) {
    if (result[i]) continue;
    const value = Math.max(0, Math.min(0.999999999, Number(random()) || 0));
    const [word] = remaining.splice(Math.floor(value * remaining.length), 1);
    result[i] = word;
  }
  if (previous.length === count && combinationKey(result) === combinationKey(previous)) {
    const replaceIndex = result.findIndex((_, index) => !validLocks.has(index));
    const selected = new Set(result.map(word => word.id));
    const replacement = pool.find(word => !selected.has(word.id));
    if (replaceIndex >= 0 && replacement) result[replaceIndex] = replacement;
  }
  return result;
}
