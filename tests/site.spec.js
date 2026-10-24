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

test('Keyboard skip link and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Přejít na obsah' })).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
});
