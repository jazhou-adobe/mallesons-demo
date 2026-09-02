/**
 * Insight collection — a curated grid of insight cards authored directly in the
 * page (as opposed to the data-driven `insight-list` block). Each block row is
 * one card whose single cell holds a linked heading, a date and a summary:
 *
 *   | <h3><a href>Title</a></h3><p>27 August 2026</p><p>Summary…</p> |
 *
 * @param {Element} block The insight-collection block element
 */
export default function decorate(block) {
  const grid = document.createElement('div');
  grid.className = 'insight-collection-grid';

  [...block.children].forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    const card = document.createElement('div');
    card.className = 'insight-collection-card';

    const title = cell.querySelector('h1, h2, h3, h4, h5, h6');
    if (title) {
      title.className = 'insight-collection-title';
      const link = title.querySelector('a');
      if (link) card.dataset.href = link.getAttribute('href');
    }
    // the first non-heading paragraph is the date, the rest the summary
    const paras = [...cell.querySelectorAll(':scope > p')];
    if (paras[0]) paras[0].className = 'insight-collection-date';
    paras.slice(1).forEach((p) => { p.className = 'insight-collection-summary'; });

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
}
