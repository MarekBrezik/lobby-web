import { test, expect, webkit } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { menu } from '../src/menu-data.js';
import { renderItem } from '../scripts/render-menu.mjs';

for (const route of ['/', '/menu']) {
  for (const width of [320, 390, 768, 1440]) {
    test(`${route} layout, assets and accessibility at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('response', (response) => {
        if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
      });
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.evaluate(() => document.fonts.check('16px "Tenor Sans"') && document.fonts.check('16px Figtree'))).toBe(true);
      if (route === '/' && width <= 760) {
        await expect(page.locator('.home-coffee')).toBeHidden();
        await expect(page.locator('.home-address')).toHaveCSS('transform', 'matrix(0, 1, -1, 0, 0, 0)');
      }
      for (const image of await page.locator('img').all()) {
        if (!await image.isVisible()) continue;
        await image.scrollIntoViewIfNeeded();
        await expect(image).toHaveJSProperty('complete', true);
        expect(await image.evaluate((element) => element.naturalWidth)).toBeGreaterThan(0);
      }
      for (const link of await page.locator('a[href^="#"]').all()) {
        const id = await link.getAttribute('href');
        if (id !== '#') expect(await page.locator(id).count()).toBe(1);
      }
      const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(audit.violations).toEqual([]);
      expect(errors).toEqual([]);
      await page.evaluate(() => {
        document.activeElement.blur();
        document.documentElement.style.scrollBehavior = 'auto';
        scrollTo(0, 0);
      });
      await page.screenshot({ path: `test-results/${route === '/' ? 'home' : 'menu'}-${width}.png`, fullPage: true });
    });
  }
}

test('Menu navigation and PDF content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('link', { name: 'Prohlédnout menu' }).click();
  await expect(page).toHaveURL(/\/menu\/?$/);
  await expect(page.locator('.menu-category')).toHaveCount(menu.length);
  const itemCount = menu.reduce((count, category) => count + (category.items?.length ?? category.groups.reduce((total, group) => total + group.items.length, 0)), 0);
  await expect(page.locator('.menu-item')).toHaveCount(itemCount);
  await expect(page.locator('.menu-item').filter({ hasText: 'Espresso Macchiato' })).toContainText('70 Kč');
  await expect(page.locator('.menu-item').filter({ hasText: 'Grüner Veltliner' })).toHaveCount(1);
  await page.getByRole('navigation', { name: 'Kategorie menu' }).getByRole('link', { name: 'Drinky & pivo' }).click();
  await expect(page).toHaveURL(/#drinky$/);
  await expect(page.locator('#drinky')).toBeInViewport();
  await expect(page.getByRole('link', { name: 'Rezervace' })).toHaveAttribute('href', 'tel:+420703815252');
});

test('Menu supports optional photos and safely escapes content', () => {
  expect(renderItem({ name: 'Test', price: '60 Kč' })).not.toContain('<img');
  expect(renderItem({ name: 'Test', price: '60 Kč', image: '/assets/coffee.webp' })).toContain('has-image');
  expect(renderItem({ name: '<script>alert(1)</script>', price: '60 Kč', image: 'javascript:alert(1)' })).not.toContain('<script>');
  expect(renderItem({ name: 'Test', price: '60 Kč', image: 'javascript:alert(1)' })).not.toContain('<img');
});

test('Menu is available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/menu');
  await expect(page.getByRole('heading', { name: 'Káva', exact: true })).toBeVisible();
  await expect(page.locator('#kava .menu-item').first()).toContainText('60 Kč');
  await context.close();
});

test('Home contact labels, black panel and contained opening hours', async ({ page }) => {
  for (const width of [320, 390, 768, 900, 1100, 1101, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.contact-label').first()).toHaveText('Adresa:');
    await expect(page.locator('.contact-label').last()).toHaveText('Rezervace:');
    await expect(page.locator('.contact-label').first()).toHaveCSS('font-weight', '300');
    expect(await page.evaluate(() => document.fonts.check('300 12px Figtree'))).toBe(true);
    await expect(page.locator('.social-icon')).toHaveCount(2);
    await expect(page.locator('.social-preview a')).toHaveCount(2);
    await expect(page.getByRole('link', { name: 'Facebook LOBBY CAFE' })).toHaveAttribute('href', 'https://www.facebook.com/lobbycafezlin');
    await expect(page.getByRole('link', { name: 'Instagram LOBBY CAFE' })).toHaveAttribute('href', 'https://www.instagram.com/lobbycafe_zlin/');
    const menuLink = page.locator('.home-menu-link');
    await menuLink.hover();
    await expect(menuLink).toHaveCSS('text-decoration-line', 'none');
    expect(await menuLink.evaluate((element) => {
      const text = element.querySelector('span').getBoundingClientRect();
      const arrow = element.querySelector('svg').getBoundingClientRect();
      return Math.abs(text.top + text.height / 2 - arrow.top - arrow.height / 2) < 1;
    })).toBe(true);
    expect(await page.evaluate(() => {
      const panel = document.querySelector('.home-footer-panel').getBoundingClientRect();
      return [...document.querySelectorAll('.home-hours > span')].every((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left >= panel.left && rect.right <= panel.right;
      });
    })).toBe(true);
    if (width > 760) {
      expect(await page.locator('.home-shell').evaluate((element) => getComputedStyle(element, '::before').backgroundColor)).toBe('rgb(0, 0, 0)');
      expect(await page.locator('.home-footer-panel').evaluate((element) => element.getBoundingClientRect().left >= innerWidth * .67 - 1)).toBe(true);
    }
  }
});

test('Home fits viewport and footer content is centered in the black strip', async ({ page }) => {
  for (const [width, height] of [[1440, 900], [1440, 700], [1366, 768], [1280, 650], [768, 700], [390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    expect(await page.evaluate(() => {
      const copy = document.querySelector('.home-copy').getBoundingClientRect();
      const footer = document.querySelector('.home-footer').getBoundingClientRect();
      return copy.bottom <= footer.top && copy.top >= document.querySelector('.home-header').getBoundingClientRect().bottom && footer.bottom <= innerHeight;
    })).toBe(true);
    if (width > 760) {
      expect(await page.evaluate(() => {
        const center = innerWidth * .835;
        return ['.social-icon', '.home-hours > span'].every((selector) => {
          const rects = [...document.querySelectorAll(selector)].map((element) => element.getBoundingClientRect());
          return Math.abs((Math.min(...rects.map((r) => r.left)) + Math.max(...rects.map((r) => r.right))) / 2 - center) < 1;
        });
      })).toBe(true);
    }
    await page.screenshot({ path: `test-results/viewport-${width}-${height}.png` });
  }
});

test('Landscape menu rails stay fixed and demo photos reveal color', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/menu');
  const arrow = page.locator('.menu-back-arrow');
  const logo = page.locator('.menu-side-brand');
  await expect(arrow).toBeVisible();
  await expect(logo).toBeVisible();
  const categoryLink = page.locator('.category-nav a').first();
  await categoryLink.hover();
  expect(await categoryLink.evaluate((element) => getComputedStyle(element, '::after').content)).toBe('none');
  expect(await page.locator('.category-nav-entry').first().evaluate((element) => getComputedStyle(element, '::after').content)).toBe('"|"');
  expect(await page.locator('.category-nav-entry').first().evaluate((element) => getComputedStyle(element).textDecorationLine)).toBe('none');
  await expect(page.locator('#demo')).toHaveClass(/menu-category-cards/);
  await expect(page.locator('#podzim')).toHaveClass(/menu-category-mixed/);
  await expect(page.locator('#podzim .menu-category-subtitle')).toContainText('říjen 2026');
  const before = await logo.boundingBox();
  const photo = page.locator('.menu-item-image').first();
  await expect(photo).toHaveCSS('filter', 'grayscale(1)');
  await photo.hover();
  await expect(photo).toHaveCSS('filter', 'grayscale(0)');
  await page.evaluate(() => scrollTo(0, 800));
  expect(await logo.boundingBox()).toEqual(before);
  await arrow.click();
  await expect(page).toHaveURL(/\/$/);
});

test('Clicked right-column category stays active after scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/menu');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const target = page.locator('.category-nav a[href="#obedy"]');
  await target.click();
  await expect(page.locator('#obedy')).toBeInViewport();
  await expect(target).toHaveAttribute('aria-current', 'location');
  await expect(page.locator('.category-nav a[aria-current]')).toHaveCount(1);
  await expect(page.locator('.category-nav a[href="#snidane"]')).not.toHaveAttribute('aria-current');
  await page.reload();
  await expect(target).toHaveAttribute('aria-current', 'location');
});

test('Touch menu photos are colored without interaction', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/menu');
  await expect(page.locator('.menu-item-image').first()).toHaveCSS('filter', 'none');
  await expect(page.locator('.menu-back-arrow')).toBeHidden();
  await context.close();
});

test('Autumn section mixes real text items and illustrative photos', async ({ page }) => {
  await page.goto('/menu');
  const autumn = page.locator('#podzim');
  await expect(autumn.locator('.menu-item')).toHaveCount(21);
  await expect(autumn.locator('.menu-item-image')).toHaveCount(2);
  await expect(autumn.locator('.menu-item').filter({ hasText: 'Mushroom bread' })).toContainText('159 Kč');
  await expect(autumn.locator('.menu-item').filter({ hasText: 'Mushroom bread' }).locator('img')).toHaveCount(0);
  await expect(autumn.locator('.menu-item').filter({ hasText: 'Slanina' })).toContainText('20 Kč');
  await expect(autumn.locator('.menu-item').filter({ hasText: 'Mini párečky' }).locator('.menu-item-price')).toHaveCount(0);
  await expect(autumn.locator('.menu-item-allergens')).toHaveCount(5);
  await expect(autumn.locator('.menu-image-label')).toHaveCount(2);
});

test('Mobile WebKit keeps home in view and supports the mixed menu', async () => {
  const browser = await webkit.launch();
  const context = await browser.newContext({ isMobile: true, hasTouch: true });
  const page = await context.newPage();
  for (const [width, height] of [[320, 568], [390, 844], [430, 932]]) {
    await page.setViewportSize({ width, height });
    await page.goto('http://127.0.0.1:4173/');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    const link = page.locator('.home-menu-link');
    await expect(link).toBeInViewport();
    expect(await link.evaluate((element) => element.getBoundingClientRect().bottom <= innerHeight)).toBe(true);
    await link.click();
    await expect(page.locator('#podzim .menu-item')).toHaveCount(21);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('.menu-item-image').first()).toHaveCSS('filter', 'none');
  }
  await browser.close();
});

test('Photo dialog shows color, title and price and restores keyboard focus', async ({ page }) => {
  await page.goto('/menu');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const trigger = page.getByRole('link', { name: 'Zvětšit fotografii: Bacon & eggs', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Bacon & eggs' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.photo-price')).toHaveText('159 Kč');
  await expect(dialog.locator('.photo-notice')).toHaveText('Ilustrační fotografie');
  await expect(dialog.locator('img')).toHaveCSS('filter', 'none');
  await expect(dialog.locator('img')).toHaveCSS('object-fit', 'contain');
  await expect(page.getByRole('button', { name: 'Zavřít fotografii' })).toBeFocused();
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(audit.violations).toEqual([]);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Zavřít fotografii' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.locator('html')).not.toHaveClass(/photo-open/);
  await page.getByRole('link', { name: 'Zvětšit fotografii: Slané ráno', exact: true }).click();
  await expect(page.locator('.photo-price')).toBeHidden();
  await expect(page.locator('.photo-notice')).toHaveText('Ilustrační fotografie');
  await page.getByRole('button', { name: 'Zavřít fotografii' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Mobile WebKit photo dialog fills the viewport and closes on tap', async () => {
  const browser = await webkit.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/menu');
  const trigger = page.getByRole('link', { name: 'Zvětšit fotografii: Bacon & eggs', exact: true });
  await trigger.tap();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds.x).toBe(0);
  expect(bounds.y).toBe(0);
  expect(Math.abs(bounds.width - 390)).toBeLessThan(1);
  expect(Math.abs(bounds.height - 844)).toBeLessThan(1);
  await expect(dialog.locator('img')).toHaveCSS('filter', 'none');
  await expect(dialog.locator('.photo-price')).toHaveText('159 Kč');
  await expect(page.getByRole('button', { name: 'Zavřít fotografii' })).toBeInViewport();
  await page.getByRole('button', { name: 'Zavřít fotografii' }).tap();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await browser.close();
});

test('Deployment includes supplied favicon and menu operator details', async ({ page, request }) => {
  for (const route of ['/', '/menu']) {
    await page.goto(route);
    await expect(page.locator('link[rel="icon"][type="image/png"]')).toHaveAttribute('href', '/assets/favicon.png');
  }
  const icon = await request.get('/assets/favicon.png');
  expect(icon.ok()).toBe(true);
  expect(icon.headers()['content-type']).toContain('image/png');
  expect((await request.get('/favicon.ico')).ok()).toBe(true);
  await expect(page.locator('.operator')).toContainText('Provozovatel:');
  await expect(page.locator('.operator')).toContainText('TRIAMICUS s.r.o');
  await expect(page.locator('.operator')).toContainText('IČ: 098 85 684');
  await expect(page.locator('.operator')).toContainText('Sídlem Osek nad Bečvou 401, 751 22');
  await expect(page.locator('.operator')).toContainText('Městským soudem v Praze, oddíl C, vložka 344060');
});

test('Canonical metadata and structured menu are in HTML without JavaScript', async ({ browser, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const route of ['/', '/menu']) {
    await page.goto(`http://127.0.0.1:4173${route}`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://lobbycafe.cz${route}`);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://lobbycafe.cz${route}`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://lobbycafe.cz/assets/share.png');
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    const data = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
    const cafe = data['@graph'].find((entity) => entity['@type'] === 'CafeOrCoffeeShop');
    expect(cafe.address.addressLocality).toBe('Zlín');
    expect(cafe.telephone).toBe('+420703815252');
    expect(cafe.openingHoursSpecification).toHaveLength(4);
    if (route === '/menu') {
      const structuredMenu = data['@graph'].find((entity) => entity['@type'] === 'Menu');
      expect(structuredMenu.hasMenuSection).toHaveLength(menu.filter((category) => !category.demo).length);
      expect(JSON.stringify(structuredMenu)).not.toContain('Slané ráno');
      expect(JSON.stringify(structuredMenu)).not.toContain('demo-1.webp');
      expect(JSON.stringify(structuredMenu)).toContain('Podzimní nabídka');
      const coffee = structuredMenu.hasMenuSection.find((category) => category.name === 'Káva');
      expect(coffee.hasMenuItem.find((item) => item.name === 'Espresso').offers).toEqual({ '@type': 'Offer', price: '60', priceCurrency: 'CZK' });
      expect(coffee.hasMenuItem.find((item) => item.name === 'Batch brew')).not.toHaveProperty('offers');
      await expect(page.locator('#demo')).toHaveAttribute('data-nosnippet', '');
    }
  }
  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain('Sitemap: https://lobbycafe.cz/sitemap.xml');
  const sitemap = await request.get('/sitemap.xml');
  expect(await sitemap.text()).toContain('<loc>https://lobbycafe.cz/menu</loc>');
  expect(await (await request.get('/llms.txt')).text()).toContain('LOBBY CAFE');
  expect((await request.get('/stranka-ktera-neexistuje')).status()).toBe(404);
  await page.goto('http://127.0.0.1:4173/404.html');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await context.close();
});

