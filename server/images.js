import { imageSize } from 'image-size';
import { MenuError } from '../src/menu-model.js';

export function inspectImage(bytes, maxBytes = 8 * 1024 * 1024) {
  if (bytes.length > maxBytes || bytes.length < 12) throw new MenuError('Fotografie musí mít nejvýše 8 MB; náhled nejvýše 1 MB.');
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value);
  const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (!png && !jpg && !webp) throw new MenuError('Nahrajte fotografii ve formátu JPG, WebP nebo PNG. SVG není povolené.');
  let size;
  try { size = imageSize(bytes); } catch { throw new MenuError('Fotografii se nepodařilo přečíst. Zvolte jiný soubor.'); }
  if (!size.width || !size.height || size.width * size.height > 50000000 || Math.max(size.width, size.height) > 16000) throw new MenuError('Fotografie má neplatné nebo příliš velké rozměry.');
  return { width: size.width, height: size.height, extension: png ? 'png' : jpg ? 'jpg' : 'webp', type: png ? 'image/png' : jpg ? 'image/jpeg' : 'image/webp' };
}

export async function uploadImages(env, form) {
  if (!env.MENU_IMAGES) throw new MenuError('Chybí vazba MENU_IMAGES na úložiště R2.', 503);
  const original = form.get('image');
  const thumbnail = form.get('thumbnail');
  if (!(original instanceof File) || !(thumbnail instanceof File)) throw new MenuError('Chybí fotografie nebo její náhled.');
  const source = new Uint8Array(await original.arrayBuffer());
  const preview = new Uint8Array(await thumbnail.arrayBuffer());
  const info = inspectImage(source);
  const previewInfo = inspectImage(preview, 1024 * 1024);
  if (previewInfo.width > 1000 || previewInfo.height > 1000) throw new MenuError('Náhled fotografie je příliš velký.');
  const id = crypto.randomUUID();
  const image = `${id}/original.${info.extension}`;
  const thumb = `${id}/thumbnail.${previewInfo.extension}`;
  await Promise.all([
    env.MENU_IMAGES.put(image, source, { httpMetadata: { contentType: info.type } }),
    env.MENU_IMAGES.put(thumb, preview, { httpMetadata: { contentType: previewInfo.type } }),
  ]);
  return { image: `/menu-images/${image}`, thumbnail: `/menu-images/${thumb}`, width: info.width, height: info.height, lowResolution: Math.max(info.width, info.height) < 1600 };
}

export async function serveImage(request, env, path) {
  if (!env.MENU_IMAGES || !/^[a-f0-9-]{36}\/(original|thumbnail)\.(jpg|webp|png)$/.test(path)) return new Response('Nenalezeno', { status: 404 });
  const object = await env.MENU_IMAGES.get(path);
  if (!object) return new Response('Nenalezeno', { status: 404 });
  const headers = new Headers({ 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff', ETag: object.httpEtag });
  object.writeHttpMetadata(headers);
  if (request.headers.get('If-None-Match') === object.httpEtag) return new Response(null, { status: 304, headers });
  return new Response(request.method === 'HEAD' ? null : object.body, { headers });
}
