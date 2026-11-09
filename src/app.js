import { WORDS, CATEGORIES, WORD_BY_ID, CATEGORY_BY_ID } from './data.js';
import { generateCombination, combinationKey } from './generator.js';
import { readStorage, writeStorage, sanitizeSavedIdeas } from './storage.js';

const $ = selector => document.querySelector(selector);
const icon = name => `<svg aria-hidden="true"><use href="assets/icons.svg#${name}"/></svg>`;
const storageKeys = { notes: 'entre-lineas.notes.v1', ideas: 'entre-lineas.ideas.v1' };
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const initialNote = readStorage(storage, storageKeys.notes, '');
let savedIdeas = sanitizeSavedIdeas(readStorage(storage, storageKeys.ideas, []));
let activeCategories = new Set(CATEGORIES.map(category => category.id));
let wordCount = 3;
let locks = [null, null, null];
let currentWords = ['VVS', 'Medianoche', 'Interestelar'].map(label => WORDS.find(word => word.label === label));
let activeView = 'studio';
let toastTimer;
let animationTimer;
let noteTimer;
const notebook = $('#notebook');
notebook.value = typeof initialNote === 'string' ? initialNote.slice(0, 10000) : '';

const sidebar = $('#sidebar');
const menuButton = $('#menu-button');
const mobileViewport = window.matchMedia('(max-width: 720px)');

function syncSidebarVisibility() {
  const hidden = mobileViewport.matches && !sidebar.classList.contains('open');
  sidebar.inert = hidden;
  if (hidden) sidebar.setAttribute('aria-hidden', 'true');
  else sidebar.removeAttribute('aria-hidden');
  menuButton.setAttribute('aria-expanded', mobileViewport.matches && !hidden);
  menuButton.setAttribute('aria-label', mobileViewport.matches && !hidden ? 'Ocultar temas' : 'Mostrar temas');
}

function closeSidebar(focusTarget = menuButton) {
  const wasOpen = mobileViewport.matches && sidebar.classList.contains('open');
  sidebar.classList.remove('open');
  syncSidebarVisibility();
  if (wasOpen && focusTarget) focusTarget.focus({ preventScroll: true });
}

mobileViewport.addEventListener('change', () => {
  const focusWasInside = sidebar.contains(document.activeElement);
  const focusWasOnMenu = document.activeElement === menuButton;
  sidebar.classList.remove('open');
  syncSidebarVisibility();
  if (mobileViewport.matches && focusWasInside) menuButton.focus({ preventScroll: true });
  else if (!mobileViewport.matches && focusWasOnMenu) sidebar.querySelector('[aria-current="page"]').focus({ preventScroll: true });
});
syncSidebarVisibility();

function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4000);
}

function renderCategories() {
  $('#category-list').replaceChildren(...CATEGORIES.map(category => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'category-button';
    button.dataset.category = category.id;
    button.setAttribute('aria-pressed', activeCategories.has(category.id));
    button.innerHTML = `${icon(category.icon)}<span></span><span class="category-check">${icon('check')}</span>`;
    button.querySelector('span').textContent = category.label;
    button.addEventListener('click', () => {
      if (activeCategories.has(category.id)) activeCategories.delete(category.id);
      else activeCategories.add(category.id);
      locks = locks.map(id => activeCategories.has(WORD_BY_ID.get(id)?.category) ? id : null);
      updateCategoryStates();
      generate();
    });
    return button;
  }));
  updateCategoryStates();
}

function updateCategoryStates() {
  document.querySelectorAll('.category-button').forEach(button => button.setAttribute('aria-pressed', activeCategories.has(button.dataset.category)));
  $('#all-topics').textContent = activeCategories.size === CATEGORIES.length ? 'Limpiar' : 'Todos';
  $('#all-topics').setAttribute('aria-label', activeCategories.size === CATEGORIES.length ? 'Desmarcar todos los temas' : 'Seleccionar todos los temas');
}