test('Mobile loads WOFF2 fonts but not the hidden coffee photo', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('http://127.0.0.1:4173/');
  await page.evaluate(() => document.fonts.ready);
  expect(requests.some((url) => url.endsWith('coffee.webp'))).toBe(false);
  expect(requests.some((url) => url.endsWith('.ttf'))).toBe(false);
  expect(requests.some((url) => url.endsWith('tenor-sans.woff2'))).toBe(true);
  expect(requests.some((url) => url.endsWith('figtree.woff2'))).toBe(true);
  await context.close();
});

test('Native page transitions respect reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    window.addEventListener('pageswap', (event) => sessionStorage.setItem('page-transition', String(Boolean(event.viewTransition))));
  });
  for (const reducedMotion of ['no-preference', 'reduce']) {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.home-menu-link').click();
    await expect(page).toHaveURL(/\/menu\/?$/);
    expect(await page.evaluate(() => sessionStorage.getItem('page-transition'))).toBe(reducedMotion === 'reduce' ? 'false' : 'true');
  }
});

test('Coffee image never intercepts address and reservation links', async ({ page }) => {
  for (const [width, height] of [[1440, 700], [1366, 768], [1280, 650], [1920, 800], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.home-coffee')).toHaveCSS('pointer-events', 'none');
    expect(await page.locator('.home-address a').evaluateAll((links) => links.every((link) => {
      const bounds = link.getBoundingClientRect();
      return [.1, .5, .9].every((fraction) => document.elementFromPoint(bounds.left + bounds.width * fraction, bounds.top + bounds.height / 2)?.closest('a') === link);
    }))).toBe(true);
  }
});

test('Menu navigation and sections follow the approved category order', async ({ page }) => {
  await page.goto('/menu');
  const names = ['Káva', 'Matcha & čaje', 'Limonády & fresh', 'Nealkoholické nápoje', 'Drinky & pivo', 'Vinný lístek', 'Snídaně & brunch', 'Obědy & snacky', 'Demo nabídka', 'Něco navíc', 'Autumn edition'];
  expect(await page.locator('.menu-category h2').allTextContents()).toEqual(names);
  expect(await page.locator('.category-nav a').evaluateAll((links) => links.map((link) => link.firstChild.textContent.trim()))).toEqual(names);
  await expect(page.locator('#podzim .menu-category-note').first()).toContainText('Skutečná podzimní nabídka');
  await expect(page.locator('body')).not.toContainText('Demo 02');
  await expect(page.locator('body')).toHaveCSS('text-transform', 'uppercase');
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const seasonal = await page.locator('.category-nav-entry-seasonal').boundingBox();
    const primaryBottom = await page.locator('.category-nav-primary .category-nav-entry').evaluateAll((entries) => Math.max(...entries.map((entry) => entry.getBoundingClientRect().bottom)));
    expect(seasonal.y).toBeGreaterThanOrEqual(primaryBottom);
  }
});

