import { decorateIcons } from '../../scripts/aem.js';

/**
 * Sidebar links — a practice-page rail: an optional CTA button, a small
 * bold heading, a list of related links, and a final link that becomes
 * the "explore all" CTA with a trailing arrow icon.
 *
 * Authored structure (rows):
 *   row 1      -> CTA button (a link wrapped in <strong>, e.g. "Meet Our Team")
 *   row 2      -> heading (h1-h6)
 *   row 3..n   -> plain links, collected into a single list; the LAST such
 *                 row becomes the "explore all" CTA
 *
 * decorateButtons() (scripts.js) runs on `main` before this block decorates,
 * so a strong-wrapped CTA link has already become `<a class="button primary">`
 * by the time this function runs.
 *
 * @param {Element} block The sidebar-links block element
 */
export default function decorate(block) {
  let list = null;
  [...block.children].forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    if (cell.querySelector('a.button')) {
      row.className = 'sidebar-links-cta';
    } else if (cell.querySelector('h1, h2, h3, h4, h5, h6')) {
      row.className = 'sidebar-links-heading';
    } else {
      if (!list) {
        list = document.createElement('ul');
        list.className = 'sidebar-links-list';
        row.replaceWith(list);
      } else {
        row.remove();
      }
      const li = document.createElement('li');
      while (cell.firstElementChild) li.append(cell.firstElementChild);
      list.append(li);
    }
  });

  if (list && list.lastElementChild) {
    const last = list.lastElementChild;
    last.classList.add('sidebar-links-explore');
    const a = last.querySelector('a');
    if (a) {
      const icon = document.createElement('span');
      icon.className = 'icon icon-arrow-circle';
      a.append(icon);
    }
  }
  decorateIcons(block);
}
