import { decorateIcons } from '../../scripts/aem.js';

/**
 * Sidebar links — a practice-page rail: an optional CTA button, a small bold
 * heading, a dynamically-built list of the sibling pages in the current page's
 * folder, and a final "explore all" link with a trailing arrow icon.
 *
 * Authored structure (rows, order-independent):
 *   - CTA button   (a link wrapped in <strong>, e.g. "Meet Our Team")
 *   - heading      (h1-h6)
 *   - folder path  (a plain-text relative path, e.g. /au/en/expertise/practices)
 *   - explore link (a plain link, e.g. "Explore All Expertise")
 *
 * The related-links list is NOT authored: it is generated at runtime from
 * /query-index.json, listing the published pages that live directly in the
 * authored folder path. When no folder path is authored, it falls back to the
 * current page's own folder. The current page is included and marked active;
 * any extra authored link rows (legacy hard-coded lists) are dropped.
 *
 * decorateButtons() (scripts.js) runs on `main` before this block decorates,
 * so a strong-wrapped CTA link has already become `<a class="button primary">`
 * by the time this function runs.
 *
 * @param {Element} block The sidebar-links block element
 */

/** Folder that contains `path`, with a trailing slash. */
function folderOf(path) {
  return path.endsWith('/') ? path : path.slice(0, path.lastIndexOf('/') + 1);
}

/** Human label for an index row: prefer an authored navtitle, else the
 *  leading segment of the og:title (before the site-name separator). */
function labelFor(row) {
  if (row.navtitle) return row.navtitle;
  return (row.title || '').split('|')[0].trim();
}

/**
 * Fetch the pages that live directly in `folderPath` (or, when omitted, in the
 * current page's own folder).
 * @param {string} currentPath location.pathname of the current page
 * @param {string} [folderPath] explicit folder to list, e.g. /au/en/expertise/practices
 * @returns {Promise<Array<{href: string, label: string, current: boolean}>>}
 */
async function fetchSiblings(currentPath, folderPath) {
  const folder = folderPath
    ? `${folderPath.replace(/\/$/, '')}/`
    : folderOf(currentPath);
  try {
    const resp = await fetch('/query-index.json');
    if (!resp.ok) return [];
    const { data = [] } = await resp.json();
    return data
      .filter((row) => {
        if (!row.path || !row.path.startsWith(folder)) return false;
        // direct children of the folder only (no deeper nesting, no the folder itself)
        const rest = row.path.slice(folder.length);
        return rest.length > 0 && !rest.includes('/');
      })
      .map((row) => ({
        href: row.path,
        label: labelFor(row),
        current: row.path === currentPath,
      }))
      .filter((row) => row.label)
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch {
    return [];
  }
}

export default async function decorate(block) {
  // classify authored rows: CTA button, heading, folder-path param, link rows
  const linkRows = [];
  let folderPath = null;
  [...block.children].forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    if (cell.querySelector('a.button')) {
      row.className = 'sidebar-links-cta';
    } else if (cell.querySelector('h1, h2, h3, h4, h5, h6')) {
      row.className = 'sidebar-links-heading';
    } else if (cell.querySelector('a')) {
      linkRows.push(row);
    } else {
      // a plain-text row holding the folder to list (e.g. /au/en/expertise/practices)
      const text = cell.textContent.trim();
      if (text.startsWith('/')) folderPath = text;
      row.remove();
    }
  });

  // the last plain-link row is the "explore all" CTA; earlier authored link
  // rows (legacy hard-coded lists) are discarded in favour of the dynamic list
  const exploreRow = linkRows.pop() || null;
  linkRows.forEach((row) => row.remove());

  // build the dynamic list of pages in the authored folder (default: this
  // page's own folder), marking the current page active
  const list = document.createElement('ul');
  list.className = 'sidebar-links-list';
  const siblings = await fetchSiblings(window.location.pathname, folderPath);
  siblings.forEach((sibling) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = sibling.href;
    a.textContent = sibling.label;
    if (sibling.current) {
      li.className = 'sidebar-links-active';
      a.setAttribute('aria-current', 'page');
    }
    li.append(a);
    list.append(li);
  });

  // append the authored "explore all" link as the final list item
  if (exploreRow) {
    const a = (exploreRow.querySelector(':scope > div') || exploreRow).querySelector('a');
    if (a) {
      const li = document.createElement('li');
      li.className = 'sidebar-links-explore';
      const icon = document.createElement('span');
      icon.className = 'icon icon-arrow-circle';
      a.append(icon);
      li.append(a);
      list.append(li);
    }
    exploreRow.remove();
  }

  block.append(list);
  decorateIcons(block);
}