test('Loyalty dialog explains the card, traps focus and closes accessibly', async ({ page }) => {
  await page.goto('/');
  const trigger = page.locator('.loyalty-link');
  await expect(trigger.locator('img')).toHaveAttribute('src', '/assets/loyalty-mark.png');
  await page.evaluate(() => document.fonts.ready);
  const badgeBounds = await trigger.boundingBox();
  const menuBounds = await page.locator('.home-menu-link').boundingBox();
  expect(Math.abs(badgeBounds.y + badgeBounds.height / 2 - menuBounds.y - menuBounds.height / 2)).toBeLessThan(1);
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Věrnosti si ceníme.' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('desátá káva je na náš účet');
  await expect(dialog.locator('li')).toHaveCount(3);
  await expect(dialog.locator('.loyalty-card-link')).toHaveAttribute('href', 'https://lobbycafe-fkp.kilomayo.app/invite/zakaznik');
  await expect(dialog.locator('img')).toHaveJSProperty('complete', true);
  const close = page.getByRole('button', { name: 'Zavřít věrnostní program' });
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.locator('.loyalty-card-link')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(audit.violations).toEqual([]);
  await page.screenshot({ path: 'test-results/loyalty-desktop.png' });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.locator('html')).not.toHaveClass(/loyalty-open/);
});

