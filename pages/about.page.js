// pages/about.page.js — Unit 8 (journal-for-authors).
// Emits: about/index.html  (aims & scope, journal information, editorial board)
//        about/policies.html (peer review, open access, ethics, archiving)
//
// The visual language comes from styles/journal.css (scoped under .page-journal);
// PAGE_CSS below only re-sizes it for pages that live inside the jr-main shell
// and adds the small u8-* components (fact grid, board list, CTA row).
// PAGE_CSS and CATEGORIES are also imported by pages/for-authors.page.js (same unit).

export const PAGE_CSS = `<style>
  /* Contain the notebook-grid backdrop to the page body (journal.css draws it
     fixed across the viewport, which is meant for full-bleed pages). */
  .page-journal::before, .page-journal::after { position: absolute; }
  .page-journal .section { padding: clamp(2.25rem, 5vw, 3.75rem) clamp(0.25rem, 1.5vw, 1.25rem); border-bottom: 1px solid var(--line); }
  .page-journal .section:last-child { border-bottom: 0; }
  .page-journal .section-head { margin: 0 0 clamp(1.5rem, 3vw, 2.25rem); }
  .page-journal .section-title { font-size: clamp(1.6rem, 3.2vw, 2.4rem) !important; }
  .page-journal .u8-page-title { font-size: clamp(2.2rem, 5vw, 3.4rem) !important; }
  .page-journal .u8-lede { max-width: 46rem; }
  .page-journal .u8-prose p { max-width: 46rem; font-size: 1rem; line-height: 1.7; margin: 0 0 1.1rem; }
  .page-journal .u8-prose p:last-child { margin-bottom: 0; }
  .page-journal .u8-note { font-size: 0.88rem; color: var(--fg-subtle); max-width: 46rem; margin: 1.1rem 0 0; line-height: 1.6; }
  .page-journal .u8-toc { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; margin: 0; padding: 0; list-style: none; }
  .page-journal .u8-toc a { font-family: var(--jb-font-mono); font-size: 0.72rem; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; color: var(--accent-muted); text-decoration: none; }
  .page-journal .u8-toc a:hover { text-decoration: underline; text-underline-offset: 3px; }
  .page-journal .u8-facts { display: flex; flex-wrap: wrap; gap: 1px; background: var(--line); border: 1px solid var(--line); margin: 0; }
  .page-journal .u8-fact { flex: 1 1 13rem; min-width: min(100%, 13rem); background: var(--bg); padding: 1rem 1.15rem; margin: 0; }
  .page-journal .u8-fact dt { font-family: var(--jb-font-mono); font-size: 0.66rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--fg-subtle); margin: 0 0 0.4rem; }
  .page-journal .u8-fact dd { margin: 0; color: var(--fg); font-weight: 600; font-size: 0.95rem; line-height: 1.5; }
  .page-journal .u8-fact dd a { color: inherit; }
  .page-journal .u8-board-group { margin-top: clamp(1.75rem, 4vw, 2.5rem); }
  .page-journal .u8-board-group:first-of-type { margin-top: 0; }
  .page-journal .u8-board-list { list-style: none; margin: 1rem 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 1px; background: var(--line); border: 1px solid var(--line); }
  .page-journal .u8-board-list li { flex: 1 1 13rem; min-width: min(100%, 13rem); background: var(--bg); padding: 0.85rem 1rem; }
  .page-journal .u8-board-name { display: block; font-family: var(--jb-font-display); font-weight: 700; letter-spacing: -0.02em; color: var(--fg); }
  .page-journal .u8-board-sect { display: block; margin-top: 0.3rem; font-family: var(--jb-font-mono); font-size: 0.64rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent-muted); }
  .page-journal .u8-cta-row { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem 1.75rem; margin-top: 1.75rem; }
  .page-journal .u8-cta { background: var(--accent) !important; color: var(--accent-fg) !important; border-color: var(--accent) !important; }
  .page-journal .u8-cta:hover { background: var(--fg) !important; color: var(--bg) !important; border-color: var(--fg) !important; }
  .page-journal .u8-gap-top { margin-top: 1.75rem; }
</style>`;

