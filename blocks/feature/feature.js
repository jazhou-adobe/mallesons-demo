import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * loads and decorates the feature block: a centred eyebrow above a two-column
 * layout of copy (eyebrow-less heading, body and call to action) beside a tall
 * portrait image.
 * @param {Element} block The feature block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    [...row.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'feature-image';
      } else {
        div.className = 'feature-body';
      }
    });
    // promote the leading paragraph to a full-width, centred eyebrow
    const body = row.querySelector('.feature-body');
    const eyebrow = body?.querySelector('p:first-child');
    if (eyebrow && body.children.length > 1) {
      eyebrow.className = 'feature-eyebrow';
      row.prepend(eyebrow);
    }
  });
  block.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '600' }]));
  });
}
