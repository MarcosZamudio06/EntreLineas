import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { WORDS, CATEGORIES } from '../src/data.js';
import { generateCombination, combinationKey } from '../src/generator.js';
import { sanitizeSavedIdeas, readStorage, writeStorage } from '../src/storage.js';

const all = CATEGORIES.map(category => category.id);
test('word bank contains at least 100 entries in every category and 1200 overall', () => {
  assert.ok(CATEGORIES.length >= 12);
  for (const category of CATEGORIES) {
    const count = WORDS.filter(word => word.category === category.id).length;
    assert.ok(count >= 100, `${category.label}: ${count} entries; expected at least 100`);
  }
  assert.ok(WORDS.length >= 1200);
  assert.ok(WORDS.every(word => all.includes(word.category) && word.image && word.alt));
});
test('word IDs and labels remain globally unique after accent/case normalization', () => {
  const normalize = label => label.trim().normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es');
  assert.equal(new Set(WORDS.map(word => word.id)).size, WORDS.length);
  assert.equal(new Set(WORDS.map(word => normalize(word.label))).size, WORDS.length);
  assert.ok(WORDS.every(word => word.label === word.label.trim() && word.label.length > 0));
});
test('the original 36 IDs and labels in each category keep their order and meaning', () => {
  // Historical prefix hashes protect saved ideas created before the vocabulary expansion.
  const originalPrefixHashes = {
    artists: 'b231c550baafc24b6bbbe8adf1e12887d37869684ccab2fdf9e779228538e1c0',
    jewels: '6ec0da8b5fa5abdd3348c33c343b08697d5d64d83756bc42dd5b9dcd874d872d',
    moments: '2a19c0271520eb50193523e030555957e7418834a7b64354f135f23765a5e22d',
    couples: '3a689ec87faf1a49854d70ac7769e20627becb5708358a648b5c34378c20ab87',
    celebrities: '10ae6f96f8922e51a5d3aa9f77c66ff99d40f59919512ba543716411231e5070',
    movies: 'ae7d2a81eb6b71f13fe79fb1bde30e89d0a5f4258fa21e87b08ab8511414ff60',
    actors: '252cd95cfcde2d77ac9b4bbaaaf81cb8b770e4a0b770d0cbefe77ebe69e6f1d8',
    heroes: '92440a93618692d73a5100d4b130597f2f71e26657db6c7ef4180c98aa238b00',
    places: 'ebe5cbf3fab9c9495bfeb5cb4f427dc5478cc844ec7ff209bc1d7f8bb80a5981',
    feelings: 'd65b527922e6e31cde92125472e3017114560349927e18666d2821d0d3dbac50',
    nature: '7f5d666d526ea572e5c8d4e52824b8fbfeb3373129eb2d998a56e8e2edb70600',
    objects: '19ae592bca512082549609bdd2c3a3b578ba931385493843e15c65e1be526ed8',
  };
  for (const [category, expected] of Object.entries(originalPrefixHashes)) {
    const prefix = WORDS.filter(word => word.category === category).slice(0, 36).map(({ id, label }) => [id, label]);
    const actual = createHash('sha256').update(JSON.stringify(prefix)).digest('hex');
    assert.equal(actual, expected, `${category}: original saved-idea IDs must not change`);
  }
});
test('only two or three unique words are returned', () => {
  for (const count of [2, 3]) {
    const result = generateCombination({ count, categories: all });
    assert.equal(result.length, count);
    assert.equal(new Set(result.map(word => word.id)).size, count);
  }
  assert.throws(() => generateCombination({ count: 4, categories: all }), RangeError);
});
test('category filters restrict the complete result', () => {
  const result = generateCombination({ count: 3, categories: ['jewels'] });
  assert.ok(result.every(word => word.category === 'jewels'));
});
test('newly appended words are reachable in every category with two or three prompts', () => {
  for (const category of CATEGORIES) {
    const newestWord = WORDS.filter(word => word.category === category.id).at(-1);
    for (const count of [2, 3]) {
      const result = generateCombination({ count, categories: [category.id], random: () => 1 });
      assert.equal(result.length, count);
      assert.ok(result.every(word => word.category === category.id));
      assert.ok(result.some(word => word.id === newestWord.id));
    }
  }
});
test('locks preserve position and uniqueness', () => {
  const locked = WORDS.find(word => word.label === 'VVS');
  const result = generateCombination({ count: 3, categories: all, locks: [null, locked.id, null] });
  assert.equal(result[1].id, locked.id);
  assert.equal(new Set(result.map(word => word.id)).size, 3);
});
test('locks outside selected categories do not bypass filtering', () => {
  const locked = WORDS.find(word => word.category === 'jewels');
  const result = generateCombination({ count: 2, categories: ['moments'], locks: [locked.id] });
  assert.ok(result.every(word => word.category === 'moments'));
});
test('reroll avoids the previous set when another word is available', () => {
  const previous = generateCombination({ count: 3, categories: all, random: () => 0 });
  const next = generateCombination({ count: 3, categories: all, previous, random: () => 0 });
  assert.notEqual(combinationKey(next), combinationKey(previous));
});
test('fully locked combination stays unchanged', () => {
  const previous = WORDS.slice(0, 3);
  const next = generateCombination({ count: 3, categories: all, locks: previous.map(word => word.id), previous });
  assert.deepEqual(next.map(word => word.id), previous.map(word => word.id));
});
test('empty and unknown categories return no prompts without hanging', () => {
  assert.deepEqual(generateCombination({ count: 3, categories: [] }), []);
  assert.deepEqual(generateCombination({ count: 3, categories: ['unknown'] }), []);
});
test('duplicated locks cannot duplicate a word', () => {
  const id = WORDS[0].id;
  const result = generateCombination({ count: 3, categories: all, locks: [id, id, id] });
  assert.equal(new Set(result.map(word => word.id)).size, 3);
});
test('persisted ideas reject malformed, unknown, duplicated and oversized input', () => {
  const ids = WORDS.slice(0, 3).map(word => word.id);
  const input = [{ id: 'one', words: ids, note: 'hello', createdAt: 123 }, { id: 'bad', words: ['missing', 'no'] }, null, { id: 'duplicate', words: [ids[0], ids[0]] }];
  const saved = sanitizeSavedIdeas(input);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].note, 'hello');
  assert.deepEqual(sanitizeSavedIdeas({}), []);
  assert.ok(sanitizeSavedIdeas(Array(200).fill(input[0])).length <= 100);
});
test('storage failures and corrupt JSON degrade safely', () => {
  const broken = { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); } };
  assert.deepEqual(readStorage(broken, 'key', []), []);
  assert.equal(writeStorage(broken, 'key', []), false);
  assert.equal(readStorage({ getItem: () => '{' }, 'key', 'fallback'), 'fallback');
});
test('persisted date extremes cannot crash date rendering', () => {
  const words = WORDS.slice(0, 2).map(word => word.id);
  const [idea] = sanitizeSavedIdeas([{ id: 'extreme-date', words, createdAt: 1e100 }]);
  assert.doesNotThrow(() => new Intl.DateTimeFormat('es').format(idea.createdAt));
  assert.equal(idea.createdAt, 0);
});
test('every word references an existing local photograph', async () => {
  const { stat } = await import('node:fs/promises');
  for (const image of new Set(WORDS.map(word => word.image))) {
    const file = await stat(new URL(`../${image}`, import.meta.url));
    assert.ok(file.size > 1000, `${image} must contain a real image`);
  }
});