function renderWords(animate = false) {
  clearTimeout(animationTimer);
  const grid = $('#prompt-grid');
  grid.classList.toggle('two-words', wordCount === 2);
  grid.classList.remove('revealing');
  if (!currentWords.length) {
    grid.innerHTML = `<div class="empty-state">${icon('spark')}<h2>Abre un nuevo universo.</h2><p>Selecciona al menos un tema para encontrar tu próxima conexión.</p><button class="button button-primary" type="button" id="restore-topics">Explorar todos los temas</button></div>`;
    $('#restore-topics').addEventListener('click', selectAllCategories);
  } else {
    grid.replaceChildren(...currentWords.map((word, index) => {
      const category = CATEGORY_BY_ID.get(word.category);
      const card = document.createElement('article');
      card.className = 'prompt-card';
      card.dataset.category = word.category;
      const image = document.createElement('img');
      image.src = word.image;
      image.alt = word.alt;
      image.decoding = 'async';
      image.addEventListener('error', () => { card.classList.add('error-image'); image.hidden = true; }, { once: true });
      const top = document.createElement('div');
      top.className = 'card-top';
      top.innerHTML = `<span class="card-number">0${index + 1}</span>`;
      const lockButton = document.createElement('button');
      lockButton.type = 'button';
      lockButton.className = 'lock-button';
      lockButton.setAttribute('aria-pressed', Boolean(locks[index]));
      lockButton.setAttribute('aria-label', `${locks[index] ? 'Soltar' : 'Fijar'} ${word.label}`);
      lockButton.title = locks[index] ? 'Soltar palabra' : 'Fijar palabra';
      lockButton.innerHTML = icon(locks[index] ? 'lock' : 'unlock');
      lockButton.addEventListener('click', () => {
        locks[index] = locks[index] ? null : word.id;
        lockButton.setAttribute('aria-pressed', Boolean(locks[index]));
        lockButton.setAttribute('aria-label', `${locks[index] ? 'Soltar' : 'Fijar'} ${word.label}`);
        lockButton.title = locks[index] ? 'Soltar palabra' : 'Fijar palabra';
        lockButton.innerHTML = icon(locks[index] ? 'lock' : 'unlock');
        updateGenerateState();
      });
      top.append(lockButton);
      const caption = document.createElement('div');
      caption.className = 'card-caption';
      const categoryLine = document.createElement('div');
      categoryLine.className = 'card-category';
      categoryLine.innerHTML = icon(category.icon);
      const categoryLabel = document.createElement('span');
      categoryLabel.textContent = category.label;
      categoryLine.append(categoryLabel);
      const title = document.createElement('h2');
      title.textContent = word.label;
      if (word.label.length > 15) title.className = 'long-word';
      const rule = document.createElement('span');
      rule.className = 'card-rule';
      rule.setAttribute('aria-hidden', 'true');
      caption.append(categoryLine, title, rule);
      card.append(image, top, caption);
      return card;
    }));
  }
  if (animate) {
    void grid.offsetWidth;
    grid.classList.add('revealing');
    animationTimer = setTimeout(() => grid.classList.remove('revealing'), 650);
  }
  $('#copy-button').disabled = !currentWords.length;
  $('#save-button').disabled = !currentWords.length;
  updateGenerateState();
}

function updateGenerateState() {
  const allLocked = currentWords.length === wordCount && locks.slice(0, wordCount).every(Boolean);
  $('#generate-button').disabled = !activeCategories.size || allLocked;
  $('#generate-button').title = allLocked ? 'Suelta una palabra para generar una nueva combinación' : '';
}

function generate() {
  if (currentWords.length === wordCount && locks.slice(0, wordCount).every(Boolean)) return;
  currentWords = generateCombination({ count: wordCount, categories: [...activeCategories], locks, previous: currentWords });
  locks = locks.slice(0, wordCount).map((id, index) => currentWords[index]?.id === id ? id : null);
  renderWords(true);
}

function selectAllCategories() {
  activeCategories = new Set(CATEGORIES.map(category => category.id));
  updateCategoryStates();
  generate();
}

function changeView(view) {
  activeView = view;
  $('#studio-view').hidden = view !== 'studio';
  $('#ideas-view').hidden = view !== 'ideas';
  $('#page-location').textContent = view === 'studio' ? 'Estudio' : 'Mis ideas';
  for (const [id, value] of [['studio-nav', 'studio'], ['ideas-nav', 'ideas']]) {
    $(`#${id}`).classList.toggle('active', view === value);
    if (view === value) $(`#${id}`).setAttribute('aria-current', 'page');
    else $(`#${id}`).removeAttribute('aria-current');
  }
  if (view === 'ideas') renderSavedIdeas();
  closeSidebar($('#main'));
}

