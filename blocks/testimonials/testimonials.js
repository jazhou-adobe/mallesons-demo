import { decorateIcons } from '../../scripts/aem.js';

/**
 * Testimonials — a paged carousel of quote cards.
 *
 * Authored structure (rows):
 *   row 1    -> heading (h2, e.g. "Testimonials")
 *   row 2..n -> one quote: `<p>Quote text</p><p><strong>Citation</strong></p>`
 *
 * Cards are grouped into pages of two; prev/next buttons page through them.
 *
 * @param {Element} block The testimonials block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const headingRow = rows.shift();
  const headingEl = headingRow?.querySelector('h1, h2, h3, h4, h5, h6');
  if (headingEl) headingEl.className = 'testimonials-heading';

  const cards = rows.map((row) => {
    const cell = row.querySelector(':scope > div') || row;
    const card = document.createElement('div');
    card.className = 'testimonials-card';

    const icon = document.createElement('span');
    icon.className = 'icon icon-quote';
    card.append(icon);

    while (cell.firstElementChild) card.append(cell.firstElementChild);
    const paras = [...card.querySelectorAll('p')];
    if (paras[0]) paras[0].className = 'testimonials-quote';
    if (paras[1]) paras[1].className = 'testimonials-citation';
    return card;
  });

  const pageSize = 2;
  const pages = [];
  for (let i = 0; i < cards.length; i += pageSize) {
    const page = document.createElement('div');
    page.className = 'testimonials-page';
    cards.slice(i, i + pageSize).forEach((c) => page.append(c));
    pages.push(page);
  }

  const track = document.createElement('div');
  track.className = 'testimonials-track';
  pages.forEach((p) => track.append(p));

  const viewport = document.createElement('div');
  viewport.className = 'testimonials-viewport';
  viewport.append(track);

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'testimonials-prev';
  prev.setAttribute('aria-label', 'Previous testimonials');
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'testimonials-next';
  next.setAttribute('aria-label', 'Next testimonials');

  let index = 0;
  const go = (delta) => {
    index = (index + delta + pages.length) % pages.length;
    track.style.transform = `translateX(${index * -100}%)`;
  };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  if (pages.length <= 1) {
    prev.hidden = true;
    next.hidden = true;
  }

  const row = document.createElement('div');
  row.className = 'testimonials-row';
  row.append(prev, viewport, next);

  block.replaceChildren();
  if (headingEl) block.append(headingEl);
  block.append(row);
  decorateIcons(block);
}
