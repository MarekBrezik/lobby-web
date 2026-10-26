import { validImagePath, visibleMenu } from './menu-model.js';

export const escape = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function renderItem(item, images = true) {
  const image = images && validImagePath(item.image)
    ? `<a class="menu-photo-trigger" href="${escape(item.image)}" aria-label="Zvětšit fotografii: ${escape(item.name)}"><img class="menu-item-image" src="${escape(item.thumbnail || item.image)}" alt="${escape(item.imageLabel || item.name)}" width="160" height="160" loading="lazy"><span class="photo-zoom-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 5 5M10 7v6M7 10h6"/></svg></span></a>`
    : '';
  return `<li class="menu-item${image ? ' has-image' : ''}">${image}<div class="menu-item-copy"><div class="menu-item-line"><span class="menu-item-name">${escape(item.name)}</span>${item.price ? `<span class="menu-item-price">${escape(item.price)}</span>` : ''}</div>${item.amount ? `<span class="menu-item-amount">${escape(item.amount)}</span>` : ''}${item.description ? `<p class="menu-item-description">${escape(item.description)}</p>` : ''}${item.allergens ? `<p class="menu-item-allergens">Alergeny: ${escape(item.allergens)}</p>` : ''}${image && item.imageLabel ? '<p class="menu-image-label">Ilustrační fotografie</p>' : ''}</div></li>`;
}

const list = (items, layout) => `<ul class="menu-items">${items.map((item) => renderItem(item, ['cards', 'mixed'].includes(layout))).join('')}</ul>`;
const navEntry = (category) => `<span class="category-nav-entry${category.seasonal ? ' category-nav-entry-seasonal' : ''}"><a href="#${escape(category.id)}">${escape(category.name)}<span aria-hidden="true">↗</span></a></span>`;

export function renderMenuLayout(input) {
  const menu = visibleMenu(input);
  if (!menu.length) return '<p class="menu-empty">Nabídku právě připravujeme. Rádi vám poradíme na telefonu <a href="tel:+420703815252">+420 703 815 252</a>.</p>';
  const categories = menu.map((category, index) => `<section${category.demo ? ' data-nosnippet' : ''} class="menu-category${['cards', 'mixed'].includes(category.layout) ? ` menu-category-${category.layout}` : ''}" id="${escape(category.id)}" aria-labelledby="title-${escape(category.id)}"><div class="menu-category-heading"><span aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><h2 id="title-${escape(category.id)}">${escape(category.name)}</h2></div>${category.subtitle ? `<p class="menu-category-subtitle">${escape(category.subtitle)}</p>` : ''}${category.note ? `<p class="menu-category-note">${escape(category.note)}</p>` : ''}${category.groups ? `<div class="menu-groups">${category.groups.map((group) => `<div class="menu-group"><h3 class="menu-group-heading">${escape(group.name)}</h3>${group.note ? `<p class="menu-category-note">${escape(group.note)}</p>` : ''}${list(group.items, category.layout)}</div>`).join('')}</div>` : list(category.items, category.layout)}</section>`).join('\n');
  return `<nav class="category-nav" aria-label="Kategorie menu"><div class="category-nav-primary">${menu.filter((category) => !category.seasonal).map(navEntry).join('')}</div>${menu.filter((category) => category.seasonal).map(navEntry).join('')}</nav><div class="menu-categories">${categories}</div>`;
}
