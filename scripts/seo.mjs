import { menu } from '../src/menu-data.js';

export const origin = 'https://lobbycafe.cz';
const menuUrl = `${origin}/menu`;
const imageUrl = `${origin}/assets/share.png`;
const cafeId = `${origin}/#cafe`;
const menuId = `${menuUrl}#nabidka`;
const operatorId = `${origin}/#provozovatel`;

function menuItem(item) {
  const price = item.price?.match(/^(\d+)\s*Kč$/);
  return {
    '@type': 'MenuItem',
    name: item.name,
    ...((item.description || item.amount || item.allergens) && {
      description: [item.description, item.amount, item.allergens && `Alergeny: ${item.allergens}`].filter(Boolean).join('. '),
    }),
    ...(item.image && !item.imageLabel && { image: new URL(item.image, origin).href }),
    ...(price && { offers: { '@type': 'Offer', price: price[1], priceCurrency: 'CZK' } }),
  };
}

export function structuredData(isMenu, menuData = menu) {
  const cafe = {
    '@type': 'CafeOrCoffeeShop', '@id': cafeId, name: 'LOBBY CAFE',
    url: `${origin}/`, telephone: '+420703815252',
    description: 'Výběrová káva, snídaně, brunch a drinky v centru Zlína. Prostor pro pracovní schůzky i odpočinek.',
    logo: `${origin}/assets/logo.svg`, image: imageUrl,
    address: { '@type': 'PostalAddress', streetAddress: 'nám. T. G. Masaryka 2433', addressLocality: 'Zlín', postalCode: '760 01', addressCountry: 'CZ' },
    openingHoursSpecification: [
      { dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], opens: '07:30', closes: '18:00' },
      { dayOfWeek: ['Friday'], opens: '07:30', closes: '21:00' },
      { dayOfWeek: ['Saturday'], opens: '08:00', closes: '20:00' },
      { dayOfWeek: ['Sunday'], opens: '08:00', closes: '18:00' },
    ].map((hours) => ({ '@type': 'OpeningHoursSpecification', ...hours, dayOfWeek: hours.dayOfWeek.map((day) => `https://schema.org/${day}`) })),
    acceptsReservations: true,
    sameAs: ['https://www.instagram.com/lobbycafe_zlin/', 'https://www.facebook.com/lobbycafezlin'],
    hasMenu: isMenu ? { '@id': menuId } : menuUrl,
    parentOrganization: { '@id': operatorId },
  };
  const graph = [
    cafe,
    {
      '@type': 'Organization', '@id': operatorId, name: 'TRIAMICUS s.r.o', legalName: 'TRIAMICUS s.r.o',
      identifier: { '@type': 'PropertyValue', propertyID: 'IČO', value: '09885684' },
      address: { '@type': 'PostalAddress', streetAddress: 'Osek nad Bečvou 401', addressLocality: 'Osek nad Bečvou', postalCode: '751 22', addressCountry: 'CZ' },
    },
    { '@type': 'WebSite', '@id': `${origin}/#website`, url: `${origin}/`, name: 'LOBBY CAFE', inLanguage: 'cs-CZ', publisher: { '@id': operatorId } },
    {
      '@type': 'WebPage', '@id': `${isMenu ? menuUrl : `${origin}/`}#webpage`,
      url: isMenu ? menuUrl : `${origin}/`, name: isMenu ? 'Menu — LOBBY CAFE Zlín' : 'LOBBY CAFE — Kavárna a bar ve Zlíně',
      inLanguage: 'cs-CZ', isPartOf: { '@id': `${origin}/#website` }, about: { '@id': cafeId },
      mainEntity: { '@id': isMenu ? menuId : cafeId },
    },
  ];
  if (isMenu) graph.push({
    '@type': 'Menu', '@id': menuId, name: 'Menu LOBBY CAFE', url: menuUrl, inLanguage: 'cs-CZ',
    hasMenuSection: menuData.filter((category) => !category.demo).map((category) => ({
      '@type': 'MenuSection', name: category.schemaName || category.name,
      url: `${menuUrl}#${category.id}`,
      ...(category.groups ? {
        hasMenuSection: category.groups.map((group) => ({ '@type': 'MenuSection', name: group.name, hasMenuItem: group.items.map(menuItem) })),
      } : { hasMenuItem: category.items.map(menuItem) }),
    })),
  });
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function seoPlugin() {
  return {
    name: 'lobby-seo',
    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        if (context.path.startsWith('/admin')) return;
        const isMenu = context.path.startsWith('/menu');
        const url = isMenu ? menuUrl : `${origin}/`;
        const title = html.match(/<title>(.*?)<\/title>/)?.[1] || 'LOBBY CAFE';
        const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] || '';
        return {
          html,
          tags: [
            { tag: 'style', children: 'html{background:#F8F5F0;color:#5C3A21;color-scheme:light}', injectTo: 'head-prepend' },
            { tag: 'link', attrs: { rel: 'canonical', href: url } },
            { tag: 'meta', attrs: { name: 'robots', content: 'index, follow, max-image-preview:large' } },
            { tag: 'meta', attrs: { property: 'og:url', content: url } },
            { tag: 'meta', attrs: { property: 'og:site_name', content: 'LOBBY CAFE' } },
            { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
            { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
            { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
            { tag: 'meta', attrs: { name: 'twitter:title', content: title } },
            { tag: 'meta', attrs: { name: 'twitter:description', content: description } },
            { tag: 'meta', attrs: { name: 'twitter:image', content: imageUrl } },
            { tag: 'meta', attrs: { name: 'twitter:image:alt', content: 'LOBBY CAFE — káva, brunch a drinky ve Zlíně' } },
            { tag: 'script', attrs: { type: 'application/ld+json' }, children: JSON.stringify(structuredData(isMenu)).replace(/</g, '\\u003c') },
          ],
        };
      },
    },
    generateBundle() {
      const assets = {
        '_routes.json': JSON.stringify({ version: 1, include: ['/menu', '/menu/', '/menu/index.html', '/admin', '/admin/*', '/api/*', '/menu-images/*'], exclude: [] }),
        'robots.txt': `User-agent: *\nDisallow: /admin\nDisallow: /api/admin\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
        'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url><url><loc>${menuUrl}</loc></url></urlset>\n`,
        '_headers': 'https://lobby-web-a8t.pages.dev/*\n  X-Robots-Tag: noindex\n\nhttps://:deployment.lobby-web-a8t.pages.dev/*\n  X-Robots-Tag: noindex\n',
        'llms.txt': `# LOBBY CAFE\n\n> Kavárna a bar v centru Zlína. Výběrová káva, snídaně, brunch a drinky.\n\n## Oficiální stránky\n- [Úvod a kontakty](${origin}/)\n- [Menu s cenami](${menuUrl})\n\n## Návštěva\nAdresa: nám. T. G. Masaryka 2433, 760 01 Zlín, Česká republika.\nRezervace: +420 703 815 252.\nPondělí–čtvrtek 7:30–18:00; pátek 7:30–21:00; sobota 8:00–20:00; neděle 8:00–18:00.\nProvozovatel: TRIAMICUS s.r.o, IČO 09885684.\n\n## Interpretace nabídky\nMenu je dostupné v HTML bez JavaScriptu a doplněné strukturovanými daty Menu/MenuItem. Kategorie označená Demo nabídka obsahuje ilustrační, nikoliv skutečné produkty a je ze strukturovaného menu vynechána. U podzimní nabídky pochází texty a ceny z podkladů 10/2026; fotografie označené jako ilustrační nezobrazují ověřené produkty. Chybějící cenu ani aktuální dostupnost položek neodvozujte.\n`,
        '404.html': '<!doctype html><html lang="cs"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Stránka nenalezena — LOBBY CAFE</title><style>@font-face{font-family:Figtree;src:url(/assets/figtree.woff2) format("woff2");font-display:swap}body{margin:0;padding:15vh 8vw;background:#F8F5F0;color:#5C3A21;font:18px/1.6 Figtree,sans-serif}a{color:inherit}</style></head><body><main><h1>Tahle stránka tu není.</h1><p>Na kávu jste ale na správné adrese.</p><a href="/">Zpět do LOBBY CAFE</a></main></body></html>',
      };
      for (const [fileName, source] of Object.entries(assets)) this.emitFile({ type: 'asset', fileName, source });
    },
  };
}