function saveCurrentIdea() {
  if (!currentWords.length) return;
  const key = combinationKey(currentWords);
  const existing = savedIdeas.find(idea => combinationKey(idea.words) === key);
  const idea = {
    id: existing?.id || globalThis.crypto?.randomUUID?.() || `idea-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    words: currentWords.map(word => word.id), note: notebook.value,
    createdAt: Date.now()
  };
  savedIdeas = [idea, ...savedIdeas.filter(saved => saved.id !== idea.id)].slice(0, 100);
  const persisted = writeStorage(storage, storageKeys.ideas, savedIdeas);
  updateSavedCount();
  toast(persisted ? existing ? 'Idea actualizada con tus notas.' : 'Una conexión más en Mis ideas.' : 'Idea guardada solo durante esta sesión. El navegador bloquea el almacenamiento.');
}

function updateSavedCount() { $('#saved-count').textContent = savedIdeas.length; }

function renderSavedIdeas() {
  const container = $('#saved-ideas');
  if (!savedIdeas.length) {
    container.innerHTML = `<div class="empty-state">${icon('bookmark')}<h2>Todavía hay mucho por conectar.</h2><p>Guarda una combinación desde el estudio y aparecerá aquí junto a tus notas.</p><button type="button" class="button button-primary" id="back-to-studio">Volver al estudio ${icon('arrow')}</button></div>`;
    $('#back-to-studio').addEventListener('click', () => changeView('studio'));
    return;
  }
  const list = document.createElement('div');
  list.className = 'saved-list';
  for (const idea of savedIdeas) {
    const item = document.createElement('article');
    item.className = 'saved-item';
    const header = document.createElement('div');
    header.className = 'saved-item-header';
    const words = document.createElement('div');
    words.className = 'saved-words';
    idea.words.forEach((id, index) => {
      if (index) { const separator = document.createElement('span'); separator.className = 'separator'; separator.textContent = '×'; separator.setAttribute('aria-hidden', 'true'); words.append(separator); }
      const label = document.createElement('span');
      label.textContent = WORD_BY_ID.get(id).label;
      words.append(label);
    });
    const remove = document.createElement('button');
    remove.className = 'icon-button';
    remove.type = 'button';
    remove.setAttribute('aria-label', `Eliminar idea: ${idea.words.map(id => WORD_BY_ID.get(id).label).join(', ')}`);
    remove.innerHTML = icon('trash');
    remove.addEventListener('click', () => {
      const index = savedIdeas.findIndex(saved => saved.id === idea.id);
      savedIdeas = savedIdeas.filter(saved => saved.id !== idea.id);
      const persisted = writeStorage(storage, storageKeys.ideas, savedIdeas);
      updateSavedCount(); renderSavedIdeas();
      toast(persisted ? 'Idea eliminada.' : 'Eliminada en esta sesión; no se pudo actualizar el almacenamiento.');
      const buttons = container.querySelectorAll('.saved-item .icon-button');
      (buttons[Math.min(index, buttons.length - 1)] || $('#back-to-studio'))?.focus();
    });
    header.append(words, remove);
    item.append(header);
    if (idea.note) { const note = document.createElement('p'); note.className = 'saved-note'; note.textContent = idea.note; item.append(note); }
    const footer = document.createElement('div');
    footer.className = 'saved-item-footer';
    const date = document.createElement('span');
    date.className = 'saved-date';
    date.textContent = idea.createdAt ? new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).format(idea.createdAt) : 'Idea guardada';
    const reuse = document.createElement('button');
    reuse.type = 'button';
    reuse.className = 'text-button';
    reuse.innerHTML = `Volver a esta idea ${icon('arrow')}`;
    reuse.addEventListener('click', () => {
      currentWords = idea.words.map(id => WORD_BY_ID.get(id));
      wordCount = currentWords.length;
      locks = Array(wordCount).fill(null);
      currentWords.forEach(word => activeCategories.add(word.category));
      updateCategoryStates(); updateCountButtons();
      notebook.value = idea.note;
      updateNote();
      renderWords(); changeView('studio');
      $('#studio-title').scrollIntoView({ block: 'start' });
      $('#generate-button').focus({ preventScroll: true });
      toast('Recuperaste la combinación y sus notas.');
    });
    footer.append(date, reuse);
    item.append(footer); list.append(item);
  }
  container.replaceChildren(list);
}

function updateCountButtons() {
  document.querySelectorAll('[data-count]').forEach(button => {
    const selected = Number(button.dataset.count) === wordCount;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', selected);
  });
}

function persistNote() {
  clearTimeout(noteTimer);
  const persisted = writeStorage(storage, storageKeys.notes, notebook.value);
  $('#autosave-status').innerHTML = `${icon(persisted ? 'check' : 'help')}<span>${persisted ? 'Guardado en este navegador' : 'Sin guardar: almacenamiento no disponible'}</span>`;
}
function updateNote() {
  $('#character-count').textContent = `${notebook.value.length.toLocaleString('es')} / 10 000`;
  $('#autosave-status').innerHTML = `${icon('pen')}<span>Guardando…</span>`;
  clearTimeout(noteTimer);
  noteTimer = setTimeout(persistNote, 350);
}

$('#generate-button').addEventListener('click', generate);
$('#all-topics').addEventListener('click', () => {
  if (activeCategories.size === CATEGORIES.length) { activeCategories.clear(); locks = Array(wordCount).fill(null); updateCategoryStates(); generate(); }
  else selectAllCategories();
});
document.querySelectorAll('[data-count]').forEach(button => button.addEventListener('click', () => {
  const count = Number(button.dataset.count);
  if (count === wordCount) return;
  wordCount = count;
  locks = Array.from({ length: count }, (_, index) => locks[index] || null);
  updateCountButtons();
  generate();
}));
$('#save-button').addEventListener('click', saveCurrentIdea);
$('#copy-button').addEventListener('click', async () => {
  try {
    if (!navigator.clipboard?.writeText) throw Error('Clipboard unavailable');
    await navigator.clipboard.writeText(currentWords.map(word => word.label).join(' × '));
    toast('Palabras copiadas. Que empiece la letra.');
  } catch { toast('No se pudo copiar. Selecciona las palabras y cópialas manualmente.'); }
});
notebook.addEventListener('input', updateNote);
notebook.addEventListener('blur', persistNote);
window.addEventListener('pagehide', persistNote);
$('#studio-nav').addEventListener('click', () => changeView('studio'));
$('#ideas-nav').addEventListener('click', () => changeView('ideas'));
$('.brand').addEventListener('click', event => { event.preventDefault(); changeView('studio'); });
menuButton.addEventListener('click', () => {
  if (sidebar.classList.contains('open')) closeSidebar();
  else {
    sidebar.classList.add('open');
    syncSidebarVisibility();
    sidebar.querySelector('[aria-current="page"]').focus({ preventScroll: true });
  }
});
$('#help-button').addEventListener('click', () => {
  $('#help-panel').hidden = !$('#help-panel').hidden;
  closeSidebar($('#help-panel').hidden ? menuButton : $('#close-help'));
  if (!$('#help-panel').hidden) $('#help-panel').scrollIntoView({ block: 'center' });
});
$('#close-help').addEventListener('click', () => {
  $('#help-panel').hidden = true;
  (mobileViewport.matches ? menuButton : $('#help-button')).focus({ preventScroll: true });
});
document.addEventListener('click', event => {
  if (!sidebar.contains(event.target) && !menuButton.contains(event.target)) {
    closeSidebar(sidebar.contains(document.activeElement) ? menuButton : null);
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeSidebar();
    if (!$('#help-panel').hidden && $('#help-panel').contains(document.activeElement)) {
      (mobileViewport.matches ? menuButton : $('#help-button')).focus({ preventScroll: true });
    }
    $('#help-panel').hidden = true;
  }
  if (event.code !== 'Space' || event.repeat || activeView !== 'studio' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.target.closest('button, a, input, textarea, select, [contenteditable="true"]')) return;
  event.preventDefault();
  if (!$('#generate-button').disabled) generate();
});

$('#bank-label').textContent = `${WORDS.length} palabras · ${CATEGORIES.length} universos · conexiones inesperadas`;
renderCategories(); renderWords(); updateSavedCount();
$('#character-count').textContent = `${notebook.value.length.toLocaleString('es')} / 10 000`;
if (!storage) $('#autosave-status').innerHTML = `${icon('help')}<span>Notas disponibles solo en esta sesión</span>`;
