import { createRemoteJWKSet, jwtVerify } from 'jose';
import { MenuError } from '../src/menu-model.js';

const keys = new Map();
export const isLocal = (request, env) => env.LOCAL_ADMIN === 'true' && ['localhost', '127.0.0.1', '[::1]'].includes(new URL(request.url).hostname);

export async function authenticate(request, env, resolver) {
  if (isLocal(request, env)) return { email: 'local@localhost', local: true };
  const team = env.CF_ACCESS_TEAM_DOMAIN || '';
  const audience = (env.CF_ACCESS_AUD || '').split(',').map((value) => value.trim()).filter(Boolean);
  if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(team) || !audience.length) throw new MenuError('Administrace není nakonfigurovaná. Nastavte Cloudflare Access pro /admin i /api/admin.', 503);
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token || token.length > 16000) throw new MenuError('Pro správu menu se přihlaste přes Cloudflare Access.', 401);
  if (!resolver && !keys.has(team)) keys.set(team, createRemoteJWKSet(new URL(`https://${team}/cdn-cgi/access/certs`)));
  try {
    const { payload } = await jwtVerify(token, resolver || keys.get(team), { issuer: `https://${team}`, audience, algorithms: ['RS256'], clockTolerance: 5 });
    if (typeof payload.email !== 'string' || payload.email.length > 320) throw new Error('identity');
    return { email: payload.email, local: false };
  } catch {
    throw new MenuError('Přihlášení není platné. Obnovte přihlášení přes Cloudflare Access.', 401);
  }
}

export function requireSameOrigin(request) {
  if (request.headers.get('Origin') !== new URL(request.url).origin) throw new MenuError('Požadavek musí pocházet z této administrace.', 403);
}
