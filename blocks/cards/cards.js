import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  // per-card CTA (e.g. "Discover Now") — a closing paragraph whose only
  // child is a link — gets a trailing arrow-in-circle icon
  ul.querySelectorAll('.cards-card-body > p:last-child > a:only-child').forEach((a) => {
    const icon = document.createElement('span');
    icon.className = 'icon icon-arrow-circle';
    a.append(icon);
  });
  decorateIcons(ul);
  block.replaceChildren(ul);
}
