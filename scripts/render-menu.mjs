import { writeFile } from 'node:fs/promises';
import { menu } from '../src/menu-data.js';
import { renderMenuLayout } from '../src/menu-render.js';
export { renderItem } from '../src/menu-render.js';

await writeFile(new URL('../menu/index.html', import.meta.url), `<!doctype html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#F8F5F0">
  <title>Menu — LOBBY CAFE Zlín</title>
  <meta name="description" content="Nabídka LOBBY CAFE: výběrová káva, snídaně, brunch, domácí limonády a drinky. Přehledné menu včetně cen.">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="cs_CZ">
  <meta property="og:title" content="Menu — LOBBY CAFE Zlín">
  <meta property="og:description" content="Od ranního espressa přes vydatný brunch až po drink v dobré společnosti.">
  <meta property="og:image" content="https://lobbycafe.cz/assets/share.png">
  <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">
  <link rel="icon" href="/assets/favicon.png" type="image/png" sizes="150x150">
  <link rel="preload" href="/assets/tenor-sans.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/figtree.woff2" as="font" type="font/woff2" crossorigin>
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
    <div class="menu-layout">${renderMenuLayout(menu)}</div>
    <aside class="menu-footnote"><p>Máte otázku k nabídce? Rádi vám poradíme.</p><a href="tel:+420703815252">+420 703 815 252 <span aria-hidden="true">↗</span></a></aside>
  </main>
  <footer class="menu-footer menu-wrap"><a href="/">← Zpět do kavárny</a><span>nám. T. G. Masaryka 2433, Zlín</span><span>LOBBY CAFE</span><div class="operator"><p>Provozovatel:</p><p>TRIAMICUS s.r.o<br>IČ: 098 85 684<br>Sídlem Osek nad Bečvou 401, 751 22</p><p>Společnost zapsaná v obchodním rejstříku vedeném Městským soudem v Praze, oddíl C, vložka 344060</p></div></footer>
</body>
</html>
`);
