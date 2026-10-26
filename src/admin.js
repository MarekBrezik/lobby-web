import { normalizeMenu, layouts, imageHelp, validImagePath } from './menu-model.js';
import { escape } from './menu-render.js';

const $ = (selector) => document.querySelector(selector);
const state = { categories: [], selected: null, revision: 0, dirty: false, busy: false, uploads: 0, loaded: false };
const selected = () => state.categories.find((category) => category.id === state.selected);
const error = (message = '') => { $('#error').textContent = message; $('#error').hidden = !message; };
const field = (label, key, value = '', type = 'text') => `<label class="admin-field"><span>${escape(label)}</span><input data-field="${key}" type="${type}" value="${escape(value)}"></label>`;
const area = (label, key, value = '') => `<label class="admin-field"><span>${escape(label)}</span><textarea data-field="${key}" rows="2">${escape(value)}</textarea></label>`;
const check = (label, key, value) => `<label class="admin-check"><input type="checkbox" data-field="${key}" ${value ? 'checked' : ''}><span>${escape(label)}</span></label>`;
const action = (label, name, extra = '') => `<button type="button" data-action="${name}" ${extra}>${escape(label)}</button>`;

function controls() {
  $('#publish').disabled = !state.loaded || !state.dirty || state.busy || state.uploads > 0;
  for (const id of ['reload', 'export', 'add-category', 'add-seasonal']) $(`#${id}`).disabled = !state.loaded || state.busy;
  $('#editor').inert = state.busy;
  $('.admin-sidebar').inert = state.busy;
  $('#status').textContent = state.busy ? 'Ukládám…' : state.uploads ? 'Nahrávám fotografii…' : state.dirty ? 'Máte neuložené změny. Pro návštěvníky se projeví až po uložení.' : state.loaded ? `Uloženo · verze ${state.revision}${state.revision ? '' : ' · zatím výchozí podklady projektu'}` : 'Načítám nabídku…';
}
function dirty() { state.dirty = true; controls(); }
function renderNav() {
  $('#categories').innerHTML = state.categories.map((category) => `<button type="button" data-select="${escape(category.id)}" ${category.id === state.selected ? 'aria-current="true"' : ''}><span>${escape(category.name || 'Bez názvu')}</span><small>${category.seasonal ? 'Sezónní · ' : ''}${category.visible === false ? 'Skrytá' : 'Viditelná'}</small></button>`).join('');
}
function itemEditor(item, index, groupIndex) {
  const image = validImagePath(item.image) ? `<div class="admin-image"><img src="${escape(item.thumbnail || item.image)}" alt="${escape(item.name)}" width="100" height="100">${action('Odebrat fotografii', 'clear-image')}</div>` : '';
  return `<details class="item-editor" data-item="${index}" data-group="${groupIndex}"><summary><span class="item-title">${escape(item.name || 'Nová položka')}</span><span class="item-price">${escape(item.price || '')}</span><span>${item.visible === false ? 'Skrytá' : ''}</span></summary><div class="item-fields" data-scope="item"><div class="admin-field-grid">${field('Název položky', 'name', item.name)}${field('Cena', 'price', item.price)}${field('Množství / gramáž', 'amount', item.amount)}${field('Alergeny', 'allergens', item.allergens)}</div>${area('Popis / složení', 'description', item.description)}${check('Zobrazovat položku', 'visible', item.visible !== false)}${image}<label class="admin-field"><span>${item.image ? 'Vyměnit fotografii' : 'Přidat fotografii'}</span><input type="file" data-upload accept="image/jpeg,image/webp,image/png"></label><p class="admin-help">${imageHelp} Originál nejvýše 8 MB. PNG je také podporováno.</p>${check('Fotografie je pouze ilustrační', 'illustrative', Boolean(item.imageLabel))}<p class="admin-help image-warning">${escape(item._imageWarning || '')}</p><div class="admin-item-actions">${action('Posunout výš', 'item-up')}${action('Posunout níž', 'item-down')}${action('Odstranit položku', 'remove-item')}</div></div></details>`;
}
function renderEditor() {
  const category = selected();
  if (!category) { $('#editor').innerHTML = '<h2>Začněte kategorií</h2><p>Přidejte běžnou nebo sezónní nabídku. Žádná sezónní nabídka není povinná.</p>'; return; }
  const groups = category.groups || [{ name: '', items: category.items }];
  $('#editor').innerHTML = `<h2>${escape(category.name)}</h2><div class="category-fields" data-scope="category"><div class="admin-field-grid">${field('Název nabídky / kategorie', 'name', category.name)}${field('Pořadí kategorie', 'order', category.order, 'number')}</div>${field('Podnadpis', 'subtitle', category.subtitle)}${area('Doplňující informace k nabídce', 'note', category.note)}<label class="admin-field"><span id="layout-label">Způsob zobrazení</span><select data-field="layout" aria-labelledby="layout-label">${Object.entries(layouts).map(([key, label]) => `<option value="${key}" ${category.layout === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label><p class="admin-help layout-help">${layoutHelp(category.layout)}</p><div class="admin-checks">${check('Zobrazovat nabídku', 'visible', category.visible !== false)}${check('Sezónní nabídka — samostatný řádek na konci menu', 'seasonal', category.seasonal)}${check('Jen grafická ukázka, nikoliv skutečné produkty', 'demo', category.demo)}</div><div class="admin-item-actions">${action('Kategorii výš', 'category-up')}${action('Kategorii níž', 'category-down')}${action('Odstranit kategorii', 'remove-category')}</div></div><div class="admin-section-title"><h3>Položky nabídky</h3>${action('Přidat podsekci', 'add-group')}</div><p class="admin-help">Cenu zadejte například 85 Kč, 75 / 95 Kč nebo Dle nabídky. Samotné číslo při uložení doplníme o Kč. Položka nemusí mít fotografii.</p>${groups.map((group, groupIndex) => `<section class="admin-group" data-group="${category.groups ? groupIndex : -1}">${category.groups ? `<div data-scope="group">${field('Název podsekce', 'name', group.name)}${area('Poznámka k podsekci', 'note', group.note)}<div class="admin-item-actions">${action('Podsekci výš', 'group-up')}${action('Podsekci níž', 'group-down')}${action('Odstranit podsekci', 'remove-group')}</div></div>` : ''}${group.items.map((item, index) => itemEditor(item, index, category.groups ? groupIndex : -1)).join('')}${action('Přidat položku', 'add-item', `data-group="${category.groups ? groupIndex : -1}"`)}</section>`).join('')}`;
}
const layoutHelp = (layout) => layout === 'list' ? 'Čistě textový lístek. Uložené fotografie se v tomto režimu nezobrazují.' : layout === 'cards' ? 'Fotografické karty s názvem, cenou a popisem. Položky bez fotografie zůstanou bez prázdného rámečku.' : 'Kombinace textových položek a položek s fotografií. Fotografie nejsou povinné.';
function render() { renderNav(); renderEditor(); controls(); }
function listFor(groupIndex) { return groupIndex < 0 ? selected().items : selected().groups[groupIndex].items; }
function move(array, index, direction) {
  const next = index + direction;
  if (next < 0 || next >= array.length) return false;
  [array[index], array[next]] = [array[next], array[index]];
  return true;
}
async function api(path, options = {}) {
  const response = await fetch(path, { credentials: 'same-origin', ...options });
  let data;
  try { data = await response.json(); } catch { throw new Error('Administrace neodpovídá. Zkontrolujte přihlášení a připojení.'); }
  if (!response.ok) throw new Error(data.error || 'Požadavek se nepodařil.');
  return data;
}
async function load() {
  if (state.dirty && !confirm('Zahodit neuložené změny a načíst zveřejněnou nabídku?')) return;
  error();
  try {
    const data = await api('/api/admin/menu');
    state.categories = data.categories;
    state.revision = data.revision;
    state.selected = state.categories.some((category) => category.id === state.selected) ? state.selected : state.categories[0]?.id;
    state.loaded = true;
    state.dirty = false;
    $('#identity').textContent = data.identity.local ? 'Lokální zkušební režim — neovlivňuje zveřejněný web' : `Přihlášeno: ${data.identity.email}`;
    render();
  } catch (failure) { error(failure.message); $('#status').textContent = 'Administrace není připojená.'; }
}

$('#categories').addEventListener('click', (event) => {
  const button = event.target.closest('[data-select]');
  if (!button) return;
  state.selected = button.dataset.select;
  render();
  $('#editor').focus({ preventScroll: true });
});
$('#editor').addEventListener('input', (event) => {
  const input = event.target;
  if (!input.dataset.field) return;
  const category = selected();
  const scope = input.closest('[data-scope]').dataset.scope;
  const itemElement = input.closest('[data-item]');
  const groupIndex = Number(input.closest('[data-group]')?.dataset.group ?? -1);
  const object = scope === 'item' ? listFor(groupIndex)[Number(itemElement.dataset.item)] : scope === 'group' ? category.groups[groupIndex] : category;
  const key = input.dataset.field;
  const value = input.type === 'checkbox' ? input.checked : input.type === 'number' ? Number(input.value) : input.value;
  if (key === 'illustrative') object.imageLabel = value ? 'Ilustrační fotografie' : '';
  else object[key] = value;
  if (scope === 'category') {
    if (key === 'name' && category.schemaName) category.schemaName = value;
    renderNav();
    if (key === 'layout') $('.layout-help').textContent = layoutHelp(value);
  }
  if (scope === 'item') {
    itemElement.querySelector('.item-title').textContent = object.name || 'Nová položka';
    itemElement.querySelector('.item-price').textContent = object.price || '';
  }
  dirty();
});
$('#editor').addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const category = selected();
  const name = button.dataset.action;
  const groupIndex = Number(button.closest('[data-group]')?.dataset.group ?? -1);
  const itemIndex = Number(button.closest('[data-item]')?.dataset.item);
  if (name === 'add-item') {
    const list = listFor(groupIndex);
    list.push({ name: 'Nová položka', price: '', visible: true });
    dirty(); renderEditor();
    const details = [...document.querySelectorAll(`.item-editor[data-group="${groupIndex}"]`)].at(-1);
    details.open = true; details.querySelector('input').focus();
    return;
  }
  if (name === 'add-group') {
    const groupName = prompt('Název podsekce (například Nápoje nebo Snídaně):');
    if (!groupName?.trim()) return;
    if (!category.groups) { category.groups = category.items.length ? [{ name: 'Položky', items: category.items }] : []; delete category.items; }
    category.groups.push({ name: groupName.trim(), items: [] });
  } else if (name === 'remove-category') {
    if (!confirm(`Odstranit kategorii „${category.name}“ včetně položek? Změna se projeví až po uložení.`)) return;
    state.categories.splice(state.categories.indexOf(category), 1);
    state.selected = state.categories[0]?.id;
  } else if (name.startsWith('category-')) {
    const peers = state.categories.filter((entry) => Boolean(entry.seasonal) === Boolean(category.seasonal)).sort((a, b) => a.order - b.order);
    if (!move(peers, peers.indexOf(category), name.endsWith('up') ? -1 : 1)) return;
    peers.forEach((entry, index) => { entry.order = (index + 1) * 10; });
    state.categories.sort((a, b) => Number(Boolean(a.seasonal)) - Number(Boolean(b.seasonal)) || a.order - b.order);
  } else if (name === 'remove-group') {
    if (!confirm('Odstranit podsekci i její položky? Změna se projeví až po uložení.')) return;
    category.groups.splice(groupIndex, 1);
  } else if (name.startsWith('group-')) {
    if (!move(category.groups, groupIndex, name.endsWith('up') ? -1 : 1)) return;
  } else if (name === 'remove-item') {
    if (!confirm('Odstranit položku? Změna se projeví až po uložení.')) return;
    listFor(groupIndex).splice(itemIndex, 1);
  } else if (name === 'clear-image') {
    for (const key of ['image', 'thumbnail', 'imageLabel', '_imageWarning']) delete listFor(groupIndex)[itemIndex][key];
  } else if (name.startsWith('item-')) {
    if (!move(listFor(groupIndex), itemIndex, name.endsWith('up') ? -1 : 1)) return;
  }
  dirty(); render();
});

async function thumbnail(file) {
  const image = new Image();
  const url = URL.createObjectURL(file);
  try {
    image.src = url;
    await image.decode();
    if (image.naturalWidth * image.naturalHeight > 50000000) throw new Error('Fotografie je příliš velká. Zmenšete ji před nahráním.');
    const scale = Math.min(1, 720 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', .82));
    if (!blob) throw new Error('Nepodařilo se připravit náhled fotografie.');
    return blob;
  } finally { URL.revokeObjectURL(url); }
}
$('#editor').addEventListener('change', async (event) => {
  if (!event.target.matches('[data-upload]')) return;
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) { error('Fotografie může mít nejvýše 8 MB.'); return; }
  const element = event.target.closest('[data-item]');
  const item = listFor(Number(element.dataset.group))[Number(element.dataset.item)];
  state.uploads++; controls(); error(); event.target.disabled = true;
  try {
    const preview = await thumbnail(file);
    const form = new FormData();
    form.append('image', file);
    form.append('thumbnail', preview, preview.type === 'image/webp' ? 'thumbnail.webp' : 'thumbnail.png');
    const result = await api('/api/admin/images', { method: 'POST', body: form });
    item.image = result.image;
    item.thumbnail = result.thumbnail;
    item._imageWarning = result.lowResolution ? 'Fotografie má nižší rozlišení než doporučených 1600 px. Nahrání proběhlo v pořádku; obrázek nezvětšujeme uměle.' : '';
    dirty();
  } catch (failure) { error(failure.message); }
  finally { state.uploads--; renderEditor(); controls(); }
});
function addCategory(seasonal) {
  const category = { id: `nabidka-${crypto.randomUUID().slice(0, 8)}`, name: seasonal ? 'Nová sezónní nabídka' : 'Nová kategorie', order: Math.max(0, ...state.categories.map((entry) => entry.order)) + 10, layout: 'list', visible: false, seasonal, items: [] };
  state.categories.push(category); state.selected = category.id;
  dirty(); render(); $('#editor input').focus();
}
$('#add-category').addEventListener('click', () => addCategory(false));
$('#add-seasonal').addEventListener('click', () => addCategory(true));
$('#reload').addEventListener('click', load);
$('#publish').addEventListener('click', async () => {
  error();
  try {
    const categories = normalizeMenu(state.categories);
    state.busy = true; controls();
    const result = await api('/api/admin/menu', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categories, baseRevision: state.revision }) });
    state.categories = result.categories; state.revision = result.revision; state.dirty = false;
    render();
  } catch (failure) { error(failure.message); }
  finally { state.busy = false; controls(); }
});
$('#export').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ revision: state.revision, categories: state.categories }, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `lobby-menu-${new Date().toISOString().slice(0, 10)}.json`; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
window.addEventListener('beforeunload', (event) => { if (state.dirty || state.uploads) { event.preventDefault(); event.returnValue = ''; } });
load();
