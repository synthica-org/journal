// pages/home.page.js — journal front page (dist/index.html). Unit: journal-core.
//
// Masthead hero (title, tagline, ISSN, open-access statement), the current
// issue's table of contents, a latest-articles strip, a short about-the-journal
// strip, and the submission CTA. Issue ToCs live under issues/ (see
// pages/issues.page.js); article pages are owned by a sibling unit and are
// linked via the shared slug rule in _journal-core.lib.js.

import {
  issnDisplay,
  issnValue,
  submitUrl,
  fmtDate,
  countLabel,
  authorLine,
  pageRange,
  articleHref,
  issuePath,
  issueLabel,
  articlesOf,
  currentIssueOf,
  validIssues,
  issueArticleCount,
  headTags,
  tocRow,
} from './_journal-core.lib.js';

export default async function build(ctx) {
  const { config, data, layout, esc, slugify } = ctx;
  const meta = data.meta || {};
  // Same validity filter as pages/issues.page.js, so home only ever links to
  // issue ToCs that are actually emitted.
  const issues = validIssues(data.issues);
  const articles = Array.isArray(data.articles) ? data.articles : [];
  const P = ''; // this page renders at the site root (depth 0)

  const title = meta.title || config.title || 'Synthica Journal';
  const frequency = meta.frequency || config.frequency || 'Quarterly';
  const license = meta.license || config.license || 'CC BY 4.0';
  const licenseUrl = config.licenseUrl || 'https://creativecommons.org/licenses/by/4.0/';
  const submit = submitUrl(meta, config);

  // ---- Masthead hero -------------------------------------------------------
  const masthead = `
  <header class="jc-masthead">
    <p class="jc-kicker">${esc(issnDisplay(meta))} · Open access · ${esc(frequency)}</p>
    <h1 class="jc-masthead-title">${esc(title)}</h1>
    <p class="jc-masthead-tagline">${esc(config.tagline || 'Peer-reviewed research by high-school and early-career scientists')}.</p>
    <p class="jc-masthead-oa">Every article is peer reviewed, published open access under
      <a href="${esc(licenseUrl)}" rel="license">${esc(license)}</a>, and permanently citable with a DOI.
      Free to read, free to publish — no fees for authors or readers.</p>
    <div class="jc-actions">
      <a class="btn btn-secondary" href="${esc(submit)}">Submit your research</a>
      <a class="btn btn-primary" href="issues/index.html">Browse all issues</a>
    </div>
  </header>`;

  // ---- Current issue -------------------------------------------------------
  const current = currentIssueOf(meta, issues);
  const currentArticles = current ? articlesOf(articles, current) : [];
  const currentCount = current ? issueArticleCount(currentArticles, current, articles) : 0;
  const currentStatus = current
    ? current.publishedAt
      ? `Published ${fmtDate(current.publishedAt)}`
      : 'In progress — articles are added as they are accepted'
    : '';

  const currentSection = !current
    ? ''
    : `
  <section class="jc-section" aria-labelledby="current-issue">
    <div class="jc-section-head">
      <span class="section-badge">Current issue</span>
      <h2 class="jc-h2" id="current-issue">${esc(issueLabel(current))}${
        current.status === 'open' ? ' <span class="jc-chip">Open</span>' : ''
      }</h2>
      <p class="jc-note">${esc(currentStatus)} · ${esc(countLabel(currentCount, 'article'))}</p>
    </div>
    ${
      currentArticles.length
        ? `<ol class="jc-toc">${currentArticles.map((a) => tocRow(a, { P, esc, slugify })).join('')}
    </ol>`
        : '<p class="jc-empty">The first articles of this issue are in production — check back soon.</p>'
    }
    <p class="jc-more"><a href="${esc(issuePath(current))}">View the full issue →</a></p>
  </section>`;

  // ---- Latest articles (3 most recent by publication date) ------------------
  const latest = articles
    .filter((a) => a?.publishedAt)
    .sort((x, y) => new Date(y.publishedAt) - new Date(x.publishedAt))
    .slice(0, 3);

  // "Vol. 2 · Issue 1 · Pages 1–12" — only the parts the record actually has.
  const latestRef = (a) =>
    [
      a.volume != null && a.issue != null ? `Vol. ${esc(String(a.volume))} · Issue ${esc(String(a.issue))}` : '',
      a.pages ? `Pages ${esc(pageRange(a.pages))}` : '',
    ]
      .filter(Boolean)
      .join(' · ');

  const latestSection = !latest.length
    ? ''
    : `
  <section class="jc-section" aria-labelledby="latest-articles">
    <div class="jc-section-head">
      <span class="section-badge">Latest articles</span>
      <h2 class="jc-h2" id="latest-articles">Recently published</h2>
    </div>
    <div class="jc-latest-grid">${latest
      .map(
        (a) => `
      <article class="card jc-latest-card">
        <p class="jc-kicker">${esc(a.category || a.articleType || 'Article')} · ${esc(fmtDate(a.publishedAt))}</p>
        <h3 class="jc-latest-title"><a href="${esc(articleHref(P, a, slugify))}">${esc(a.title)}</a></h3>
        <p class="jc-latest-authors">${esc(authorLine(a.authors))}</p>
        ${latestRef(a) ? `<p class="jc-latest-ref">${latestRef(a)}</p>` : ''}
      </article>`
      )
      .join('')}
    </div>
  </section>`;

  // ---- About the journal ----------------------------------------------------
  const aboutSection = `
  <section class="jc-section" aria-labelledby="about-the-journal">
    <div class="jc-about-grid">
      <div>
        <span class="section-badge">About the journal</span>
        <h2 class="jc-h2" id="about-the-journal">Research, reviewed properly</h2>
        <p class="jc-prose">${esc(title)} publishes original research by high-school and early-career
          scientists. Every submission is handled through the Synthica editorial pipeline — editorial
          screening, double-blind peer review, and revision — before it is accepted, assigned a DOI,
          and published here.</p>
        <p class="jc-prose">The journal appears ${esc(String(frequency).toLowerCase())}, and every article is
          open access under <a href="${esc(licenseUrl)}" rel="license">${esc(license)}</a>: authors keep
          their copyright, and anyone may read, share, and build on the work.</p>
        <p class="jc-links">
          <a href="about/index.html">About the journal &amp; editorial board →</a><br>
          <a href="for-authors/index.html">Information for authors →</a>
        </p>
      </div>
      <aside class="card jc-facts" aria-label="Journal information">
        <h3 class="jc-facts-title">Journal information</h3>
        <dl>
          <dt>Publisher</dt><dd>${esc(meta.publisher || config.publisher || 'Synthica')}</dd>
          <dt>ISSN</dt><dd>${esc(issnValue(meta))}</dd>
          <dt>Frequency</dt><dd>${esc(frequency)}</dd>
          <dt>License</dt><dd>${esc(license)} · open access</dd>
          <dt>Peer review</dt><dd>Double-blind, via the Synthica editorial pipeline</dd>${
            meta.doiPrefix || config.doiPrefix
              ? `
          <dt>DOI prefix</dt><dd>${esc(meta.doiPrefix || config.doiPrefix)}</dd>`
              : ''
          }
        </dl>
      </aside>
    </div>
  </section>`;

  // ---- Submit CTA -----------------------------------------------------------
  const submitSection = `
  <section class="jc-section" aria-labelledby="submit-cta">
    <div class="submit-box jc-submit">
      <span class="submit-label">Call for papers</span>
      <h2 class="jc-h2" id="submit-cta">Have research to share?</h2>
      <p class="jc-prose">We welcome original articles, letters, and analyses from high-school and
        early-career researchers in every discipline. There are no submission or publication fees;
        peer review and publication run through the Synthica researcher dashboard.</p>
      <div class="jc-actions">
        <a class="btn btn-secondary" href="${esc(submit)}">Submit your research</a>
        <a class="btn btn-primary" href="for-authors/index.html">Read the author guidelines</a>
      </div>
      ${
        config.contactEmail
          ? `<p class="jc-note jc-submit-note">Questions before you submit? Write to the editorial office at
        <a href="mailto:${esc(config.contactEmail)}">${esc(config.contactEmail)}</a>.</p>`
          : ''
      }
    </div>
  </section>`;

  const body = `
<div class="page-journal jc-page">
${masthead}
${currentSection}
${latestSection}
${aboutSection}
${submitSection}
</div>`;

  const head = headTags({
    P,
    esc,
    meta,
    config,
    description: `${title} — ${config.tagline || 'peer-reviewed research by high-school and early-career scientists'}. Open access, ${issnDisplay(meta)}.`,
    rel: '',
  });

  return [{ path: 'index.html', html: layout('Home', body, { active: 'home', head, depth: 0 }) }];
}