// Mirrors the dashboard's submission categories (no public data endpoint exists
// for these yet; update here if the dashboard's CATEGORIES list changes).
export const CATEGORIES = [
  'Biology', 'Chemistry', 'Physics', 'Mathematics',
  'Computer Science', 'Humanities', 'Economics', 'Psychology',
];

// The journal's editorial board (names as seeded in the Synthica dashboard).
const BOARD = {
  chief: [{ name: 'Quang Bui', section: 'All sections' }],
  senior: [
    { name: 'Dr. Helen Ward', section: 'Biology' },
    { name: 'Dr. Omar Aziz', section: 'Computer Science' },
    { name: 'Dr. Sofia Marin', section: 'Physics' },
    { name: 'Dr. Ken Adeyemi', section: 'Chemistry' },
  ],
  associate: [
    { name: 'Jonah Reid', section: 'Biology' },
    { name: 'Mia Klein', section: 'Computer Science' },
    { name: 'Diego Cruz', section: 'Physics' },
    { name: 'Nadia Farouk', section: 'Chemistry' },
  ],
  reviews: [
    { name: 'Rina Patel', section: 'Biology' },
    { name: 'Marco Silva', section: 'Biology' },
    { name: 'Wei Chen', section: 'Computer Science' },
    { name: 'Asha Rao', section: 'Computer Science' },
    { name: 'Tomás Vargas', section: 'Physics' },
    { name: 'Lena Hoff', section: 'Physics' },
    { name: 'Yuki Mori', section: 'Chemistry' },
    { name: 'Priya Nair', section: 'Chemistry' },
  ],
};

