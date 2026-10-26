export class MenuError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export const layouts = { list: 'Textové menu', cards: 'Fotografické karty', mixed: 'Kombinace fotografií a textu' };
export const imageHelp = 'Doporučená delší strana alespoň 1600 px, ideálně 2000 px. Formát JPG nebo WebP. Fotografie se v náhledu zobrazí celá, bez ořezu.';
export const validImagePath = (value) => typeof value === 'string' && !value.includes('..') && /^(\/assets\/[\w/-]+\.(webp|png|jpe?g)|\/menu-images\/[a-f0-9-]{36}\/(original|thumbnail)\.(webp|png|jpg))$/.test(value);
const text = (value, max, name, required = false) => {
  if (value != null && typeof value !== 'string') throw new MenuError(`${name}: očekáván text.`);
  const result = (value || '').trim();
  if (result.length > max || (required && !result)) throw new MenuError(`${name}: vyplňte text do ${max} znaků.`);
  return result;
};
const flag = (value, fallback = false) => {
  if (value != null && typeof value !== 'boolean') throw new MenuError('Neplatná hodnota viditelnosti nebo přepínače.');
  return value ?? fallback;
};

export function normalizeMenu(input) {
  if (!Array.isArray(input) || input.length > 50) throw new MenuError('Menu může mít nejvýše 50 kategorií.');
  const ids = new Set();
  let itemCount = 0;
  const item = (value) => {
    if (!value || typeof value !== 'object' || ++itemCount > 1500) throw new MenuError('Menu může mít nejvýše 1500 položek.');
    const result = { name: text(value.name, 160, 'Název položky', true), visible: flag(value.visible, true) };
    for (const [key, limit] of Object.entries({ price: 100, amount: 100, description: 3000, allergens: 500, imageLabel: 300 })) result[key] = text(value[key], limit, key);
    if (/^\d+(?:[,.]\d{1,2})?$/.test(result.price)) result.price += ' Kč';
    for (const key of ['image', 'thumbnail']) {
      if (value[key] && !validImagePath(value[key])) throw new MenuError('Fotografie musí pocházet z místních podkladů nebo nahrávání.');
      if (value[key]) result[key] = value[key];
    }
    if (result.thumbnail && !result.image) throw new MenuError('Náhled fotografie nemá originál.');
    return result;
  };
  const items = (value) => {
    if (!Array.isArray(value)) throw new MenuError('Chybí seznam položek.');
    return value.map(item);
  };
  return input.map((value) => {
    if (!value || typeof value !== 'object') throw new MenuError('Neplatná kategorie.');
    const id = text(value.id, 80, 'Identifikátor kategorie', true);
    if (!/^[a-z][a-z0-9-]*$/.test(id) || ids.has(id)) throw new MenuError('Kategorie musí mít jedinečný identifikátor bez diakritiky.');
    ids.add(id);
    const layout = value.layout ?? 'list';
    if (!Object.hasOwn(layouts, layout)) throw new MenuError('Neplatný způsob zobrazení nabídky.');
    const order = value.order ?? 0;
    if (!Number.isSafeInteger(order) || Math.abs(order) > 100000) throw new MenuError('Pořadí musí být celé číslo do 100000.');
    const result = {
      id, order, layout, name: text(value.name, 160, 'Název kategorie', true),
      subtitle: text(value.subtitle, 500, 'Podnadpis'), note: text(value.note, 4000, 'Poznámka'),
      visible: flag(value.visible, true), seasonal: flag(value.seasonal), demo: flag(value.demo),
    };
    if (value.schemaName) result.schemaName = text(value.schemaName, 160, 'Název pro vyhledávače');
    if (value.groups !== undefined) {
      if (!Array.isArray(value.groups) || value.groups.length > 40 || value.items !== undefined) throw new MenuError('Kategorie má neplatné podsekce.');
      result.groups = value.groups.map((group) => {
        if (!group || typeof group !== 'object') throw new MenuError('Neplatná podsekce.');
        return { name: text(group.name, 160, 'Název podsekce', true), note: text(group.note, 3000, 'Poznámka podsekce'), items: items(group.items) };
      });
    } else result.items = items(value.items);
    return result;
  }).sort((a, b) => Number(a.seasonal) - Number(b.seasonal) || a.order - b.order);
}

export function visibleMenu(categories) {
  return categories.filter((category) => category.visible !== false).map((category) => {
    if (category.groups) return { ...category, groups: category.groups.map((group) => ({ ...group, items: group.items.filter((item) => item.visible !== false) })).filter((group) => group.items.length) };
    return { ...category, items: category.items.filter((item) => item.visible !== false) };
  }).filter((category) => category.groups ? category.groups.length : category.items.length)
    .sort((a, b) => Number(Boolean(a.seasonal)) - Number(Boolean(b.seasonal)) || a.order - b.order);
}
