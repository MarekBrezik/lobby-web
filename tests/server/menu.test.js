import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT } from 'jose';
import { menu } from '../../src/menu-data.js';
import { normalizeMenu, visibleMenu } from '../../src/menu-model.js';
import { renderMenuLayout } from '../../src/menu-render.js';
import { authenticate, requireSameOrigin } from '../../server/auth.js';
import { inspectImage } from '../../server/images.js';
import { readLimited } from '../../functions/_middleware.js';

const category = () => ({ id: 'test', name: 'Test', order: 10, items: [{ name: 'Espresso', price: '85' }] });

test('normalization preserves original menu and explicit presentation', () => {
  const normalized = normalizeMenu(menu);
  assert.equal(normalized.length, menu.length);
  assert.equal(normalized.find((entry) => entry.id === 'kava').layout, 'list');
  assert.equal(normalized.find((entry) => entry.id === 'podzim').layout, 'mixed');
  assert.equal(normalizeMenu([category()])[0].items[0].price, '85 Kč');
  assert.equal(normalizeMenu([{ ...category(), items: [{ name: 'Nápoj', price: '75 / 95 Kč' }] }])[0].items[0].price, '75 / 95 Kč');
});

test('hidden and empty categories never appear in public HTML', () => {
  const data = normalizeMenu([{ ...category(), visible: false }, { ...category(), id: 'empty', items: [] }]);
  assert.deepEqual(visibleMenu(data), []);
  assert.match(renderMenuLayout(data), /Nabídku právě připravujeme/);
  const hiddenItem = normalizeMenu([{ ...category(), items: [{ name: 'Skrytý', visible: false }] }]);
  assert.deepEqual(visibleMenu(hiddenItem), []);
});

test('all three layouts render intentionally and escape edited content', () => {
  for (const layout of ['list', 'cards', 'mixed']) {
    const data = normalizeMenu([{ ...category(), name: '<script>test</script>', layout, items: [{ name: 'Káva & dort', image: '/assets/demo-1.webp' }, { name: 'Bez fotografie' }] }]);
    const html = renderMenuLayout(data);
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(!html.includes('<script>'));
    assert.equal((html.match(/<img /g) || []).length, layout === 'list' ? 0 : 1);
    assert.ok(html.includes('Káva &amp; dort'));
  }
});

test('rejects duplicate IDs, unsafe image URLs, invalid layouts and oversized inputs', () => {
  for (const data of [[category(), category()], [{ ...category(), layout: 'unknown' }], [{ ...category(), groups: [null], items: undefined }], [{ ...category(), items: [{ name: 'X', image: 'javascript:alert(1)' }] }], [{ ...category(), name: 'x'.repeat(161) }]]) assert.throws(() => normalizeMenu(data));
  assert.throws(() => normalizeMenu(Array.from({ length: 51 }, category)));
});

test('local bypass never works on a public hostname and production fails closed', async () => {
  assert.equal((await authenticate(new Request('http://127.0.0.1/admin'), { LOCAL_ADMIN: 'true' })).local, true);
  await assert.rejects(authenticate(new Request('https://lobbycafe.cz/admin'), { LOCAL_ADMIN: 'true' }), { status: 503 });
  await assert.rejects(authenticate(new Request('http://127.0.0.1/admin'), {}), { status: 503 });
  assert.throws(() => requireSameOrigin(new Request('https://lobbycafe.cz/api/admin/menu', { method: 'PUT', headers: { Origin: 'https://evil.example' } })), { status: 403 });
  assert.doesNotThrow(() => requireSameOrigin(new Request('https://lobbycafe.cz/api/admin/menu', { method: 'PUT', headers: { Origin: 'https://lobbycafe.cz' } })));
});

test('Access validates signature, audience, issuer and expiry rather than trusting email headers', async () => {
  const { privateKey, publicKey } = await generateKeyPair('RS256', { extractable: true });
  const jwk = { ...await exportJWK(publicKey), kid: 'test-key', alg: 'RS256' };
  const resolver = createLocalJWKSet({ keys: [jwk] });
  const env = { CF_ACCESS_TEAM_DOMAIN: 'test.cloudflareaccess.com', CF_ACCESS_AUD: 'menu-admin' };
  const token = (audience = 'menu-admin', expiry = '5m', issuer = 'https://test.cloudflareaccess.com') => new SignJWT({ email: 'staff@example.test' }).setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).setIssuer(issuer).setAudience(audience).setExpirationTime(expiry).sign(privateKey);
  const request = (jwt) => new Request('https://lobbycafe.cz/admin', { headers: { 'Cf-Access-Jwt-Assertion': jwt, 'Cf-Access-Authenticated-User-Email': 'forged@example.test' } });
  assert.equal((await authenticate(request(await token()), env, resolver)).email, 'staff@example.test');
  for (const jwt of [await token('wrong'), await token('menu-admin', Math.floor(Date.now() / 1000) - 60), await token('menu-admin', '5m', 'https://evil.example'), 'not-a-jwt']) {
    await assert.rejects(authenticate(request(jwt), env, resolver));
  }
});

test('image validation accepts PNG and rejects SVG, huge files and excessive dimensions', () => {
  const image = new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6Jx8AAAAASUVORK5CYII=', 'base64'));
  assert.equal(inspectImage(image).width, 1);
  assert.throws(() => inspectImage(new TextEncoder().encode('<svg onload="alert(1)"></svg>')));
  assert.throws(() => inspectImage(image, 1));
  const mutated = image.slice();
  new DataView(mutated.buffer).setUint32(16, 30000);
  assert.throws(() => inspectImage(mutated));
});

test('body size limits also apply when content length is absent', async () => {
  await assert.rejects(readLimited(new Request('https://lobbycafe.cz', { method: 'POST', body: '12345' }), 4), { status: 413 });
  assert.equal((await readLimited(new Request('https://lobbycafe.cz', { method: 'POST', body: '123' }), 4)).length, 3);
});
