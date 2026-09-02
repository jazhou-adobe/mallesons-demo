import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Topic hero — a lavender brand band with a rule-framed serif title and an
 * optional decorative brand pattern bleeding off the right edge.
 *
 * Authored structure (two rows):
 *   row 1 -> the title (heading)
 *   row 2 -> an optional picture used as the right-edge pattern
 *
 * @param {Element} block The topic-hero block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    if (row.querySelector('picture')) {
      row.className = 'topic-hero-media';
      const img = row.querySelector('picture > img');
      if (img) {
        row.replaceChildren(createOptimizedPicture(img.src, img.alt || '', false, [{ width: '750' }]));
      }
    } else {
      row.className = 'topic-hero-text';
    }
  });
}
