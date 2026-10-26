import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const base = 'http://127.0.0.1:8789';
const headers = { Origin: base };
let initial;
test.beforeAll(async ({ request }) => { initial = (await (await request.get('/api/admin/menu')).json()).categories; });
test.beforeEach(async ({ request }) => {
  const current = await (await request.get('/api/admin/menu')).json();
  const response = await request.put('/api/admin/menu', { headers, data: { baseRevision: current.revision, categories: initial } });
  expect(response.ok()).toBe(true);
});

test('staff create, publish and hide a seasonal menu; public HTML needs no JavaScript', async ({ page, browser, request }) => {
  await page.goto('/admin');
  await expect(page.locator('#identity')).toContainText('Lokální zkušební režim');
  await page.getByRole('button', { name: 'Přidat sezónní nabídku', exact: true }).click();
  await page.getByLabel('Název nabídky / kategorie', { exact: true }).fill('Zimní nabídka');
  await page.getByLabel('Podnadpis', { exact: true }).fill('Něco pro zahřátí');
  await page.getByLabel('Způsob zobrazení', { exact: true }).selectOption('mixed');
  await page.getByLabel('Zobrazovat nabídku', { exact: true }).check();
  await page.getByRole('button', { name: 'Přidat položku', exact: true }).click();
  await page.getByLabel('Název položky', { exact: true }).fill('Káva & koláč');
  await page.getByLabel('Cena', { exact: true }).fill('99');
  await page.getByLabel('Množství / gramáž', { exact: true }).fill('200 g');
  await page.getByLabel('Alergeny', { exact: true }).fill('1, 3, 7');
  await page.getByLabel('Popis / složení', { exact: true }).fill('Jablko, skořice');
  await page.getByRole('button', { name: 'Uložit a zveřejnit' }).click();
  await expect(page.locator('#status')).toContainText('Uloženo');
  await expect(page.locator('#error')).toBeHidden();
  const context = await browser.newContext({ javaScriptEnabled: false });
  const publicPage = await context.newPage();
  await publicPage.goto(`${base}/menu`);
  await expect(publicPage.getByRole('heading', { name: 'Zimní nabídka', exact: true })).toBeVisible();
  await expect(publicPage.locator('.menu-item').filter({ hasText: 'Káva & koláč' })).toContainText('99 Kč');
  const data = JSON.parse(await publicPage.locator('script[type="application/ld+json"]').textContent());
  expect(JSON.stringify(data)).toContain('Zimní nabídka');
  await page.getByLabel('Zobrazovat nabídku', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Uložit a zveřejnit' }).click();
  await expect(page.locator('#status')).toContainText('Uloženo');
  await publicPage.reload();
  await expect(publicPage.getByRole('heading', { name: 'Zimní nabídka', exact: true })).toHaveCount(0);
  expect(JSON.stringify(await (await request.get('/api/menu')).json())).not.toContain('Zimní nabídka');
  await context.close();
});

test('zero seasonal offers and all presentation modes preserve text-only items', async ({ page, request }) => {
  for (const layout of ['list', 'cards', 'mixed']) {
    const current = await (await request.get('/api/admin/menu')).json();
    const categories = initial.filter((category) => !category.seasonal);
    categories.push({ id: 'style-test', order: 1000, name: 'Test zobrazení', layout, items: [{ name: 'S fotografií', image: '/assets/demo-1.webp', imageLabel: 'Ilustrace' }, { name: 'Pouze text' }] });
    expect((await request.put('/api/admin/menu', { headers, data: { categories, baseRevision: current.revision } })).ok()).toBe(true);
    await page.goto('/menu');
    await expect(page.locator('.category-nav-entry-seasonal')).toHaveCount(0);
    await expect(page.locator('#style-test .menu-item')).toHaveCount(2);
    await expect(page.locator('#style-test img')).toHaveCount(layout === 'list' ? 0 : 1);
    await expect(page.locator('#style-test .menu-item').filter({ hasText: 'Pouze text' }).locator('img')).toHaveCount(0);
  }
});

test('image upload stores original and thumbnail and updates public menu', async ({ page, request }) => {
  await page.goto('/admin');
  await expect(page.locator('#identity')).toContainText('Lokální');
  await page.getByLabel('Způsob zobrazení', { exact: true }).selectOption('mixed');
  await page.locator('.item-editor summary').first().click();
  await page.locator('.item-editor').first().locator('input[type="file"]').setInputFiles('public/assets/demo-1.webp');
  await expect(page.locator('.admin-image img')).toHaveCount(1);
  await expect(page.locator('#error')).toBeHidden();
  await page.getByRole('button', { name: 'Uložit a zveřejnit' }).click();
  await expect(page.locator('#status')).toContainText('Uloženo');
  const data = await (await request.get('/api/admin/menu')).json();
  const item = data.categories.find((category) => category.id === 'kava').items[0];
  expect(item.image).toMatch(/^\/menu-images\/[a-f0-9-]+\/original\.webp$/);
  const original = await request.get(item.image);
  const thumbnail = await request.get(item.thumbnail);
  expect(original.ok()).toBe(true);
  expect(thumbnail.ok()).toBe(true);
  expect(original.headers()['content-type']).toBe('image/webp');
  expect(original.headers()['cache-control']).toContain('immutable');
  await page.goto('/menu');
  await expect(page.locator('#kava .menu-photo-trigger').first()).toHaveAttribute('href', item.image);
  await expect(page.locator('#kava img').first()).toHaveAttribute('src', item.thumbnail);
});

test('concurrent editors, foreign origins, invalid data and unsafe files are rejected', async ({ request }) => {
  const current = await (await request.get('/api/admin/menu')).json();
  const body = { baseRevision: current.revision, categories: current.categories };
  const results = await Promise.all([request.put('/api/admin/menu', { headers, data: body }), request.put('/api/admin/menu', { headers, data: body })]);
  expect(results.map((result) => result.status()).sort()).toEqual([200, 409]);
  expect((await request.put('/api/admin/menu', { headers: { Origin: 'https://evil.example' }, data: body })).status()).toBe(403);
  expect((await request.put('/api/admin/menu', { headers, data: { ...body, categories: [{ id: 'bad', name: 'X', items: [], layout: 'unknown' }] } })).status()).toBe(400);
  const svg = { name: 'image.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg onload="alert(1)"></svg>') };
  expect((await request.post('/api/admin/images', { headers, multipart: { image: svg, thumbnail: svg } })).status()).toBe(400);
  const response = await request.get('/admin');
  expect(response.headers()['cache-control']).toBe('no-store');
  expect(response.headers()['x-robots-tag']).toContain('noindex');
});

test('admin layout is keyboard-accessible and does not overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/admin');
  await expect(page.locator('#identity')).toContainText('Lokální');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(audit.violations).toEqual([]);
});