export default async function build({ config, data, layout, esc }) {
  const meta = data.meta || {};
  const journalTitle = meta.title || config.title;
  const publisher = meta.publisher || config.publisher;
  const frequency = meta.frequency || config.frequency;
  const issnRaw = meta.issn ?? config.issn;
  const issn = issnRaw && issnRaw !== 'pending' ? issnRaw : null;
  const doiPrefix = meta.doiPrefix || config.doiPrefix;
  const license = meta.license || config.license;
  const licenseUrl = config.licenseUrl;
  const contactEmail = config.contactEmail;
  const firstYear = config.firstYear;
  const publisherUrl = config.publisherUrl;

  const issnDisplay = issn ? `ISSN ${esc(issn)} (online)` : 'ISSN pending assignment';

  const boardGroup = (heading, blurb, people) => `
      <div class="u8-board-group">
        <h3 class="journal-process-heading">${esc(heading)}</h3>
        <p class="journal-process-lead">${blurb}</p>
        <ul class="u8-board-list">
          ${people.map((p) => `<li><span class="u8-board-name">${esc(p.name)}</span><span class="u8-board-sect">${esc(p.section)}</span></li>`).join('\n          ')}
        </ul>
      </div>`;

  const fact = (label, value) => `
        <div class="u8-fact"><dt>${esc(label)}</dt><dd>${value}</dd></div>`;

  // -------------------------------------------------------------------------
  // about/index.html
  // -------------------------------------------------------------------------
  const indexBody = `
<div class="page-journal">

  <section class="section">
    <div class="section-head">
      <span class="section-badge">About the journal</span>
      <h1 class="section-title u8-page-title">Aims &amp; scope</h1>
      <p class="section-subtitle u8-lede">${esc(journalTitle)} is an open-access, peer-reviewed journal
      publishing original research by high-school and early-career scientists.</p>
    </div>
    <div class="u8-prose">
      <p>Serious research does not begin with a doctorate. ${esc(journalTitle)} exists to give
      young researchers the same thing established journals give their authors: rigorous editorial
      review, a permanent citable record, and readers. We publish full research <strong>Articles</strong>,
      shorter <strong>Letters</strong>, and methods-focused <strong>Analyses</strong> — work with a clear
      question, a sound method, honest evidence, and a conclusion the evidence supports.</p>
      <p>Every submission is reviewed by editors in its subject area through a five-stage editorial
      pipeline, described in our <a href="policies.html#peer-review">peer-review policy</a>. Accepted
      articles are published open access under ${esc(license)}, receive a DOI, and appear in the
      journal's quarterly issues.</p>
    </div>
    <div class="card journal-req-card u8-gap-top">
      <h3 class="journal-process-heading">Subject categories</h3>
      <p class="journal-process-lead">The journal publishes in eight categories. Each manuscript is
      submitted to one category and is handled by that section's editors.</p>
      <ul class="journal-req-list journal-req-list--cols">
        ${CATEGORIES.map((c) => `<li>${esc(c)}</li>`).join('\n        ')}
      </ul>
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <span class="section-badge">Journal information</span>
      <h2 class="section-title">The journal at a glance</h2>
    </div>
    <dl class="u8-facts">
      ${fact('Publisher', `<a href="${esc(publisherUrl)}">${esc(publisher)}</a>`)}
      ${fact('Frequency', `${esc(frequency)} — four issues per volume`)}
      ${fact('ISSN', issnDisplay)}
      ${fact('DOI prefix', esc(doiPrefix))}
      ${fact('Access & license', `Open access — <a href="${esc(licenseUrl)}" rel="license">${esc(license)}</a>`)}
      ${fact('First volume', `Volume 1 (${esc(String(firstYear))})`)}
      ${fact('Fees', 'None — free to submit, publish, and read')}
      ${fact('Contact', `<a href="mailto:${esc(contactEmail)}">${esc(contactEmail)}</a>`)}
    </dl>
    <p class="u8-note">Every article receives a DOI under the ${esc(doiPrefix)} prefix at publication.
    ${issn ? 'The journal is registered under the ISSN shown above.' : 'An ISSN application is in progress; the masthead will show the assigned number once it is issued.'}
    Details on identifiers, issue numbering, and archiving are in the
    <a href="policies.html#archiving">policies</a>.</p>
  </section>

  <section class="section">
    <div class="section-head">
      <span class="section-badge">People</span>
      <h2 class="section-title">Editorial board</h2>
      <p class="section-subtitle u8-lede">Four editorial roles share responsibility for every published
      article, mirroring the five review stages a manuscript passes through. Editors act within their
      own section; further section editors are appointed as the journal grows.</p>
    </div>

    ${boardGroup('Editor-in-Chief', `Holds final editorial responsibility for the journal. Every
    manuscript that completes review is accepted — or declined — by the Editor-in-Chief's sign-off,
    and the editorial policies on this site are maintained under their authority.`, BOARD.chief)}

    ${boardGroup('Senior Editors', `Screen manuscripts after the first review for scope, rigor, and
    fit, and perform the final pre-acceptance check once revisions are complete. One Senior Editor
    oversees each active section.`, BOARD.senior)}

    ${boardGroup('Associate Editors', `The authors' main editorial contact. An Associate Editor works
    directly with the authors through up to two structured revision rounds, consolidating editorial
    comments and assessing each revised manuscript.`, BOARD.associate)}

    ${boardGroup('Reviews Editors', `The first readers of every submission. Two Reviews Editors from
    the manuscript's section read each new submission independently, and both must recommend it for
    the manuscript to advance.`, BOARD.reviews)}

    <p class="u8-note">Issue assembly and DOI registration are handled by the journal's Director,
    Quang Bui, on behalf of ${esc(publisher)}. Enquiries to the board can be sent to
    <a href="mailto:${esc(contactEmail)}">${esc(contactEmail)}</a>.</p>
  </section>

  <section class="section">
    <div class="section-head">
      <span class="section-badge">Read on</span>
      <h2 class="section-title">Policies and submissions</h2>
      <p class="section-subtitle u8-lede">Our editorial policies describe how manuscripts are reviewed,
      licensed, and archived. If you are considering submitting your own work, the author pages walk
      through the whole process.</p>
    </div>
    <div class="u8-cta-row">
      <a class="btn btn-secondary" href="policies.html">Editorial policies</a>
      <a class="btn btn-primary" href="../for-authors/index.html">How to submit</a>
      <a class="btn btn-primary" href="../issues/index.html">Browse issues</a>
    </div>
  </section>

</div>`;

  // -------------------------------------------------------------------------
  // about/policies.html
  // -------------------------------------------------------------------------
  const stage = (num, title, body) => `
        <li class="journal-phase">
          <span class="journal-phase-num">${esc(num)}</span>
          <div class="journal-phase-body">
            <h4>${title}</h4>
            <p>${body}</p>
          </div>
        </li>`;

  const policiesBody = `
<div class="page-journal">

  <section class="section">
    <div class="section-head">
      <span class="section-badge">About the journal</span>
      <h1 class="section-title u8-page-title">Editorial policies</h1>
      <p class="section-subtitle u8-lede">How ${esc(journalTitle)} reviews manuscripts, licenses what it
      publishes, holds authors and editors to account, and keeps the record permanent.</p>
    </div>
    <ul class="u8-toc">
      <li><a href="#peer-review">Peer review</a></li>
      <li><a href="#open-access">Open access &amp; licensing</a></li>
      <li><a href="#ethics">Publication ethics</a></li>
      <li><a href="#archiving">Archiving &amp; identifiers</a></li>
    </ul>
  </section>

  <section class="section" id="peer-review">
    <div class="section-head">
      <span class="section-badge">Policy 1</span>
      <h2 class="section-title">Peer review</h2>
      <p class="section-subtitle u8-lede">Every manuscript passes through five editorial stages before
      acceptance. Review is conducted by the journal's category editors — each stage is handled by
      editors of the manuscript's own subject section — and authors follow their manuscript's progress
      live from the Synthica dashboard.</p>
    </div>
    <div class="card journal-process-card">
      <ol class="journal-phases">
        ${stage('Stage 1', 'Dual first review', `Two Reviews Editors from the manuscript's section read
        the submission independently. <strong>Both readers must recommend the manuscript</strong> for it
        to advance — a single-reader pass is not enough. This double-reader consensus is deliberate: it
        keeps early decisions from resting on one person's judgement.`)}
        ${stage('Stage 2', 'Senior screening', `A Senior Editor screens the manuscript for scope, rigor,
        and fit with the journal before detailed editorial work begins.`)}
        ${stage('Stage 3', 'Associate editing and revisions', `An Associate Editor works directly with the
        authors through <strong>up to two revision rounds</strong>. Each round, the editor sends
        consolidated comments; the authors revise and resubmit from their dashboard workspace.`)}
        ${stage('Stage 4', 'Senior final check', `The Senior Editor verifies that revisions resolve the
        editorial concerns and that the manuscript meets the journal's standards.`)}
        ${stage('Stage 5', 'Editor-in-Chief sign-off', `The Editor-in-Chief makes the final acceptance
        decision on every manuscript.`)}
        ${stage('Publication', 'DOI and issue', `After acceptance, the journal's Director registers the
        article's DOI and publishes it into the open quarterly issue. Publication follows acceptance
        directly — articles do not wait for an issue date.`)}
      </ol>
    </div>
    <p class="u8-note">A manuscript may be declined at any stage; authors are notified with the editors'
    reasons. Editors recuse themselves from manuscripts where they have a personal, supervisory, or
    institutional conflict of interest. Authors may appeal a decision once, in writing, to
    <a href="mailto:${esc(contactEmail)}">${esc(contactEmail)}</a>; appeals are considered by the
    Editor-in-Chief, whose decision is final.</p>
  </section>

  <section class="section" id="open-access">
    <div class="section-head">
      <span class="section-badge">Policy 2</span>
      <h2 class="section-title">Open access &amp; licensing</h2>
    </div>
    <div class="u8-prose">
      <p>${esc(journalTitle)} is a fully open-access journal. Every article is free to read from the
      moment it is published — no subscriptions, no embargoes, no reader charges. The journal also
      charges authors nothing: there are no submission fees and no article-processing charges.</p>
      <p>Articles are published under the <a href="${esc(licenseUrl)}" rel="license">Creative Commons
      Attribution 4.0 International license (${esc(license)})</a>. <strong>Authors retain copyright</strong>
      in their work and grant the journal the right of first publication. Under ${esc(license)}, anyone
      may share, reuse, and build on a published article — including commercially — provided the
      original authors and source are credited and the DOI is cited.</p>
      <p>Because authors keep their rights, they may deposit any version of their article in
      repositories, on preprint servers, or on personal and institutional sites, without asking the
      journal's permission.</p>
    </div>
  </section>

  <section class="section" id="ethics">
    <div class="section-head">
      <span class="section-badge">Policy 3</span>
      <h2 class="section-title">Publication ethics</h2>
      <p class="section-subtitle u8-lede">The journal publishes work by researchers at the start of
      their careers, which makes honest practice more important, not less. These expectations apply to
      every submission.</p>
    </div>
    <div class="card journal-req-card">
      <ul class="journal-req-list">
        <li><strong>Originality.</strong> Submissions must be the authors' own unpublished work and must
        not be under consideration elsewhere. Text, data, figures, and ideas taken from other sources —
        including the authors' own earlier work — must be clearly attributed. Editors screen for
        plagiarism at review.</li>
        <li><strong>Authorship.</strong> Everyone listed as an author must have contributed substantially
        to the work and approved the submitted manuscript; nobody who meets that bar may be left off.
        Honorary, gift, and ghost authorship are all misconduct. Author order is agreed among the
        authors before submission.</li>
        <li><strong>Data honesty.</strong> Fabricating or falsifying data, selectively omitting results,
        or manipulating images beyond whole-image adjustments is misconduct. Authors must retain their
        underlying data and, where possible, state in the manuscript where it can be found (see the
        <a href="../for-authors/guidelines.html">manuscript guidelines</a> on data availability).</li>
        <li><strong>AI use.</strong> Generative AI tools cannot be authors. Any substantive use of such
        tools must be disclosed in the manuscript, and authors remain fully responsible for the accuracy
        and originality of all content. Details are in the manuscript guidelines.</li>
        <li><strong>Misconduct handling.</strong> Concerns about a submission or a published article can
        be raised confidentially at <a href="mailto:${esc(contactEmail)}">${esc(contactEmail)}</a>. The
        editors investigate, giving the authors the chance to respond. Outcomes range from correction to
        retraction; retracted articles remain online, clearly marked as retracted, with their DOI intact,
        so the record stays traceable.</li>
      </ul>
    </div>
  </section>

  <section class="section" id="archiving">
    <div class="section-head">
      <span class="section-badge">Policy 4</span>
      <h2 class="section-title">Archiving &amp; identifiers</h2>
    </div>
    <div class="u8-prose">
      <p><strong>DOIs.</strong> Every article receives a Digital Object Identifier at publication,
      registered under the journal's prefix <strong>${esc(doiPrefix)}</strong> (for example,
      ${esc(doiPrefix)}/synthica.${esc(String(firstYear))}.0001) and resolvable at doi.org. Article
      metadata — title, authors, abstract, license, and references — is deposited with the DOI
      registration, and article pages carry full bibliographic metadata, including Google Scholar
      citation tags.</p>
      <p><strong>ISSN.</strong> ${issn
        ? `The journal is registered as ISSN ${esc(issn)} (online), shown in the masthead and on every issue.`
        : `An ISSN application for the journal is in progress. Until it is assigned, the masthead shows
      &ldquo;ISSN pending&rdquo;; the number will appear there and on all issue pages once issued.
      Publisher, frequency, and numbering are maintained to the serial standard throughout.`}</p>
      <p><strong>Volumes and issues.</strong> The journal is published ${esc(String(frequency).toLowerCase())} by
      ${esc(publisher)}. Volumes are annual — Volume 1 covers ${esc(String(firstYear))} — and each volume
      contains four quarterly issues. Accepted articles are published into the volume's open issue as
      soon as they are ready, and pages are numbered continuously within each volume, so citations are
      stable from the day an article appears.</p>
      <p><strong>Permanence.</strong> Published articles are not removed. The journal is a statically
      archived, openly hosted publication: every article page and PDF remains available at its
      DOI-resolved address, and the site's full publication history is retained under version control.
      Corrections and retractions are appended to the record rather than replacing it.</p>
    </div>
  </section>

</div>`;

  const indexHead = `${PAGE_CSS}
<meta name="description" content="Aims and scope, journal information, and the editorial board of ${esc(journalTitle)} — peer-reviewed, open-access research by high-school and early-career scientists.">`;
  const policiesHead = `${PAGE_CSS}
<meta name="description" content="Editorial policies of ${esc(journalTitle)}: five-stage peer review, open access under ${esc(license)}, publication ethics, and archiving with DOIs.">`;

  return [
    { path: 'about/index.html', html: layout('About', indexBody, { active: 'about', head: indexHead, depth: 1 }) },
    { path: 'about/policies.html', html: layout('Editorial policies', policiesBody, { active: 'about', head: policiesHead, depth: 1 }) },
  ];
}
