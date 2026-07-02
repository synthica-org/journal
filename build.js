// build.js — zero-dependency static site generator for the Synthica Journal.
//
// CONTRACT (page modules):
//   Add a file `pages/<name>.page.js` with:
//     export default async function build(ctx) {
//       return [{ path: 'issues/index.html', html: ctx.layout('Issues', body, { active: 'issues', depth: 1 }) }];
//     }
//   - `path` is relative to dist/ (e.g. 'index.html', 'articles/<slug>.html').
//   - Two modules emitting the same path is a hard build error (keep pages disjoint).
//   - NEVER edit this core to add pages — it auto-discovers pages/*.page.js.
//
// ctx = {
//   config,                      // config.json
//   data: { meta, issues, articles },  // live API (API_BASE env) with data/fallback.json fallback
//   layout(title, body, { active = '', head = '', depth = 0 }),  // full HTML document
//   esc(str), slugify(str),      // helpers
// }
//
// `depth` = number of directories in the page's own output path (0 for index.html,
// 1 for issues/index.html). It drives the {{P}} relative prefix in partials/links.
//
// Data: `API_BASE=http://localhost:4000 node build.js` pulls live journal data
// (meta / issues / publications); each endpoint falls back to data/fallback.json
// independently, so the site always builds.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');

const config = JSON.parse(readFileSync(path.join(ROOT, 'config.json'), 'utf8'));

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const slugify = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'untitled';

// ---------------------------------------------------------------------------
// Data loading: live API when API_BASE is set, per-endpoint fallback otherwise.
// ---------------------------------------------------------------------------
async function loadData() {
  const fallback = JSON.parse(readFileSync(path.join(ROOT, 'data', 'fallback.json'), 'utf8'));
  const base = (process.env.API_BASE || '').replace(/\/$/, '');
  if (!base) {
    console.log('[data] using data/fallback.json (set API_BASE=<backend> for live data)');
    return fallback;
  }
  const grab = async (p, fb) => {
    try {
      const res = await fetch(`${base}${p}`, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`[data] ${p} unavailable (${err.message}) — using fallback`);
      return fb;
    }
  };
  const [meta, issues, articles] = await Promise.all([
    grab('/api/journal/meta', fallback.meta),
    grab('/api/journal/issues', fallback.issues),
    grab('/api/journal/publications', fallback.articles),
  ]);
  return { meta: { ...fallback.meta, ...meta }, issues, articles };
}

// ---------------------------------------------------------------------------
// Layout: wraps a page body with the shared header/footer partials.
// ---------------------------------------------------------------------------
const header = readFileSync(path.join(ROOT, 'partials', 'header.html'), 'utf8');
const footer = readFileSync(path.join(ROOT, 'partials', 'footer.html'), 'utf8');

function makeLayout(meta) {
  const issn = (meta.issn && meta.issn !== 'pending') ? meta.issn : null;
  return function layout(title, body, { active = '', head = '', depth = 0 } = {}) {
    const P = '../'.repeat(depth);
    const tokens = {
      '{{P}}': P,
      '{{TITLE}}': esc(meta.title || config.title),
      '{{TAGLINE}}': esc(config.tagline),
      '{{ISSN_DISPLAY}}': issn ? `ISSN ${esc(issn)} (online)` : 'ISSN pending',
      '{{PUBLISHER}}': esc(meta.publisher || config.publisher),
      '{{FREQUENCY}}': esc(meta.frequency || config.frequency),
      '{{DASHBOARD_URL}}': esc(meta.dashboardUrl || config.dashboardUrl),
      '{{SUBMIT_URL}}': esc(`${(meta.dashboardUrl || config.dashboardUrl).replace(/\/$/, '')}/register?from=journal`),
      '{{CONTACT_EMAIL}}': esc(config.contactEmail),
      '{{YEAR}}': String(new Date().getFullYear()),
      '{{ACTIVE}}': esc(active),
    };
    const fill = (tpl) => Object.entries(tokens).reduce((acc, [k, v]) => acc.split(k).join(v), tpl);
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · ${esc(meta.title || config.title)}</title>
<link rel="stylesheet" href="${P}styles/design-system.css">
<link rel="stylesheet" href="${P}styles/base.css">
<link rel="stylesheet" href="${P}styles/journal.css">
${head}
</head>
<body data-active="${esc(active)}">
${fill(header)}
<main class="jr-main" id="main">
${body}
</main>
${fill(footer)}
</body>
</html>`;
  };
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
const data = await loadData();
const layout = makeLayout(data.meta || {});
const ctx = { config, data, layout, esc, slugify };

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(path.join(ROOT, 'styles'), path.join(DIST, 'styles'), { recursive: true });
if (existsSync(path.join(ROOT, 'assets'))) cpSync(path.join(ROOT, 'assets'), path.join(DIST, 'assets'), { recursive: true });

const modules = readdirSync(path.join(ROOT, 'pages')).filter((f) => f.endsWith('.page.js')).sort();
const emitted = new Map(); // path -> module (collision detection)
let count = 0;

for (const mod of modules) {
  const { default: build } = await import(pathToFileURL(path.join(ROOT, 'pages', mod)).href);
  const pages = await build(ctx);
  for (const { path: rel, html } of pages || []) {
    if (emitted.has(rel)) throw new Error(`Duplicate output "${rel}" from ${mod} (already emitted by ${emitted.get(rel)})`);
    emitted.set(rel, mod);
    const out = path.join(DIST, rel);
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, html);
    count += 1;
  }
  console.log(`[build] ${mod} → ${pages?.length ?? 0} page(s)`);
}

console.log(`[build] done: ${count} pages → dist/`);
