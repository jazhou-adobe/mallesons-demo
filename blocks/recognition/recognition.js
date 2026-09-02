import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Recognition — a full-bleed band of centred award/ranking badges.
 *
 * Authored structure (rows):
 *   row 1    -> heading (a single column containing an h1-h6)
 *   row 2..n -> one badge: an icon column (a picture) and a text column
 *               (a bold title line, then an org line)
 *
 * Each badge row uses TWO columns (icon, text) rather than one flat cell —
 * a flat cell mixing a picture with multiple paragraphs gets re-wrapped by
 * aem.js's wrapTextNodes() heuristic (it always treats a multi-child picture
 * cell as loose inline content), which would corrupt the paragraph order.
 *
 * @param {Element} block The recognition block element
 */
export default function decorate(block) {
  const grid = document.createElement('div');
  grid.className = 'recognition-grid';

  [...block.children].forEach((row) => {
    const cols = [...row.children];
    const soleHeading = cols.length === 1 ? cols[0].querySelector('h1, h2, h3, h4, h5, h6') : null;
    if (soleHeading) {
      soleHeading.className = 'recognition-heading';
      block.append(soleHeading);
      row.remove();
      return;
    }

    const [iconCol, textCol] = cols;
    const item = document.createElement('div');
    item.className = 'recognition-item';

    const img = iconCol?.querySelector('picture > img');
    if (img) {
      iconCol.querySelector('picture').replaceWith(createOptimizedPicture(img.src, img.alt || '', false, [{ width: '64' }]));
    }
    const icon = iconCol?.querySelector('picture');
    if (icon) { icon.className = 'recognition-icon'; item.append(icon); }

    const paras = textCol ? [...textCol.querySelectorAll(':scope > p')] : [];
    if (paras[0]) { paras[0].className = 'recognition-title'; item.append(paras[0]); }
    if (paras[1]) { paras[1].className = 'recognition-org'; item.append(paras[1]); }

    grid.append(item);
    row.remove();
  });

  block.append(grid);
}
