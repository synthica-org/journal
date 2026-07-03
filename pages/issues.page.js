// pages/issues.page.js — issue archive (dist/issues/index.html) plus one
// table-of-contents page per issue (dist/issues/vol-V-issue-I.html).
// Unit: journal-core.

import {
  fmtDate,
  countLabel,
  issueFile,
  issuePath,
  issueLabel,
  articlesOf,
  validIssues,
  issueArticleCount,
  headTags,
  tocRow,
} from './_journal-core.lib.js';

// Journal front-matter ordering for ToC sections; unknown types follow, A→Z.
// Keys are slugified articleType values, so "Review", "review", and "Review "
// all land in the same group (and produce one unique heading id).
const TYPE_ORDER = ['editorial', 'article', 'letter', 'review', 'analysis', 'methods'];
const TYPE_HEADINGS = { editorial: 'Editorial', article: 'Articles', letter: 'Letters', review: 'Reviews' };

export default async function build(ctx) {
  const { config, data, layout, esc, slugify } = ctx;
  const meta = data.meta || {};
  const articles = Array.isArray(data.articles) ? data.articles : [];
  const P = '../'; // every page in this module lives under issues/ (depth 1)

  const title = meta.title || config.title || 'Synthica Journal';

  // Only issues with numeric volume/issue become pages (they form the output
  // path); duplicates are dropped so two records can never emit the same file.
  const issues = validIssues(data.issues);

  const chrono = [...issues].sort(
    (a, b) => Number(a.volume) - Number(b.volume) || Number(a.issue) - Number(b.issue)
  );

  // Resolve each issue's articles once; reused by the index rows, the ToC
  // pages, and every count so they can never disagree.
  const artsByIssue = new Map(chrono.map((iss) => [iss, articlesOf(articles, iss)]));
  const issueCount = (iss) => issueArticleCount(artsByIssue.get(iss), iss, articles);

  const headFor = (rel, description) => headTags({ P, esc, meta, config, description, rel });

  // ---- issues/index.html — all volumes, newest first -----------------------
  const byVolume = new Map(); // volume -> issues, newest issue first
  for (const iss of [...chrono].reverse()) {
    const v = Number(iss.volume);
    if (!byVolume.has(v)) byVolume.set(v, []);
    byVolume.get(v).push(iss);
  }

  const volumeYear = (volume, list) => {
    const years = list
      .filter((i) => i.publishedAt)
      .map((i) => new Date(i.publishedAt).getUTCFullYear())
      .filter(Number.isFinite);
    if (years.length) {
      const min = Math.min(...years);
      const max = Math.max(...years);
      return min === max ? String(min) : `${min}–${max}`;
    }
    const first = Number(config.firstYear);
    return Number.isFinite(first) ? String(first + volume - 1) : '';
  };

  const issueRow = (iss) => {
    const count = issueCount(iss);
    const when = iss.publishedAt ? fmtDate(iss.publishedAt) : 'in progress';
    return `
        <li>
          <a class="jc-issue-link" href="${esc(issueFile(iss))}">
            <span class="jc-issue-name">${esc(issueLabel(iss))}</span>
            <span class="jc-issue-when">— ${esc(when)}</span>
            <span class="jc-issue-count">· ${esc(countLabel(count, 'article'))}</span>${
              iss.status === 'open' ? '\n            <span class="jc-chip">Open</span>' : ''
            }
          </a>
        </li>`;
  };

  const volumeSections = [...byVolume.entries()]
    .map(
      ([v, list]) => `
    <section class="jc-volume" aria-labelledby="volume-${esc(String(v))}">
      <h2 class="jc-volume-title" id="volume-${esc(String(v))}">Volume ${esc(String(v))}
        <span class="jc-volume-year">${esc(volumeYear(v, list))}</span></h2>
      <ul class="jc-issue-list">${list.map(issueRow).join('')}
      </ul>
    </section>`
    )
    .join('');

  const firstYear = Number(config.firstYear);
  const indexLede = issues.length
    ? `Every issue of ${title}${Number.isFinite(firstYear) ? `, from Volume 1 (${firstYear}) onward` : ''} —
      ${countLabel(articles.length, 'peer-reviewed article')} across ${countLabel(issues.length, 'issue')}, all open access.`
    : `${title} has not published an issue yet — the first one is in preparation.`;

  const indexBody = `
<div class="page-journal jc-page">
  <header class="jc-pagehead">
    <span class="section-badge">Archive</span>
    <h1 class="jc-h1">Issues</h1>
    <p class="jc-lede">${esc(indexLede).replace(/\s+/g, ' ')}</p>
  </header>
  ${volumeSections || '<p class="jc-empty">No issues yet — the inaugural issue is in preparation.</p>'}
</div>`;

  const pages = [
    {
      path: 'issues/index.html',
      html: layout('Issues', indexBody, {
        active: 'issues',
        head: headFor('issues/', `All issues of ${title} — the complete open-access archive, grouped by volume.`),
        depth: 1,
      }),
    },
  ];

  // ---- issues/vol-V-issue-I.html — one ToC per issue ------------------------
  chrono.forEach((iss, idx) => {
    const arts = artsByIssue.get(iss);
    const label = issueLabel(iss);
    const count = issueCount(iss);
    const when = iss.publishedAt
      ? `Published ${fmtDate(iss.publishedAt)}`
      : 'In progress — articles are added as they are accepted';
    const prev = chrono[idx - 1];
    const next = chrono[idx + 1];

    // Group the ToC by article type, in journal front-matter order. Grouping
    // by the slugified type guarantees one group — and one unique heading
    // id — per type, however the source data cases or spaces it.
    const groups = new Map(); // slug -> { display, items }
    for (const a of arts) {
      const raw = String(a?.articleType || 'Article');
      const key = slugify(raw);
      if (!groups.has(key)) groups.set(key, { display: raw, items: [] });
      groups.get(key).items.push(a);
    }
    const orderedKeys = [...groups.keys()].sort((x, y) => {
      const ix = TYPE_ORDER.indexOf(x);
      const iy = TYPE_ORDER.indexOf(y);
      return (ix === -1 ? TYPE_ORDER.length : ix) - (iy === -1 ? TYPE_ORDER.length : iy) || x.localeCompare(y);
    });

    const tocSections = orderedKeys
      .map(
        (key) => `
  <section class="jc-toc-group" aria-labelledby="toc-${esc(key)}">
    <h2 class="jc-type-heading" id="toc-${esc(key)}">${esc(TYPE_HEADINGS[key] || groups.get(key).display)}</h2>
    <ol class="jc-toc">${groups
      .get(key)
      .items.map((a) => tocRow(a, { P, esc, slugify, withAffiliations: true }))
      .join('')}
    </ol>
  </section>`
      )
      .join('');

    const body = `
<div class="page-journal jc-page">
  <nav class="jc-crumbs" aria-label="Breadcrumb"><a href="index.html">Issues</a> <span aria-hidden="true">›</span> ${esc(label)}</nav>
  <header class="jc-pagehead">
    <span class="section-badge">Table of contents</span>
    <h1 class="jc-h1">${esc(label)}${iss.status === 'open' ? ' <span class="jc-chip">Open</span>' : ''}</h1>
    <p class="jc-issuemeta">${esc(when)} · ${esc(countLabel(count, 'article'))} · ${esc(title)}</p>
  </header>${
    iss.editorial
      ? `
  <aside class="jc-editorial" aria-label="Editorial note">
    <span class="jc-editorial-label">From the editors</span>
    <p>${esc(iss.editorial)}</p>
  </aside>`
      : ''
  }
  ${tocSections || '<p class="jc-empty">No articles have been published in this issue yet — accepted papers will appear here.</p>'}
  <nav class="jc-issue-nav" aria-label="Issue navigation">
    <span>${prev ? `<a href="${esc(issueFile(prev))}">← ${esc(issueLabel(prev))}</a>` : ''}</span>
    <a href="index.html">All issues</a>
    <span>${next ? `<a href="${esc(issueFile(next))}">${esc(issueLabel(next))} →</a>` : ''}</span>
  </nav>
</div>`;

    pages.push({
      path: issuePath(iss),
      html: layout(label, body, {
        active: 'issues',
        head: headFor(
          issuePath(iss),
          `${label} of ${title}: table of contents — ${countLabel(count, 'open-access, peer-reviewed article')}.`
        ),
        depth: 1,
      }),
    });
  });

  return pages;
}