test('Loyalty fits the mobile home and opens in mobile WebKit', async () => {
  const browser = await webkit.launch();
  const context = await browser.newContext({ isMobile: true, hasTouch: true });
  const page = await context.newPage();
  for (const [width, height] of [[320, 568], [390, 844], [430, 932]]) {
    await page.setViewportSize({ width, height });
    await page.goto('http://127.0.0.1:4173/');
    await page.evaluate(() => document.fonts.ready);
    const trigger = page.locator('.loyalty-link');
    await expect(trigger).toBeInViewport();
    const bounds = await trigger.boundingBox();
    const footer = await page.locator('.home-footer').boundingBox();
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(footer.y);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    await trigger.tap();
    const dialog = page.getByRole('dialog', { name: 'Věrnosti si ceníme.' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.loyalty-card-link')).toBeInViewport();
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    if (width === 390) await page.screenshot({ path: 'test-results/loyalty-mobile.png' });
    await page.getByRole('button', { name: 'Zavřít věrnostní program' }).tap();
    await expect(trigger).toBeFocused();
  }
  await browser.close();
});

test('Loyalty card remains a direct link without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.locator('.loyalty-link')).toHaveAttribute('href', 'https://lobbycafe-fkp.kilomayo.app/invite/zakaznik');
  await expect(page.locator('#loyalty')).not.toBeVisible();
  await context.close();
});

test('Keyboard skip link and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Přejít na obsah' })).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
});
