import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * loads and decorates the promo block
 * a single item renders as a full-width feature banner;
 * two or more items render as an even grid of image-backed tiles
 * @param {Element} block The promo block element
 */
export default function decorate(block) {
  const items = [...block.children];
  block.classList.add(items.length > 1 ? 'promo-grid' : 'promo-feature');
  items.forEach((item) => {
    item.classList.add('promo-item');
    [...item.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'promo-item-image';
      } else {
        div.className = 'promo-item-body';
      }
    });
  });
  block.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '1200' }]));
  });
}
