// Placeholder home page so the repo builds green from day zero.
// The journal-core unit DELETES this file when it adds pages/home.page.js.
export default async function build({ layout, data, esc }) {
  const n = (data.articles || []).length;
  const body = `
    <section style="text-align:center; padding: 4rem 1rem;">
      <h1 style="font-size:2rem; margin-bottom:0.5rem;">Synthica Journal</h1>
      <p style="color: var(--fg-muted, #737373); max-width: 46ch; margin: 0 auto 1.5rem;">
        The journal site is being assembled. ${esc(String(n))} articles are staged and ready.
        Pages for issues, articles, and author guidelines land via pull requests.
      </p>
    </section>`;
  return [{ path: 'index.html', html: layout('Home', body, { active: 'home', depth: 0 }) }];
}
