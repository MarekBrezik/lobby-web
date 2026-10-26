import { menu } from '../src/menu-data.js';
import { MenuError, normalizeMenu } from '../src/menu-model.js';

export const schemaSQL = `CREATE TABLE IF NOT EXISTS menu_documents (
  id TEXT PRIMARY KEY CHECK (id = 'main'),
  revision INTEGER NOT NULL,
  data TEXT NOT NULL CHECK (json_valid(data)),
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS menu_history (
  revision INTEGER PRIMARY KEY,
  data TEXT NOT NULL CHECK (json_valid(data)),
  saved_at TEXT NOT NULL,
  saved_by TEXT NOT NULL
);`;

export async function loadMenu(env, local = false) {
  if (!env.MENU_DB) throw new MenuError('Chybí vazba MENU_DB na databázi D1.', 503);
  try {
    if (local) await env.MENU_DB.batch(schemaSQL.split(';').filter((statement) => statement.trim()).map((statement) => env.MENU_DB.prepare(statement)));
    const row = await env.MENU_DB.prepare("SELECT revision, data, updated_at FROM menu_documents WHERE id = 'main'").first();
    return row ? { revision: row.revision, categories: normalizeMenu(JSON.parse(row.data)), updatedAt: row.updated_at } : { revision: 0, categories: normalizeMenu(menu), updatedAt: null };
  } catch (error) {
    if (error instanceof MenuError) throw error;
    throw new MenuError('Databáze menu není připravená. Nejprve v D1 spusťte inicializační SQL.', 503);
  }
}

export async function saveMenu(env, categories, baseRevision, identity) {
  if (!Number.isSafeInteger(baseRevision) || baseRevision < 0) throw new MenuError('Chybí platná verze nabídky.');
  if (!env.MENU_DB) throw new MenuError('Chybí databáze menu.', 503);
  const normalized = normalizeMenu(categories);
  const json = JSON.stringify(normalized);
  const now = new Date().toISOString();
  const statements = baseRevision === 0 ? [
    env.MENU_DB.prepare("INSERT INTO menu_history (revision, data, saved_at, saved_by) SELECT 0, ?, ?, 'initial' WHERE NOT EXISTS (SELECT 1 FROM menu_documents WHERE id = 'main')").bind(JSON.stringify(normalizeMenu(menu)), now),
    env.MENU_DB.prepare("INSERT INTO menu_documents (id, revision, data, updated_at, updated_by) SELECT 'main', 1, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM menu_documents WHERE id = 'main') RETURNING revision").bind(json, now, identity.email),
  ] : [
    env.MENU_DB.prepare("INSERT INTO menu_history (revision, data, saved_at, saved_by) SELECT revision, data, updated_at, updated_by FROM menu_documents WHERE id = 'main' AND revision = ?").bind(baseRevision),
    env.MENU_DB.prepare("UPDATE menu_documents SET data = ?, revision = revision + 1, updated_at = ?, updated_by = ? WHERE id = 'main' AND revision = ? RETURNING revision").bind(json, now, identity.email, baseRevision),
  ];
  const result = await env.MENU_DB.batch(statements);
  const revision = result[1].results?.[0]?.revision;
  if (!revision) throw new MenuError('Nabídku mezitím upravil někdo jiný. Vaše změny zůstaly v prohlížeči; stáhněte si zálohu a načtěte aktuální verzi.', 409);
  return { categories: normalized, revision, updatedAt: now };
}
