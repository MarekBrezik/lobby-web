import { authenticate, isLocal, requireSameOrigin } from '../server/auth.js';
import { loadMenu, saveMenu } from '../server/store.js';
import { serveImage, uploadImages } from '../server/images.js';
import { MenuError, visibleMenu } from '../src/menu-model.js';
import { renderMenuLayout } from '../src/menu-render.js';
import { structuredData } from '../scripts/seo.mjs';
import { menu } from '../src/menu-data.js';

const json = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'X-Content-Type-Options': 'nosniff' } });
const privateResponse = (response) => {
  const result = new Response(response.body, response);
  result.headers.set('Cache-Control', 'no-store');
  result.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return result;
};

export async function readLimited(request, limit) {
  if (Number(request.headers.get('Content-Length')) > limit) throw new MenuError('Požadavek je příliš velký.', 413);
  const chunks = [];
  let length = 0;
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) {
      await reader.cancel();
      throw new MenuError('Požadavek je příliš velký.', 413);
    }
    chunks.push(value);
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return result;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const adminPage = path === '/admin' || path.startsWith('/admin/');
  const adminApi = path === '/api/admin' || path.startsWith('/api/admin/');
  try {
    if (adminPage || adminApi) {
      const identity = await authenticate(request, env);
      if (adminPage) return privateResponse(await context.next());
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) requireSameOrigin(request);
      if (path === '/api/admin/menu' && request.method === 'GET') return json({ ...await loadMenu(env, identity.local), identity });
      if (path === '/api/admin/menu' && request.method === 'PUT') {
        if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new MenuError('Očekáván JSON.', 415);
        let body;
        try { body = JSON.parse(new TextDecoder().decode(await readLimited(request, 1024 * 1024))); }
        catch (error) { if (error instanceof MenuError) throw error; throw new MenuError('Neplatný JSON.'); }
        await loadMenu(env, identity.local);
        return json(await saveMenu(env, body.categories, body.baseRevision, identity));
      }
      if (path === '/api/admin/images' && request.method === 'POST') {
        const contentType = request.headers.get('Content-Type') || '';
        if (!contentType.startsWith('multipart/form-data;')) throw new MenuError('Očekáván soubor fotografie.', 415);
        const bytes = await readLimited(request, 10 * 1024 * 1024);
        const form = await new Response(bytes, { headers: { 'Content-Type': contentType } }).formData();
        return json(await uploadImages(env, form), 201);
      }
      return json({ error: 'Tento požadavek administrace není podporovaný.' }, 404);
    }
    if (path.startsWith('/menu-images/')) {
      if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405 });
      return await serveImage(request, env, path.slice('/menu-images/'.length));
    }
    if (path === '/api/menu') {
      if (request.method !== 'GET') return json({ error: 'Použijte GET.' }, 405);
      const data = env.MENU_DB ? await loadMenu(env, isLocal(request, env)) : { revision: 0, categories: menu };
      return json({ revision: data.revision, categories: visibleMenu(data.categories) });
    }
    if (['/menu', '/menu/', '/menu/index.html'].includes(path) && ['GET', 'HEAD'].includes(request.method)) {
      const assetRequest = new Request(request);
      for (const header of ['If-None-Match', 'If-Modified-Since', 'Range']) assetRequest.headers.delete(header);
      const response = await context.next(assetRequest);
      if (!response.ok) return response;
      let data;
      try { if (env.MENU_DB) data = await loadMenu(env, isLocal(request, env)); } catch { data = null; }
      let result = new Response(response.body, response);
      for (const header of ['ETag', 'Last-Modified', 'Content-Length']) result.headers.delete(header);
      result.headers.set('Cache-Control', 'no-cache');
      result.headers.set('X-Menu-Source', data ? 'd1' : 'static');
      if (url.hostname === 'lobby-web-a8t.pages.dev' || url.hostname.endsWith('.lobby-web-a8t.pages.dev')) result.headers.set('X-Robots-Tag', 'noindex');
      if (data) {
        const categories = visibleMenu(data.categories);
        const schema = JSON.stringify(structuredData(true, categories)).replace(/</g, '\\u003c');
        result = new HTMLRewriter()
          .on('.menu-layout', { element(element) { element.setInnerContent(renderMenuLayout(categories), { html: true }); } })
          .on('script[type="application/ld+json"]', { element(element) { element.setInnerContent(schema, { html: true }); } })
          .transform(result);
      }
      return result;
    }
    return await context.next();
  } catch (error) {
    const status = error instanceof MenuError ? error.status : 503;
    return json({ error: error instanceof MenuError ? error.message : 'Změnu se nepodařilo uložit. Zkuste to znovu; vaše rozpracované údaje zůstaly v prohlížeči.' }, status);
  }
}
