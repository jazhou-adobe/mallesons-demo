import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * loads and decorates the feature block: an image beside an eyebrow,
 * heading, copy and a call to action.
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
  });
  block.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '600' }]));
  });
}
