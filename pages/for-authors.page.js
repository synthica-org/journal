// pages/for-authors.page.js — Unit 8 (journal-for-authors).
// Emits: for-authors/index.html      (the submission funnel: dashboard account →
//                                     profile → My Journal submission → live tracking)
//        for-authors/guidelines.html (manuscript guidelines)
//
// Shares PAGE_CSS / CATEGORIES with pages/about.page.js (same unit) so the two
// author-facing pages and the about pages stay visually identical.

import { PAGE_CSS, CATEGORIES } from './about.page.js';

export default async function build({ config, data, layout, esc }) {
  const meta = data.meta || {};
  const journalTitle = meta.title || config.title;
  const license = meta.license || config.license;
  const licenseUrl = config.licenseUrl;
  const contactEmail = config.contactEmail;
  const doiPrefix = meta.doiPrefix || config.doiPrefix;
  const dash = (meta.dashboardUrl || config.dashboardUrl).replace(/\/$/, '');
  const registerUrl = `${dash}/register?from=journal`;
  const loginUrl = `${dash}/login?from=journal`;

  const step = (num, title, body) => `
        <li class="journal-phase">
          <span class="journal-phase-num">${esc(num)}</span>
          <div class="journal-phase-body">
            <h4>${title}</h4>
            ${body}
          </div>
        </li>`;

  const qa = (q, a) => `
      <div class="u8-faq-item">
        <h3>${esc(q)}</h3>
        <p>${a}</p>
      </div>`;

  const FAQ_CSS = `<style>
  .page-journal .u8-faq { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr)); gap: clamp(1.25rem, 3vw, 1.75rem); }
  .page-journal .u8-faq-item h3 { font-family: var(--jb-font-display); font-size: 1.02rem; font-weight: 700; letter-spacing: -0.01em; color: var(--fg); margin: 0 0 0.4rem; }
  .page-journal .u8-faq-item p { margin: 0; font-size: 0.95rem; line-height: 1.65; }
  .page-journal .u8-step-cta { margin-top: 0.9rem; }
</style>`;

  // -------------------------------------------------------------------------
  // for-authors/index.html — the submission funnel
  // -------------------------------------------------------------------------
  const indexBody = `
<div class="page-journal">

  <section class="section">
    <div class="section-head">
      <span class="section-badge">For authors</span>
      <h1 class="section-title u8-page-title">Publish your research</h1>
      <p class="section-subtitle u8-lede">${esc(journalTitle)} publishes peer-reviewed research by
      high-school and early-career scientists. Submitting costs nothing, everything we publish is open
      access, and the whole process — submission, review, revisions, publication — runs in one place:
      your Synthica dashboard.</p>
    </div>
    <div class="u8-cta-row">
      <a class="btn btn-secondary u8-cta" href="${esc(registerUrl)}">Create your free account</a>
      <a class="btn btn-primary" href="${esc(loginUrl)}">Already have an account? Sign in</a>
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <span class="section-badge">How it works</span>
      <h2 class="section-title">Four steps from draft to DOI</h2>
      <p class="section-subtitle u8-lede">There is no email submission and no separate manuscript
      portal. You submit from the same researcher dashboard where Synthica's projects and mentoring
      live, and your manuscript never disappears into a black box.</p>
    </div>
    <div class="card journal-process-card">
      <ol class="journal-phases">
        ${step('Step 1', 'Create your free researcher account', `
            <p>Everything starts on the Synthica dashboard. Registration takes a few minutes and costs
            nothing — no submission fees, no publication fees, ever.</p>
            <p class="u8-step-cta"><a class="btn btn-secondary u8-cta" href="${esc(registerUrl)}">Create your free researcher account</a></p>`)}
        ${step('Step 2', 'Complete your researcher profile', `
            <p>A short onboarding sets up your researcher profile — who you are, where you study or
            work, and what you research. Your profile is where your published articles will be listed,
            so it is worth the five minutes.</p>`)}
        ${step('Step 3', 'Submit your manuscript in My Journal', `
            <p>Open <strong>My Journal</strong> in your dashboard and start a submission: enter the
            title, pick one of the journal's eight subject categories, paste your abstract, and upload
            your manuscript PDF. See <a href="guidelines.html">the manuscript guidelines</a> for what
            the PDF should contain.</p>`)}
        ${step('Step 4', 'Track every review stage live', `
            <p>From the moment you submit, your dashboard shows exactly where your manuscript is —
            first review, senior screening, revision rounds with your Associate Editor, final checks,
            sign-off — and what happens next at each stage. Editor comments and revision requests
            arrive there too, so you never have to write and ask.</p>`)}
      </ol>
    </div>
    <p class="u8-note">Declines can happen at any stage and always come with the editors' reasons.
    The full pipeline is described in the <a href="../about/policies.html#peer-review">peer-review
    policy</a>.</p>
  </section>

  <section class="section">
    <div class="journal-submit-grid">
      <div class="card journal-req-card">
        <h3 class="journal-process-heading">What to prepare</h3>
        <ul class="journal-req-list">
          <li><strong>Manuscript PDF</strong> — a single file with all figures and tables included,
          structured as described in the <a href="guidelines.html">guidelines</a>.</li>
          <li><strong>Title and category</strong> — one of: ${CATEGORIES.map((c) => esc(c)).join(', ')}.</li>
          <li><strong>Abstract</strong> — plain text, up to 5,000 characters; most strong abstracts are
          150–300 words.</li>
          <li><strong>Keywords</strong> — three to six terms readers would search for.</li>
          <li><strong>References</strong> — a complete, consistently formatted reference list for every
          source that shaped the work.</li>
        </ul>
      </div>
      <div class="card journal-req-card">
        <h3 class="journal-process-heading">After acceptance</h3>
        <ul class="journal-req-list">
          <li><strong>DOI</strong> — your article is registered with a Digital Object Identifier under
          the journal's ${esc(doiPrefix)} prefix, making it permanently citable.</li>
          <li><strong>Issue assignment</strong> — the article is published into the volume's open
          quarterly issue; there is no waiting for an issue date.</li>
          <li><strong>Publication here</strong> — the article appears on this site, open access under
          <a href="${esc(licenseUrl)}" rel="license">${esc(license)}</a>, with full bibliographic
          metadata. You keep the copyright.</li>
          <li><strong>Your profile</strong> — the publication is linked to your researcher profile on
          the dashboard.</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <span class="section-badge">Timeline</span>
      <h2 class="section-title">How long does it take?</h2>
    </div>
    <div class="u8-prose">
      <p>Most manuscripts receive their first editorial decision — the dual read by two Reviews
      Editors — within a few weeks of submission. The middle of the pipeline depends mostly on
      revisions: each of the up-to-two revision rounds takes as long as the editing plus your own
      turnaround. In the common case, plan for one to three months from submission to a final
      decision.</p>
      <p>Accepted articles are published into the open quarterly issue as soon as the DOI is
      registered, so publication follows acceptance directly. These are typical times rather than
      promises — but you are never left guessing, because your dashboard always shows the stage your
      manuscript is in.</p>
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <span class="section-badge">FAQ</span>
      <h2 class="section-title">Common questions</h2>
    </div>
    <div class="u8-faq">
      ${qa('Is it free?', `Yes — completely. There are no submission fees and no article-processing
      charges, and the researcher dashboard account is free. The journal charges neither authors nor
      readers.`)}
      ${qa('Is it open access?', `Yes. Every article is published open access under
      <a href="${esc(licenseUrl)}" rel="license">${esc(license)}</a>. Anyone can read your work without
      a subscription, and you retain the copyright.`)}
      ${qa('Can teams submit?', `Yes. Co-authored work is welcome — list every co-author on the
      manuscript, in an order you have all agreed. One author submits and manages the manuscript from
      their dashboard, and all listed authors must have contributed to and approved the work (see the
      <a href="../about/policies.html#ethics">authorship policy</a>).`)}
      ${qa('What if revisions are requested?', `That is the normal path, not a bad sign. Your Associate
      Editor sends consolidated comments through the dashboard; you revise and resubmit in the same
      workspace, with up to two revision rounds. Most published articles went through at least one.`)}
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <span class="section-badge">Ready?</span>
      <h2 class="section-title">Start your submission</h2>
      <p class="section-subtitle u8-lede">Read the manuscript guidelines, then create your account —
      your manuscript can be under review this week.</p>
    </div>
    <div class="u8-cta-row">
      <a class="btn btn-secondary u8-cta" href="${esc(registerUrl)}">Create your free account</a>
      <a class="btn btn-secondary" href="guidelines.html">Manuscript guidelines</a>
      <a class="btn btn-primary" href="${esc(loginUrl)}">Already have an account? Sign in</a>
    </div>
  </section>

</div>`;

  // -------------------------------------------------------------------------
  // for-authors/guidelines.html — manuscript guidelines
  // -------------------------------------------------------------------------
  const guidelinesBody = `
<div class="page-journal">

  <section class="section">
    <div class="section-head">
      <span class="section-badge">For authors</span>
      <h1 class="section-title u8-page-title">Manuscript guidelines</h1>
      <p class="section-subtitle u8-lede">What your manuscript should contain before you submit it in
      <strong>My Journal</strong>. None of this is meant to intimidate: the editors would rather receive
      honest, clearly structured work than polished imitation.</p>
    </div>
    <ul class="u8-toc">
      <li><a href="#fit">Scope &amp; article types</a></li>
      <li><a href="#structure">Structure</a></li>
      <li><a href="#abstract">Abstract &amp; keywords</a></li>
      <li><a href="#references">References</a></li>
      <li><a href="#figures">Figures &amp; data</a></li>
      <li><a href="#ai">AI-use disclosure</a></li>
      <li><a href="#checklist">Checklist</a></li>
    </ul>
  </section>

  <section class="section" id="fit">
    <div class="section-head">
      <span class="section-badge">Guidelines 1</span>
      <h2 class="section-title">Scope and article types</h2>
    </div>
    <div class="u8-prose">
      <p>Pick the one subject category that fits your work best — it decides which section's editors
      review your manuscript: ${CATEGORIES.map((c) => esc(c)).join(', ')}. If your work genuinely
      spans two categories, choose the one whose readers you most want to reach; if in doubt, write to
      <a href="mailto:${esc(contactEmail)}">${esc(contactEmail)}</a> before submitting.</p>
      <p>The journal publishes three main formats. An <strong>Article</strong> is a full study: a
      question, methods, results, and discussion. A <strong>Letter</strong> is a short report of a
      focused result that does not need full-Article length. An <strong>Analysis</strong> examines
      methods, tools, or existing evidence rather than reporting new experimental data. Most
      submissions are Articles.</p>
    </div>
  </section>

  <section class="section" id="structure">
    <div class="section-head">
      <span class="section-badge">Guidelines 2</span>
      <h2 class="section-title">Structure</h2>
      <p class="section-subtitle u8-lede">Empirical manuscripts should follow the conventional
      IMRaD shape. The names matter less than the logic: what you asked, how you did it, what you
      found, what it means.</p>
    </div>
    <div class="card journal-req-card">
      <ul class="journal-req-list">
        <li><strong>Title page</strong> — title, every author's full name and affiliation
        (school, institution, or &ldquo;Independent Researcher&rdquo;), and keywords.</li>
        <li><strong>Abstract</strong> — a self-contained summary (see below).</li>
        <li><strong>Introduction</strong> — the question, why it matters, and what was known before.</li>
        <li><strong>Methods</strong> — in enough detail that someone else could repeat the work,
        including materials, procedures, and any statistical or computational analysis.</li>
        <li><strong>Results</strong> — what you found, with figures and tables; keep interpretation
        for the discussion.</li>
        <li><strong>Discussion</strong> — what the results mean, their limitations, and what should
        happen next.</li>
        <li><strong>Acknowledgements</strong> — mentors, facilities, funding, and any disclosed AI use
        (see below).</li>
        <li><strong>References</strong> — complete and consistently formatted.</li>
      </ul>
    </div>
    <p class="u8-note">Work in the Humanities or Mathematics may follow the structure its argument
    needs — a source-led essay or a definitions-theorem-proof paper is welcome — provided the question,
    approach, evidence, and conclusion are just as explicit.</p>
  </section>

  <section class="section" id="abstract">
    <div class="section-head">
      <span class="section-badge">Guidelines 3</span>
      <h2 class="section-title">Abstract and keywords</h2>
    </div>
    <div class="u8-prose">
      <p>The abstract is entered as plain text when you submit and may be up to
      <strong>5,000 characters</strong>, though most strong abstracts are 150–300 words. It should
      state the question, the approach, the main result (with numbers where you have them), and the
      conclusion — and be understandable without reading the paper. No citations, figures, or
      undefined abbreviations.</p>
      <p>Choose three to six <strong>keywords</strong>: the terms someone searching for your work
      would actually type.</p>
    </div>
  </section>

  <section class="section" id="references">
    <div class="section-head">
      <span class="section-badge">Guidelines 4</span>
      <h2 class="section-title">References</h2>
    </div>
    <div class="u8-prose">
      <p>Cite every source that shaped the work — papers, datasets, software, and web resources. Any
      consistent style is acceptable; the journal recommends a numbered style with authors, title,
      source, and year, with a DOI or URL where one exists. For example:</p>
      <p><em>Hughes, T. P. et al. Global warming and recurrent mass bleaching of corals. Nature 543,
      373–377 (2017).</em></p>
      <p>Accuracy matters more than formatting: editors check that references exist and say what the
      manuscript claims they say.</p>
    </div>
  </section>

  <section class="section" id="figures">
    <div class="section-head">
      <span class="section-badge">Guidelines 5</span>
      <h2 class="section-title">Figures, tables, and data availability</h2>
    </div>
    <div class="u8-prose">
      <p>Submit one <strong>PDF</strong> containing the full manuscript with figures and tables placed
      near their first mention. Number every figure and table, give each a caption that can stand
      alone, and make sure text and axes are legible at normal page size. Plots should label their
      axes and units; images should state their source if not your own.</p>
      <p>End the manuscript with a short <strong>data availability statement</strong>: where the
      underlying data and code live (a repository link), that they are available from the authors on
      request, or that all data are contained in the paper. Editors may ask to see underlying data
      during review — keep it.</p>
    </div>
  </section>

  <section class="section" id="ai">
    <div class="section-head">
      <span class="section-badge">Guidelines 6</span>
      <h2 class="section-title">AI-use disclosure</h2>
    </div>
    <div class="u8-prose">
      <p>Generative AI tools cannot be listed as authors and cannot take responsibility for a
      manuscript. If you used such tools substantively — drafting text, generating or refactoring
      analysis code, summarising literature — say so, briefly and plainly, in the Methods or
      Acknowledgements: which tool, and for what.</p>
      <p>Routine assistance (spelling and grammar checking, reference managers, translation of your
      own writing) needs no disclosure. Either way, the authors remain fully responsible for the
      accuracy, originality, and honesty of everything in the manuscript — &ldquo;the model said
      so&rdquo; is not a citation.</p>
    </div>
  </section>

  <section class="section" id="checklist">
    <div class="section-head">
      <span class="section-badge">Before you submit</span>
      <h2 class="section-title">Checklist</h2>
    </div>
    <div class="card journal-req-card">
      <ul class="journal-req-list journal-req-list--cols">
        <li>Manuscript is a single PDF with figures and tables included</li>
        <li>One subject category chosen</li>
        <li>Abstract ready as plain text, within 5,000 characters</li>
        <li>Three to six keywords chosen</li>
        <li>References complete and consistently formatted</li>
        <li>Data availability statement included</li>
        <li>AI use disclosed, if any</li>
        <li>All co-authors listed, in agreed order, and have approved the manuscript</li>
      </ul>
    </div>
    <div class="u8-cta-row">
      <a class="btn btn-secondary u8-cta" href="${esc(registerUrl)}">Create your free account</a>
      <a class="btn btn-primary" href="index.html">How submission works</a>
      <a class="btn btn-primary" href="../about/policies.html">Editorial policies</a>
    </div>
  </section>

</div>`;

  const indexHead = `${PAGE_CSS}
${FAQ_CSS}
<meta name="description" content="How to publish in ${esc(journalTitle)}: create a free researcher account on the Synthica dashboard, submit your manuscript in My Journal, and track every review stage live.">`;
  const guidelinesHead = `${PAGE_CSS}
<meta name="description" content="Manuscript guidelines for ${esc(journalTitle)}: structure, abstract and keywords, references, figures and data availability, and AI-use disclosure.">`;

  return [
    { path: 'for-authors/index.html', html: layout('For authors', indexBody, { active: 'for-authors', head: indexHead, depth: 1 }) },
    { path: 'for-authors/guidelines.html', html: layout('Manuscript guidelines', guidelinesBody, { active: 'for-authors', head: guidelinesHead, depth: 1 }) },
  ];
}
