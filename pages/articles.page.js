// pages/articles.page.js — Unit 7: journal-articles.
//
// Emits (owns dist/articles/** ONLY):
//   articles/<slug>.html   one landing page per article in data.articles
//   articles/<slug>.bib    downloadable BibTeX record (plain text)
//   articles/<slug>.ris    downloadable RIS record (plain text)
//   articles/index.html    all-articles listing
//   articles/article.css   styles for the pages above (linked from their <head>)
//
// Cross-unit contracts (shared with the issues unit — must match exactly):
//   article slug:    `${slugify(a.title)}-${a.doi.split('.').pop()}`
//   issue permalink: issues/vol-{V}-issue-{I}.html   (emitted by the issues unit)
//
// Head compliance per article: Google Scholar citation_* tags, canonical link,
// meta description, and JSON-LD ScholarlyArticle. citation_issn is emitted only
// once the journal's ISSN is assigned (meta.issn !== 'pending').

// ---------------------------------------------------------------------------
// Pure helpers (no ctx needed)
// ---------------------------------------------------------------------------

const DATE_FMT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** '2025-09-30' → '30 September 2025' (UTC-safe). */
const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? String(iso) : DATE_FMT.format(d);
};

/** '2025-09-30' → '2025/09/30' (Google Scholar citation_publication_date, RIS DA). */
const slashDate = (iso) => String(iso).slice(0, 10).split('-').join('/');

const yearOf = (iso) => String(iso || '').slice(0, 4);

/** Count with thousands separators; non-numeric input renders as 0. */
const fmtCount = (v) => (Number(v) || 0).toLocaleString('en-US');

/** Whitespace-normalise and cut near `max` chars on a word boundary. */
const truncate = (s, max = 200) => {
  const str = String(s || '').replace(/\s+/g, ' ').trim();
  if (str.length <= max) return str;
  const cut = str.slice(0, max - 1);
  const at = cut.lastIndexOf(' ');
  return `${(at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s.,;:]+$/, '')}…`;
};

/** 'A-B' (hyphen, en or em dash) → ['A', 'B']; 'A' → ['A']. */
const splitPages = (pages) => String(pages || '').split(/[-–—]/).map((s) => s.trim()).filter(Boolean);

/** Page range for display/citations, with an en dash: '1-14' → '1–14'. */
const pageRange = (pages) => splitPages(pages).join('–');

/** MLA page label: 'pp.' for a range, 'p.' for a single page / e-locator. */
const pagesLabel = (pages) => (splitPages(pages).length > 1 ? 'pp.' : 'p.');

/** Collapse whitespace/newlines so one-record-per-line formats (RIS) stay valid. */
const oneLine = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

