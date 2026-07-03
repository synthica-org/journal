// _journal-core.lib.js — shared helpers for the journal-core unit's page
// modules (pages/home.page.js + pages/issues.page.js). This is NOT a page
// module: build.js only auto-discovers files ending in `.page.js`.
//
// Every function that renders HTML takes the caller's `esc` (and `slugify`
// where a slug is built) from ctx, so all data flows through the shared
// escaping helpers.

/** "ISSN 1234-5678 (online)" or "ISSN pending" — mirrors the masthead rule in build.js. */
export function issnDisplay(meta) {
  const issn = meta?.issn;
  return issn && issn !== 'pending' ? `ISSN ${issn} (online)` : 'ISSN pending';
}

/** Bare ISSN value for metadata tables: "1234-5678 (online)" or "Pending". */
export function issnValue(meta) {
  const issn = meta?.issn;
  return issn && issn !== 'pending' ? `${issn} (online)` : 'Pending';
}

/** Submission funnel on the dashboard: <dashboardUrl>/register?from=journal */
export function submitUrl(meta, config) {
  const base = String(meta?.dashboardUrl || config?.dashboardUrl || '').replace(/\/$/, '');
  return `${base}/register?from=journal`;
}

/** "Sep 30, 2025" — UTC so ISO dates don't drift a day across timezones. */
export function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** "3 articles" / "1 article" */
export const countLabel = (n, noun) => `${n} ${noun}${Number(n) === 1 ? '' : 's'}`;

export const authorLine = (authors) =>
  (authors || []).map((a) => a?.name).filter(Boolean).join(', ');

/** Distinct affiliations, in author order: "Bayside Science Academy; Northgate High School" */
const affiliationLine = (authors) =>
  [...new Set((authors || []).map((a) => a?.affiliation).filter(Boolean))].join('; ');

/** "1-14" -> "1–14" (en dash, as typeset in journal front matter). */
export const pageRange = (pages) => String(pages ?? '').replace(/\s*-\s*/g, '–');

/** Numeric first page for ToC ordering; articles without pages sort last. */
function firstPage(a) {
  const n = parseInt(String(a?.pages ?? '').match(/\d+/)?.[0] ?? '', 10);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

const doiUrl = (doi) => `https://doi.org/${doi}`;

/**
 * Article pages are owned by a sibling unit; both units use exactly this slug
 * rule, so we can link optimistically:
 *   articles/{slugify(title)}-{doi suffix after the last dot}.html
 */
export function articleHref(P, a, slugify) {
  return `${P}articles/${slugify(a?.title)}-${String(a?.doi ?? '').split('.').pop()}.html`;
}

/** Filename of an issue's ToC page inside issues/ (also used when emitting it). */
export const issueFile = (iss) => `vol-${Number(iss.volume)}-issue-${Number(iss.issue)}.html`;

/** Dist-relative output path of an issue's ToC page. */
export const issuePath = (iss) => `issues/${issueFile(iss)}`;

/** "Vol. 1 · Issue 2" */
export const issueLabel = (iss) => `Vol. ${iss.volume} · Issue ${iss.issue}`;

/** Articles belonging to an issue, in front-matter order (by first page). */
export function articlesOf(articles, iss) {
  return (articles || [])
    .filter((a) => Number(a?.volume) === Number(iss.volume) && Number(a?.issue) === Number(iss.issue))
    .sort(
      (x, y) =>
        firstPage(x) - firstPage(y) ||
        String(x?.publishedAt ?? '').localeCompare(String(y?.publishedAt ?? '')) ||
        String(x?.title ?? '').localeCompare(String(y?.title ?? ''))
    );
}

/**
 * Issues that can actually become pages: volume/issue must be numeric (they
 * form the output path), and duplicate volume+issue records are dropped so
 * two records can never emit — or link to — the same file.
 */
export function validIssues(issues) {
  const seen = new Set();
  return (Array.isArray(issues) ? issues : []).filter((i) => {
    const v = Number(i?.volume);
    const n = Number(i?.issue);
    if (!Number.isFinite(v) || !Number.isFinite(n)) return false;
    const key = `${v}:${n}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Article count shown for an issue. The resolved article list is the truth for
 * what the site actually renders, so prefer it whenever publications data
 * exists at all — the issue record's own `articleCount` is used only when
 * there is no publications data. This keeps counts consistent with the ToCs
 * (never a "5 articles" row above an issue page showing the empty state).
 */
export function issueArticleCount(matched, iss, allArticles) {
  if (matched.length) return matched.length;
  return (allArticles?.length ? 0 : Number(iss?.articleCount)) || 0;
}

/** Newest first: by volume, then issue number. */
const sortIssuesDesc = (issues) =>
  [...(issues || [])].sort((a, b) => Number(b.volume) - Number(a.volume) || Number(b.issue) - Number(a.issue));

/** The issue meta points at, else the open issue, else the newest one. */
export function currentIssueOf(meta, issues) {
  const list = issues || [];
  return (
    list.find(
      (i) => Number(i?.volume) === Number(meta?.currentVolume) && Number(i?.issue) === Number(meta?.currentIssue)
    ) ||
    list.find((i) => i?.status === 'open') ||
    sortIssuesDesc(list)[0] ||
    null
  );
}

/**
 * <link rel="canonical"> for a dist-relative path ('' = site root,
 * 'issues/' = the issues index, 'issues/vol-1-issue-1.html' = an issue ToC).
 * Returns '' when no public journal URL is configured.
 */
function canonicalTag(meta, config, esc, rel) {
  const base = String(meta?.journalUrl || config?.journalUrl || '').replace(/\/$/, '');
  return base ? `<link rel="canonical" href="${esc(`${base}/${rel}`)}">` : '';
}

/**
 * Extra <head> markup shared by this unit's pages: the unit stylesheet, a
 * meta description, and the canonical URL. `P` is the page's relative prefix
 * ('' or '../'); `rel` its dist-relative canonical path.
 */
export function headTags({ P, esc, meta, config, description, rel }) {
  return [
    `<link rel="stylesheet" href="${P}styles/journal-core.css">`,
    `<meta name="description" content="${esc(description)}">`,
    canonicalTag(meta, config, esc, rel),
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * One table-of-contents row (shared by the home "current issue" section and
 * the per-issue ToC pages). `P` is the page's relative prefix ('' or '../').
 */
export function tocRow(a, { P, esc, slugify, withAffiliations = false }) {
  const kickerBits = [a?.articleType, a?.category].filter(Boolean).map((s) => esc(s));
  if (a?.openAccess) kickerBits.push('Open access');
  const affils = withAffiliations ? affiliationLine(a?.authors) : '';
  const bib = [
    a?.pages ? `Pages ${esc(pageRange(a.pages))}` : '',
    a?.doi ? `<a href="${esc(doiUrl(a.doi))}">${esc(doiUrl(a.doi))}</a>` : '',
    a?.publishedAt ? `Published ${esc(fmtDate(a.publishedAt))}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  return `
        <li class="jc-toc-item">
          ${kickerBits.length ? `<p class="jc-kicker">${kickerBits.join(' · ')}</p>` : ''}
          <h3 class="jc-toc-title"><a href="${esc(articleHref(P, a, slugify))}">${esc(a?.title)}</a></h3>
          ${a?.authors?.length ? `<p class="jc-toc-authors">${esc(authorLine(a.authors))}</p>` : ''}
          ${affils ? `<p class="jc-toc-affils">${esc(affils)}</p>` : ''}
          ${bib ? `<p class="jc-toc-bib">${bib}</p>` : ''}
        </li>`;
}
