/**
 * CTA band — a centred, full-bleed heading + button banner.
 *
 * Authored structure (rows):
 *   row 1 -> heading (h1-h6)
 *   row 2 -> CTA button (a link wrapped in <strong>)
 *
 * @param {Element} block The cta-band block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    row.className = cell.querySelector('h1, h2, h3, h4, h5, h6') ? 'cta-band-heading' : 'cta-band-cta';
  });
}
