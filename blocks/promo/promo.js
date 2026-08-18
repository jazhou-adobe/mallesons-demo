import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * loads and decorates the promo block
 * each item renders as a full-width band split 50/50 between a solid-colour
 * text panel and an image; a single item is a feature banner, while two or
 * more items stack as alternating (zig-zag) bands
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
