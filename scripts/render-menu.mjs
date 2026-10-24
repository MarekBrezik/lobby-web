import { writeFile } from 'node:fs/promises';
import { menu } from '../src/menu-data.js';

const escape = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function renderItem(item) {
  const image = item.image && /^\/assets\/[\w./-]+$/.test(item.image)
    ? `<a class="menu-photo-trigger" href="${escape(item.image)}" aria-label="Zvětšit fotografii: ${escape(item.name)}"><img class="menu-item-image" src="${escape(item.image)}" alt="${escape(item.imageLabel || item.name)}" width="160" height="160" loading="lazy"><span class="photo-zoom-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 5 5M10 7v6M7 10h6"/></svg></span></a>`
    : '';
  return `<li class="menu-item${image ? ' has-image' : ''}">${image}<div class="menu-item-copy"><div class="menu-item-line"><span class="menu-item-name">${escape(item.name)}</span>${item.price ? `<span class="menu-item-price">${escape(item.price)}</span>` : ''}</div>${item.amount ? `<span class="menu-item-amount">${escape(item.amount)}</span>` : ''}${item.description ? `<p class="menu-item-description">${escape(item.description)}</p>` : ''}${item.allergens ? `<p class="menu-item-allergens">Alergeny: ${escape(item.allergens)}</p>` : ''}${item.imageLabel ? '<p class="menu-image-label">Ilustrační fotografie</p>' : ''}</div></li>`;
}

const list = (items) => `<ul class="menu-items">${items.map(renderItem).join('')}</ul>`;
const categories = menu.map((category, index) => `<section class="menu-category${['cards', 'mixed'].includes(category.layout) ? ` menu-category-${category.layout}` : ''}" id="${escape(category.id)}" aria-labelledby="title-${escape(category.id)}"><div class="menu-category-heading"><span aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><h2 id="title-${escape(category.id)}">${escape(category.name)}</h2></div>${category.subtitle ? `<p class="menu-category-subtitle">${escape(category.subtitle)}</p>` : ''}${category.note ? `<p class="menu-category-note">${escape(category.note)}</p>` : ''}${category.groups ? `<div class="menu-groups">${category.groups.map((group) => `<div class="menu-group"><h3 class="menu-group-heading">${escape(group.name)}</h3>${group.note ? `<p class="menu-category-note">${escape(group.note)}</p>` : ''}${list(group.items)}</div>`).join('')}</div>` : list(category.items)}</section>`).join('\n');

await writeFile(new URL('../menu/index.html', import.meta.url), `<!doctype html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#F8F5F0">
  <title>Menu — LOBBY CAFE Zlín</title>
  <meta name="description" content="Nabídka LOBBY CAFE: výběrová káva, snídaně, brunch, domácí limonády a večerní drinky. Přehledné menu včetně cen.">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="cs_CZ">
  <meta property="og:title" content="Menu — LOBBY CAFE Zlín">
  <meta property="og:description" content="Od ranního espressa přes vydatný brunch až po večerní drinky.">
  <meta property="og:image" content="/assets/share.png">
  <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">
  <link rel="icon" href="/assets/favicon.png" type="image/png" sizes="150x150">
  <link rel="preload" href="/assets/tenor-sans.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="preload" href="/assets/figtree.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="stylesheet" href="/src/style.css">
  <script type="module" src="/src/main.js"></script>
</head>
<body class="menu-page">
  <a class="skip-link" href="#obsah">Přejít na obsah</a>
  <a class="menu-back-arrow" href="/" aria-label="Zpět na titulní stránku"><svg viewBox="0 0 68 32" width="68" height="32" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M1 16h64M50 2l15 14-15 14"/></svg></a>
  <a class="menu-side-brand" href="/" aria-label="LOBBY CAFE — titulní stránka"><img src="/assets/logo.svg" alt="LOBBY CAFE" width="300" height="38"></a>
  <header class="menu-header menu-wrap"><a class="brand" href="/" aria-label="LOBBY CAFE — úvod"><img src="/assets/logo.svg" alt="LOBBY CAFE" width="254" height="32"></a><nav aria-label="Hlavní navigace"><a href="/">Zpět do kavárny <span aria-hidden="true">↗</span></a><a href="tel:+420703815252">Rezervace <span aria-hidden="true">↗</span></a></nav></header>
  <main id="obsah" class="menu-wrap">
    <div class="menu-intro"><div><p class="eyebrow">OD RÁNA DO VEČERA</p><h1>Na co máte <span>chuť?</span></h1></div><p>Dobrá káva. Pomalá snídaně.<br>A něco na večer.</p></div>
    <div class="menu-layout"><nav class="category-nav" aria-label="Kategorie menu">${menu.map((category) => `<span class="category-nav-entry"><a href="#${escape(category.id)}">${escape(category.name)}<span aria-hidden="true">↗</span></a></span>`).join('')}</nav><div class="menu-categories">${categories}</div></div>
    <aside class="menu-footnote"><p>Máte otázku k nabídce? Rádi vám poradíme.</p><a href="tel:+420703815252">+420 703 815 252 <span aria-hidden="true">↗</span></a></aside>
  </main>
  <footer class="menu-footer menu-wrap"><a href="/">← Zpět do kavárny</a><span>nám. T. G. Masaryka 2433, Zlín</span><span>LOBBY CAFE</span><div class="operator"><p>Provozovatel:</p><p>TRIAMICUS s.r.o<br>IČ: 098 85 684<br>Sídlem Osek nad Bečvou 401, 751 22</p><p>Společnost zapsaná v obchodním rejstříku vedeném Městským soudem v Praze, oddíl C, vložka 344060</p></div></footer>
</body>
</html>
`);
