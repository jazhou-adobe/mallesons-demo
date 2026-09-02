/**
 * Insight collection — a curated grid of insight cards authored directly in the
 * page (as opposed to the data-driven `insight-list` block). Each block row is
 * one card whose single cell holds an optional category eyebrow, a linked
 * heading, a date and a summary:
 *
 *   | <p>Insight</p><h3><a href>Title</a></h3><p>27 August 2026</p><p>Summary…</p> |
 *
 * The eyebrow paragraph is optional — any `<p>` authored before the heading is
 * treated as the eyebrow; existing collections with no such paragraph are
 * unaffected (title/date/summary classification is unchanged).
 *
 * More than `COLLAPSED_COUNT` cards get a "Show more / Show less" toggle —
 * every card stays in the DOM (so a full-content audit still finds every
 * link), only the extras are visually hidden until expanded.
 *
 * @param {Element} block The insight-collection block element
 */
const COLLAPSED_COUNT = 6;

export default function decorate(block) {
  const grid = document.createElement('div');
  grid.className = 'insight-collection-grid';

  [...block.children].forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    const card = document.createElement('div');
    card.className = 'insight-collection-card';

    let sawTitle = false;
    let sawDate = false;
    [...cell.children].forEach((el) => {
      if (/^H[1-6]$/.test(el.tagName)) {
        el.className = 'insight-collection-title';
        const link = el.querySelector('a');
        if (link) card.dataset.href = link.getAttribute('href');
        sawTitle = true;
      } else if (el.tagName === 'P') {
        if (!sawTitle) el.className = 'insight-collection-eyebrow';
        else if (!sawDate) { el.className = 'insight-collection-date'; sawDate = true; } else el.className = 'insight-collection-summary';
      }
    });

    while (cell.firstElementChild) card.append(cell.firstElementChild);
    grid.append(card);
  });

  // whole-card affordance: activate the title link when the card is clicked
  grid.querySelectorAll('.insight-collection-card[data-href]').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      const link = card.querySelector('.insight-collection-title a');
      if (link) link.click();
    });
  });

  block.replaceChildren(grid);

  const cards = [...grid.children];
  if (cards.length > COLLAPSED_COUNT) {
    cards.slice(COLLAPSED_COUNT).forEach((card) => card.classList.add('insight-collection-hidden'));

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'insight-collection-toggle';
    toggle.textContent = 'Show More';
    toggle.addEventListener('click', () => {
      const expanded = toggle.classList.toggle('insight-collection-toggle-expanded');
      cards.slice(COLLAPSED_COUNT).forEach((card) => card.classList.toggle('insight-collection-hidden', !expanded));
      toggle.textContent = expanded ? 'Show Less' : 'Show More';
    });
    block.append(toggle);
  }
}