/** Escape LaTeX-special characters so hostile text can't corrupt a .bib record. */
const BIB_MAP = {
  '\\': '\\textbackslash{}', '{': '\\{', '}': '\\}', '%': '\\%', '&': '\\&',
  '#': '\\#', '$': '\\$', '_': '\\_', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}',
};
const bibEscape = (s) => oneLine(s).replace(/[\\{}%&#$_~^]/g, (c) => BIB_MAP[c]);

/** 'Sam Rivera' → { first: 'Sam', last: 'Rivera' }. */
const nameParts = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  const last = parts.pop() || '';
  return { first: parts.join(' '), last };
};

/** APA 7 author: 'Sam Rivera' → 'Rivera, S.'. */
const apaAuthor = (name) => {
  const { first, last } = nameParts(name);
  const initials = first ? first.split(/\s+/).map((w) => `${w[0].toUpperCase()}.`).join(' ') : '';
  return initials ? `${last}, ${initials}` : last;
};

/** APA 7 author list: 'Rivera, S., & Kim, J.'. */
const apaAuthors = (authors) => {
  const names = (authors || []).map((au) => apaAuthor(au.name)).filter(Boolean);
  if (names.length <= 1) return names[0] || '';
  return `${names.slice(0, -1).join(', ')}, & ${names[names.length - 1]}`;
};

/** MLA 9 author list: 1 → 'Rivera, Sam.'-style; 2 → '…, and Jordan Kim'; 3+ → '…, et al.'. */
const mlaAuthors = (authors) => {
  const list = (authors || []).map((au) => au.name).filter(Boolean);
  if (list.length === 0) return '';
  const { first, last } = nameParts(list[0]);
  const head = first ? `${last}, ${first}` : last;
  if (list.length === 1) return head;
  if (list.length === 2) return `${head}, and ${list[1]}`;
  return `${head}, et al.`;
};

/** RIS author: 'Sam Rivera' → 'Rivera, Sam'. */
const risAuthor = (name) => {
  const { first, last } = nameParts(name);
  return first ? `${last}, ${first}` : last;
};

/** Titles keep their own terminal punctuation in citations ('…?' gets no extra '.'). */
const endDot = (s) => (/[.?!]$/.test(String(s || '').trim()) ? '' : '.');

// ---------------------------------------------------------------------------
// Page styles — emitted once as articles/article.css and linked from each page.
// Scoped under ja- (journal article) class names; reuses design-system tokens
// and the type families journal.css already loads (Inter Tight, JetBrains Mono).
// ---------------------------------------------------------------------------
const ARTICLE_CSS = `/* articles/article.css — styles for the article pages (Unit 7: articles/**). */

.ja-breadcrumb {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem; letter-spacing: 0.05em; text-transform: uppercase;
  color: var(--fg-subtle, #a3a3a3); margin: 0.35rem 0 1.9rem;
}
.ja-breadcrumb a { color: var(--fg-muted, #737373); }
.ja-breadcrumb a:hover { color: var(--brand-deep, #2589ed); }
.ja-breadcrumb .ja-sep { margin: 0 0.45rem; color: var(--line-strong, #d4d4d4); }

.ja-grid { display: grid; grid-template-columns: minmax(0, 1fr) 310px; gap: clamp(2rem, 4vw, 3.5rem); align-items: start; }

/* --- Title block ------------------------------------------------------- */
.ja-badges { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0 0 1.1rem; }
.ja-badge {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.66rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 0.32rem 0.65rem; border-radius: 999px; border: 1px solid transparent; white-space: nowrap;
}
.ja-badge-type { background: var(--accent-subtle, rgba(37, 137, 237, 0.12)); color: var(--brand-deep, #2589ed); }
.ja-badge-cat { border-color: var(--line-strong, #d4d4d4); color: var(--fg-muted, #737373); background: var(--bg, #fff); }
.ja-badge-oa { background: rgba(26, 127, 55, 0.1); color: #1a7f37; }

.ja-title {
  font-family: 'Inter Tight', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(1.7rem, 3.4vw, 2.5rem); font-weight: 800; letter-spacing: -0.035em;
  line-height: 1.14; color: var(--fg, #0a0a0a); margin: 0 0 1rem;
}

.ja-authors { font-size: 1.02rem; line-height: 1.6; color: var(--fg, #0a0a0a); margin: 0 0 0.4rem; }
.ja-authors sup { color: var(--brand-deep, #2589ed); font-weight: 600; }
.ja-affils { list-style: none; margin: 0 0 1.5rem; padding: 0; font-size: 0.85rem; color: var(--fg-muted, #737373); }
.ja-affils li { margin: 0.15rem 0; }
.ja-affils sup { color: var(--brand-deep, #2589ed); font-weight: 600; margin-right: 0.35rem; }

.ja-meta {
  border-top: 1px solid var(--line, #eaeaea); border-bottom: 1px solid var(--line, #eaeaea);
  padding: 0.95rem 0; margin: 0 0 1.4rem; display: grid; gap: 0.5rem;
  font-size: 0.88rem; color: var(--fg-muted, #737373);
}
.ja-meta a { color: var(--brand-deep, #2589ed); overflow-wrap: anywhere; }
.ja-meta b { color: var(--fg, #0a0a0a); font-weight: 700; }
.ja-publine em { font-style: italic; }
.ja-history span + span::before, .ja-metrics span + span::before { content: '·'; margin: 0 0.55rem; color: var(--line-strong, #d4d4d4); }

.ja-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 0 0 2.4rem; }
.ja-btn {
  display: inline-flex; align-items: center; gap: 0.5rem;
  background: var(--brand-deep, #2589ed); color: #fff; font-weight: 700; font-size: 0.9rem;
  padding: 0.6rem 1.25rem; border-radius: 10px; box-shadow: 0 2px 8px rgba(37, 137, 237, 0.25);
}
.ja-btn:hover { text-decoration: none; filter: brightness(1.06); }

/* --- Article sections --------------------------------------------------- */
.ja-label {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.72rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--brand-deep, #2589ed); margin: 0 0 0.85rem;
}
.ja-section { border-top: 1px solid var(--line, #eaeaea); padding-top: 1.5rem; margin: 0 0 2.1rem; }
.ja-abstract { font-size: 1.03rem; line-height: 1.75; color: var(--fg, #0a0a0a); margin: 0; }

.ja-keywords ul { list-style: none; display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0; padding: 0; }
.ja-keywords li {
  font-size: 0.8rem; padding: 0.28rem 0.75rem; border-radius: 999px;
  border: 1px solid var(--line-strong, #d4d4d4); background: var(--bg-subtle, #fafafa); color: var(--fg-muted, #737373);
}

.ja-license {
  border: 1px solid var(--line, #eaeaea); border-left: 3px solid var(--brand-deep, #2589ed);
  background: var(--bg-subtle, #fafafa); padding: 1.15rem 1.3rem; margin: 0 0 2.1rem;
}
.ja-license p { margin: 0; font-size: 0.92rem; line-height: 1.7; color: var(--fg-muted, #737373); }
.ja-license a { color: var(--brand-deep, #2589ed); font-weight: 600; }

.ja-refs { margin: 0; padding-left: 1.4rem; font-size: 0.92rem; line-height: 1.65; color: var(--fg-muted, #737373); }
.ja-refs li { margin: 0 0 0.7rem; padding-left: 0.3rem; }
.ja-refs li::marker { color: var(--brand-deep, #2589ed); font-weight: 600; }

/* --- Right rail ---------------------------------------------------------- */
.ja-side { display: flex; flex-direction: column; gap: 1.25rem; }
.ja-card { border: 1px solid var(--line, #eaeaea); border-radius: 14px; background: var(--bg, #fff); padding: 1.25rem 1.3rem; }
.ja-card .ja-label { margin-bottom: 1rem; }

.ja-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
.ja-stat b {
  display: block; font-family: 'Inter Tight', 'Inter', sans-serif; font-size: 1.3rem; font-weight: 800;
  letter-spacing: -0.02em; color: var(--fg, #0a0a0a); line-height: 1.2;
}
.ja-stat span {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.62rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--fg-subtle, #a3a3a3);
}

.ja-info { margin: 0; font-size: 0.85rem; }
.ja-info > div { display: flex; justify-content: space-between; gap: 1rem; padding: 0.45rem 0; border-bottom: 1px dashed var(--line, #eaeaea); }
.ja-info > div:last-child { border-bottom: none; }
.ja-info dt { color: var(--fg-subtle, #a3a3a3); flex: none; }
.ja-info dd { margin: 0; text-align: right; color: var(--fg, #0a0a0a); min-width: 0; overflow-wrap: anywhere; }
.ja-info dd a { color: var(--brand-deep, #2589ed); }

.ja-cite-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: 0.9rem; }
.ja-cite-head:first-of-type { margin-top: 0; }
.ja-cite-fmt {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.68rem; font-weight: 600; letter-spacing: 0.1em; color: var(--fg, #0a0a0a);
}
.ja-copy {
  font: 600 0.72rem 'Inter', -apple-system, sans-serif; color: var(--fg-muted, #737373);
  background: var(--bg, #fff); border: 1px solid var(--line-strong, #d4d4d4); border-radius: 6px;
  padding: 0.18rem 0.6rem; cursor: pointer;
}
.ja-copy:hover { color: var(--brand-deep, #2589ed); border-color: var(--brand-deep, #2589ed); }
.ja-cite-text {
  font-size: 0.8rem; line-height: 1.6; color: var(--fg-muted, #737373);
  background: var(--bg-subtle, #fafafa); border: 1px solid var(--line, #eaeaea); border-radius: 8px;
  padding: 0.7rem 0.8rem; margin: 0.45rem 0 0; overflow-wrap: anywhere;
}
.ja-downloads { display: flex; gap: 0.6rem; margin-top: 1rem; }
.ja-dl {
  flex: 1; text-align: center; font-size: 0.8rem; font-weight: 600; color: var(--fg-muted, #737373);
  border: 1px solid var(--line-strong, #d4d4d4); border-radius: 8px; padding: 0.45rem 0.6rem;
}
.ja-dl:hover { text-decoration: none; color: var(--brand-deep, #2589ed); border-color: var(--brand-deep, #2589ed); }

/* --- All-articles index --------------------------------------------------- */
.ja-index-head { margin: 0.35rem 0 2.2rem; max-width: 44rem; }
.ja-index-title {
  font-family: 'Inter Tight', 'Inter', sans-serif; font-size: clamp(1.9rem, 4vw, 2.7rem);
  font-weight: 800; letter-spacing: -0.04em; color: var(--fg, #0a0a0a); margin: 0.3rem 0 0.75rem;
}
.ja-index-head p { margin: 0; color: var(--fg-muted, #737373); line-height: 1.65; }
.ja-list { list-style: none; margin: 0; padding: 0; }
.ja-item { border-top: 1px solid var(--line, #eaeaea); padding: 1.6rem 0; }
.ja-item-title { font-family: 'Inter Tight', 'Inter', sans-serif; font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; line-height: 1.3; margin: 0.55rem 0 0.4rem; }
.ja-item-title a { color: var(--fg, #0a0a0a); }
.ja-item-title a:hover { color: var(--brand-deep, #2589ed); }
.ja-item-authors { margin: 0 0 0.4rem; font-size: 0.92rem; color: var(--fg-muted, #737373); }
.ja-item-meta { display: flex; flex-wrap: wrap; gap: 0.3rem 0.95rem; font-size: 0.82rem; color: var(--fg-subtle, #a3a3a3); }
.ja-item-meta a { color: var(--brand-deep, #2589ed); overflow-wrap: anywhere; }

/* --- Responsive / print ---------------------------------------------------- */
@media (max-width: 900px) {
  .ja-grid { grid-template-columns: 1fr; }
  .ja-side { margin-top: 0.5rem; }
}
@media print {
  .ja-side, .ja-actions, .ja-copy, .ja-breadcrumb { display: none !important; }
  .ja-grid { display: block; }
}
`;

// Progressive enhancement only: reveal + wire the "Copy" citation buttons.
// The page is fully usable without JavaScript.
const COPY_SCRIPT = `<script>
(function () {
  if (!navigator.clipboard) return;
  document.querySelectorAll('.ja-copy').forEach(function (btn) {
    btn.hidden = false;
    btn.addEventListener('click', function () {
      var el = document.getElementById(btn.getAttribute('data-target'));
      if (!el) return;
      navigator.clipboard.writeText(el.textContent.trim()).then(function () {
        var was = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = was; }, 1400);
      });
    });
  });
})();
</script>`;

// ---------------------------------------------------------------------------
// Page module
// ---------------------------------------------------------------------------
export default async function build({ config, data, layout, esc, slugify }) {
  const meta = data.meta || {};
  const articles = Array.isArray(data.articles) ? data.articles : [];

  const journalTitle = meta.title || config.title || 'Synthica Journal';
  const journalUrl = String(meta.journalUrl || config.journalUrl || '').replace(/\/$/, '');
  const publisher = meta.publisher || config.publisher || '';
  const issn = meta.issn && meta.issn !== 'pending' ? meta.issn : null;
  const licenseUrl = config.licenseUrl || 'https://creativecommons.org/licenses/by/4.0/';

  const slugOf = (a) => `${slugify(a.title)}-${String(a.doi || '').split('.').pop()}`;
  // Percent-encode within path segments (DOIs may contain #, ?, %) while
  // keeping '/' — per Crossref DOI display/linking guidelines.
  const doiUrl = (a) => `https://doi.org/${String(a.doi || '').split('/').map(encodeURIComponent).join('/')}`;
  // Issue permalink pattern is a cross-unit contract — see the header comment.
  const issueHref = (a) => `../issues/vol-${a.volume}-issue-${a.issue}.html`;
  // Only http(s) URLs may become the PDF link / citation_pdf_url — same
  // invariant as the reference implementation's safeHref (journal-data.js).
  // Scheme-less paths resolve against the journal URL; javascript:/data:/etc.
  // and placeholder values ('#') are dropped.
  const pdfHref = (u) => {
    const s = String(u || '').trim();
    if (!s || s.startsWith('#')) return '';
    if (/^https?:\/\//i.test(s)) return s;
    if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return '';
    return `${journalUrl}/${s.replace(/^\/+/, '')}`;
  };
  // Shared badge strip (article header + index listing).
  const badgesHtml = (a) => `
      ${a.articleType ? `<span class="ja-badge ja-badge-type">${esc(a.articleType)}</span>` : ''}
      ${a.category ? `<span class="ja-badge ja-badge-cat">${esc(a.category)}</span>` : ''}
      ${a.openAccess ? `<span class="ja-badge ja-badge-oa">Open access</span>` : ''}
      ${a.verified === false ? `<span class="ja-badge ja-badge-preprint">Preprint · awaiting verification</span>` : ''}`;
  /** [['Received', '14 June 2025'], …] — only dates present in the record. */
  const dateRows = (a) => [
    ['Received', a.receivedAt],
    ['Accepted', a.acceptedAt],
    ['Published', a.publishedAt],
  ].filter(([, d]) => d).map(([label, d]) => [label, esc(fmtDate(d))]);
  /** [['Accesses', '412'], …] — accesses/citations always shown (0 default). */
  const metricRows = (a) => [
    ['Accesses', a.metrics?.accesses ?? 0],
    ['Citations', a.metrics?.citations ?? 0],
    ...(a.metrics?.altmetric != null ? [['Altmetric', a.metrics.altmetric]] : []),
  ].map(([label, v]) => [label, esc(fmtCount(v))]);

  // ---- Citations ----------------------------------------------------------
  const apaCite = (a) => {
    const who = apaAuthors(a.authors);
    const doi = a.doi ? doiUrl(a) : '';
    return `${who ? `${who} ` : ''}(${yearOf(a.publishedAt) || 'n.d.'}). ${a.title}${endDot(a.title)} ${journalTitle}, ` +
      `${a.volume}(${a.issue})${a.pages ? `, ${pageRange(a.pages)}` : ''}.${doi ? ` ${doi}` : ''}`;
  };

  const mlaCite = (a) => {
    const who = mlaAuthors(a.authors);
    const year = yearOf(a.publishedAt);
    const doi = a.doi ? doiUrl(a) : '';
    return `${who ? `${who}${endDot(who)} ` : ''}"${a.title}${endDot(a.title)}" ${journalTitle}, ` +
      `vol. ${a.volume}, no. ${a.issue}${year ? `, ${year}` : ''}` +
      `${a.pages ? `, ${pagesLabel(a.pages)} ${pageRange(a.pages)}` : ''}${doi ? `, ${doi}` : ''}.`;
  };

  // Citation-key stem derived from the journal title ('synthica'), so exported
  // records track a config/meta rename.
  const bibStem = slugify(journalTitle).split('-')[0] || 'journal';

  const bibtexOf = (a) => {
    const [p1, p2] = splitPages(a.pages);
    const { last } = nameParts(a.authors?.[0]?.name || 'anon');
    const key = `${bibStem}${yearOf(a.publishedAt)}${last.toLowerCase().replace(/[^a-z]/g, '') || 'anon'}`;
    return [
      `@article{${key},`,
      `  title     = {{${a.title}}},`,
      `  author    = {${(a.authors || []).map((au) => au.name).join(' and ')}},`,
      `  journal   = {${journalTitle}},`,
      `  year      = {${yearOf(a.publishedAt)}},`,
      `  volume    = {${a.volume}},`,
      `  number    = {${a.issue}},`,
      p1 ? `  pages     = {${p1}${p2 ? `--${p2}` : ''}},` : null,
      issn ? `  issn      = {${issn}},` : null,
      publisher ? `  publisher = {${publisher}},` : null,
      `  doi       = {${a.doi}},`,
      `  url       = {${doiUrl(a)}},`,
      a.abstract ? `  abstract  = {${a.abstract}},` : null,
      a.keywords?.length ? `  keywords  = {${a.keywords.join(', ')}},` : null,
      '}',
      '',
    ].filter((l) => l !== null).join('\n');
  };

  const risOf = (a) => {
    const [p1, p2] = splitPages(a.pages);
    return [
      'TY  - JOUR',
      `TI  - ${a.title}`,
      ...(a.authors || []).map((au) => `AU  - ${risAuthor(au.name)}`),
      `JO  - ${journalTitle}`,
      `PY  - ${yearOf(a.publishedAt)}`,
      a.publishedAt ? `DA  - ${slashDate(a.publishedAt)}` : null,
      `VL  - ${a.volume}`,
      `IS  - ${a.issue}`,
      p1 ? `SP  - ${p1}` : null,
      p2 ? `EP  - ${p2}` : null,
      issn ? `SN  - ${issn}` : null,
      publisher ? `PB  - ${publisher}` : null,
      `DO  - ${a.doi}`,
      `UR  - ${doiUrl(a)}`,
      a.abstract ? `AB  - ${a.abstract}` : null,
      ...(a.keywords || []).map((k) => `KW  - ${k}`),
      'ER  - ',
      '',
    ].filter((l) => l !== null).join('\n');
  };

  // ---- Head: Google Scholar tags, canonical, description, JSON-LD ----------
  const jsonLdOf = (a, canonical) => {
    const [p1, p2] = splitPages(a.pages);
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'ScholarlyArticle',
      headline: a.title,
      description: truncate(a.abstract, 500),
      author: (a.authors || []).map((au) => ({
        '@type': 'Person',
        name: au.name,
        ...(au.affiliation ? { affiliation: { '@type': 'Organization', name: au.affiliation } } : {}),
      })),
      datePublished: a.publishedAt,
      isPartOf: {
        '@type': 'PublicationIssue',
        issueNumber: String(a.issue),
        isPartOf: {
          '@type': 'PublicationVolume',
          volumeNumber: String(a.volume),
          isPartOf: { '@type': 'Periodical', name: journalTitle, ...(issn ? { issn } : {}) },
        },
      },
      ...(p1 ? { pageStart: p1 } : {}),
      ...(p2 ? { pageEnd: p2 } : {}),
      license: licenseUrl,
      identifier: { '@type': 'PropertyValue', propertyID: 'DOI', value: a.doi },
      sameAs: doiUrl(a),
      url: canonical,
      ...(a.keywords?.length ? { keywords: a.keywords.join(', ') } : {}),
      ...(a.openAccess ? { isAccessibleForFree: true } : {}),
    };
    // <-escape so a hostile title can never close the <script> element.
    return JSON.stringify(ld, null, 2).replace(/</g, '\\u003c');
  };

  const headOf = (a, slug) => {
    const canonical = `${journalUrl}/articles/${slug}.html`;
    const descr = truncate(a.abstract, 200);
    const [p1, p2] = splitPages(a.pages);
    return [
      `<link rel="canonical" href="${esc(canonical)}">`,
      `<meta name="description" content="${esc(descr)}">`,
      `<meta property="og:type" content="article">`,
      `<meta property="og:title" content="${esc(a.title)}">`,
      `<meta property="og:description" content="${esc(descr)}">`,
      `<meta property="og:url" content="${esc(canonical)}">`,
      `<meta name="citation_title" content="${esc(a.title)}">`,
      ...(a.authors || []).flatMap((au) => [
        `<meta name="citation_author" content="${esc(au.name)}">`,
        au.affiliation ? `<meta name="citation_author_institution" content="${esc(au.affiliation)}">` : null,
      ]),
      a.publishedAt ? `<meta name="citation_publication_date" content="${esc(String(a.publishedAt).slice(0, 10).split('-').join('/'))}">` : null,
      `<meta name="citation_journal_title" content="${esc(journalTitle)}">`,
      issn ? `<meta name="citation_issn" content="${esc(issn)}">` : null,
      a.volume != null ? `<meta name="citation_volume" content="${esc(a.volume)}">` : null,
      a.issue != null ? `<meta name="citation_issue" content="${esc(a.issue)}">` : null,
      p1 ? `<meta name="citation_firstpage" content="${esc(p1)}">` : null,
      p2 ? `<meta name="citation_lastpage" content="${esc(p2)}">` : null,
      pdfHref(a.pdfUrl) ? `<meta name="citation_pdf_url" content="${esc(pdfHref(a.pdfUrl))}">` : null,
      `<meta name="citation_abstract_html_url" content="${esc(canonical)}">`,
      a.doi ? `<meta name="citation_doi" content="${esc(a.doi)}">` : null,
      `<script type="application/ld+json">\n${jsonLdOf(a, canonical)}\n</script>`,
      `<link rel="stylesheet" href="article.css">`,
    ].filter((l) => l != null).join('\n');
  };

  // ---- Article page body ----------------------------------------------------
  const articleBody = (a, slug) => {
    // Superscript affiliation markers, Nature-style (deduped, in order of first use).
    const affils = [];
    const affilNo = new Map();
    for (const au of a.authors || []) {
      if (au.affiliation && !affilNo.has(au.affiliation)) {
        affilNo.set(au.affiliation, affils.length + 1);
        affils.push(au.affiliation);
      }
    }
    const authorsHtml = (a.authors || [])
      .map((au) => `${esc(au.name)}${au.affiliation ? `<sup>${affilNo.get(au.affiliation)}</sup>` : ''}`)
      .join(', ');

    const history = [
      a.receivedAt ? `<span><b>Received</b> ${esc(fmtDate(a.receivedAt))}</span>` : null,
      a.acceptedAt ? `<span><b>Accepted</b> ${esc(fmtDate(a.acceptedAt))}</span>` : null,
      a.publishedAt ? `<span><b>Published</b> ${esc(fmtDate(a.publishedAt))}</span>` : null,
    ].filter(Boolean).join(' ');

    const metrics = [
      a.metrics?.accesses != null ? `<span><b>${esc(a.metrics.accesses.toLocaleString('en-US'))}</b> Accesses</span>` : null,
      a.metrics?.citations != null ? `<span><b>${esc(a.metrics.citations.toLocaleString('en-US'))}</b> Citations</span>` : null,
      a.metrics?.altmetric != null ? `<span><b>${esc(a.metrics.altmetric.toLocaleString('en-US'))}</b> Altmetric</span>` : null,
    ].filter(Boolean);

    return `
<nav class="ja-breadcrumb" aria-label="Breadcrumb">
  <a href="../index.html">Home</a><span class="ja-sep">›</span><a href="${esc(issueHref(a))}">Vol ${esc(a.volume)} · Issue ${esc(a.issue)}</a><span class="ja-sep">›</span><span aria-current="page">${esc(a.articleType || 'Article')}</span>
</nav>
<div class="ja-grid">
  <article class="ja-main">
    <div class="ja-badges">
      ${a.articleType ? `<span class="ja-badge ja-badge-type">${esc(a.articleType)}</span>` : ''}
      ${a.category ? `<span class="ja-badge ja-badge-cat">${esc(a.category)}</span>` : ''}
      ${a.openAccess ? `<span class="ja-badge ja-badge-oa">Open access</span>` : ''}
    </div>
    <h1 class="ja-title">${esc(a.title)}</h1>
    <p class="ja-authors">${authorsHtml}</p>
    ${affils.length ? `<ol class="ja-affils">${affils.map((af, i) => `<li><sup>${i + 1}</sup>${esc(af)}</li>`).join('')}</ol>` : ''}
    <div class="ja-meta">
      <p class="ja-publine"><em>${esc(journalTitle)}</em> <b>${esc(a.volume)}</b>${a.pages ? `, ${esc(pageRange(a.pages))}` : ''} (${esc(yearOf(a.publishedAt))}) · Volume ${esc(a.volume)}, Issue ${esc(a.issue)}</p>
      ${history ? `<p class="ja-history">${history}</p>` : ''}
      <p class="ja-doiline"><b>DOI</b> <a href="${esc(doiUrl(a))}">${esc(doiUrl(a))}</a></p>
      ${metrics.length ? `<p class="ja-metrics">${metrics.join(' ')}</p>` : ''}
    </div>
    ${pdfHref(a.pdfUrl) ? `<div class="ja-actions"><a class="ja-btn" href="${esc(pdfHref(a.pdfUrl))}" target="_blank" rel="noopener">Download PDF</a></div>` : ''}

    <section class="ja-section" aria-labelledby="abstract-label">
      <h2 class="ja-label" id="abstract-label">Abstract</h2>
      <p class="ja-abstract">${esc(a.abstract)}</p>
    </section>

    ${a.keywords?.length ? `
    <section class="ja-section ja-keywords" aria-labelledby="keywords-label">
      <h2 class="ja-label" id="keywords-label">Keywords</h2>
      <ul>${a.keywords.map((k) => `<li>${esc(k)}</li>`).join('')}</ul>
    </section>` : ''}

    <section class="ja-license" aria-label="License">
      <h2 class="ja-label">License</h2>
      <p>Open access — This article is licensed under <a href="${esc(licenseUrl)}" rel="license noopener" target="_blank">CC BY 4.0</a> (Creative Commons Attribution 4.0 International), which permits use, sharing, adaptation, distribution and reproduction in any medium or format, provided the original author(s) and source are credited.</p>
    </section>

    ${a.references?.length ? `
    <section class="ja-section" aria-labelledby="references-label">
      <h2 class="ja-label" id="references-label">References</h2>
      <ol class="ja-refs">${a.references.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>
    </section>` : ''}
  </article>

  <aside class="ja-side">
    ${metrics.length ? `
    <div class="ja-card">
      <h2 class="ja-label">Metrics</h2>
      <div class="ja-stats">
        ${a.metrics?.accesses != null ? `<div class="ja-stat"><b>${esc(a.metrics.accesses.toLocaleString('en-US'))}</b><span>Accesses</span></div>` : ''}
        ${a.metrics?.citations != null ? `<div class="ja-stat"><b>${esc(a.metrics.citations.toLocaleString('en-US'))}</b><span>Citations</span></div>` : ''}
        ${a.metrics?.altmetric != null ? `<div class="ja-stat"><b>${esc(a.metrics.altmetric.toLocaleString('en-US'))}</b><span>Altmetric</span></div>` : ''}
      </div>
    </div>` : ''}

    <div class="ja-card">
      <h2 class="ja-label">Article info</h2>
      <dl class="ja-info">
        ${a.articleType ? `<div><dt>Type</dt><dd>${esc(a.articleType)}</dd></div>` : ''}
        ${a.category ? `<div><dt>Subject</dt><dd>${esc(a.category)}</dd></div>` : ''}
        ${a.receivedAt ? `<div><dt>Received</dt><dd>${esc(fmtDate(a.receivedAt))}</dd></div>` : ''}
        ${a.acceptedAt ? `<div><dt>Accepted</dt><dd>${esc(fmtDate(a.acceptedAt))}</dd></div>` : ''}
        ${a.publishedAt ? `<div><dt>Published</dt><dd>${esc(fmtDate(a.publishedAt))}</dd></div>` : ''}
        <div><dt>Issue</dt><dd><a href="${esc(issueHref(a))}">Volume ${esc(a.volume)}, Issue ${esc(a.issue)}</a></dd></div>
        ${a.pages ? `<div><dt>Pages</dt><dd>${esc(pageRange(a.pages))}</dd></div>` : ''}
        <div><dt>DOI</dt><dd><a href="${esc(doiUrl(a))}">${esc(a.doi)}</a></dd></div>
        ${a.license ? `<div><dt>License</dt><dd><a href="${esc(licenseUrl)}" rel="license">${esc(a.license)}</a></dd></div>` : ''}
      </dl>
    </div>

    <div class="ja-card">
      <h2 class="ja-label">Cite this article</h2>
      <div class="ja-cite-head"><span class="ja-cite-fmt">APA</span><button class="ja-copy" type="button" data-target="cite-apa" hidden>Copy</button></div>
      <p class="ja-cite-text" id="cite-apa">${esc(apaCite(a))}</p>
      <div class="ja-cite-head"><span class="ja-cite-fmt">MLA</span><button class="ja-copy" type="button" data-target="cite-mla" hidden>Copy</button></div>
      <p class="ja-cite-text" id="cite-mla">${esc(mlaCite(a))}</p>
      <div class="ja-downloads">
        <a class="ja-dl" href="${esc(slug)}.bib" download>BibTeX (.bib)</a>
        <a class="ja-dl" href="${esc(slug)}.ris" download>RIS (.ris)</a>
      </div>
    </div>
  </aside>
</div>
${COPY_SCRIPT}`;
  };

  // ---- All-articles index -----------------------------------------------------
  const indexBody = () => {
    const sorted = [...articles].sort((x, y) =>
      String(y.publishedAt || '').localeCompare(String(x.publishedAt || '')) ||
      (y.volume ?? 0) - (x.volume ?? 0) ||
      (y.issue ?? 0) - (x.issue ?? 0) ||
      (parseInt(splitPages(x.pages)[0], 10) || 0) - (parseInt(splitPages(y.pages)[0], 10) || 0)
    );
    const items = sorted.map((a) => {
      const slug = slugOf(a);
      return `
    <li class="ja-item">
      <div class="ja-badges">
        ${a.articleType ? `<span class="ja-badge ja-badge-type">${esc(a.articleType)}</span>` : ''}
        ${a.category ? `<span class="ja-badge ja-badge-cat">${esc(a.category)}</span>` : ''}
        ${a.openAccess ? `<span class="ja-badge ja-badge-oa">Open access</span>` : ''}
      </div>
      <h2 class="ja-item-title"><a href="${esc(slug)}.html">${esc(a.title)}</a></h2>
      <p class="ja-item-authors">${esc((a.authors || []).map((au) => au.name).join(', '))}</p>
      <div class="ja-item-meta">
        <span><a href="${esc(issueHref(a))}">Vol ${esc(a.volume)} · Issue ${esc(a.issue)}</a></span>
        ${a.pages ? `<span>pp. ${esc(pageRange(a.pages))}</span>` : ''}
        ${a.publishedAt ? `<span>${esc(fmtDate(a.publishedAt))}</span>` : ''}
        <span><a href="${esc(doiUrl(a))}">${esc(a.doi)}</a></span>
      </div>
    </li>`;
    }).join('');

    return `
<nav class="ja-breadcrumb" aria-label="Breadcrumb">
  <a href="../index.html">Home</a><span class="ja-sep">›</span><span aria-current="page">Articles</span>
</nav>
<header class="ja-index-head">
  <p class="ja-label">All articles</p>
  <h1 class="ja-index-title">Published research</h1>
  <p>${esc(String(articles.length))} peer-reviewed article${articles.length === 1 ? '' : 's'} published in ${esc(journalTitle)}, all open access under CC BY 4.0. Browse by issue on the <a href="../issues/index.html">issues page</a>.</p>
</header>
<ol class="ja-list">${items}
</ol>`;
  };

  // ---- Emit ---------------------------------------------------------------
  const out = [{ path: 'articles/article.css', html: ARTICLE_CSS }];

  for (const a of articles) {
    const slug = slugOf(a);
    out.push({
      path: `articles/${slug}.html`,
      html: layout(a.title, articleBody(a, slug), { active: '', head: headOf(a, slug), depth: 1 }),
    });
    out.push({ path: `articles/${slug}.bib`, html: bibtexOf(a) });
    out.push({ path: `articles/${slug}.ris`, html: risOf(a) });
  }

  const indexHead = [
    `<link rel="canonical" href="${esc(`${journalUrl}/articles/index.html`)}">`,
    `<meta name="description" content="${esc(`Browse all ${articles.length} peer-reviewed, open-access articles published in ${journalTitle}.`)}">`,
    `<link rel="stylesheet" href="article.css">`,
  ].join('\n');
  out.push({ path: 'articles/index.html', html: layout('Articles', indexBody(), { active: '', head: indexHead, depth: 1 }) });

  return out;
}
