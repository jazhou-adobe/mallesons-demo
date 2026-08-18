import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// labels that stay visible in the collapsed top bar; every item (primary or
// not) is still reachable from the nav overlay's rail
const PRIMARY_LABELS = ['Expertise', 'Insights', 'Our People', 'Careers'];

/**
 * Builds the overlay panel for one authored nav-sections `<li>` that has a
 * nested `<ul>`. A sub `<li>` renders as:
 * - a group header when it contains an `<h3>`
 * - a card (title + secondary action) when it contains two `<a>` elements
 * - a plain link otherwise
 * @param {Element} link The item's own top-level `<a>`
 * @param {Element} submenu The item's nested `<ul>`
 * @returns {Element} The panel element
 */
function buildNavPanel(link, submenu) {
  const panel = document.createElement('div');
  panel.className = 'nav-panel';

  const heading = document.createElement('div');
  heading.className = 'nav-panel-heading';
  const title = document.createElement('h2');
  title.textContent = link.textContent.trim();
  const cta = document.createElement('a');
  cta.className = 'nav-panel-cta';
  cta.href = link.href;
  cta.textContent = `Explore ${link.textContent.trim()}`;
  heading.append(title, cta);
  panel.append(heading);

  const list = document.createElement('div');
  list.className = 'nav-panel-list';

  // group flat <li> siblings under the nearest preceding <h3> (Practices/
  // Sectors); items with no leading <h3> fall into one ungrouped bucket
  let group = null;
  let cards = null;
  const items = [...submenu.children];
  items.forEach((sub) => {
    const h3 = sub.querySelector(':scope > h3');
    const links = [...sub.querySelectorAll(':scope > a')];
    if (h3) {
      group = document.createElement('div');
      group.className = 'nav-panel-group';
      group.append(h3.cloneNode(true), document.createElement('ul'));
      list.append(group);
    } else if (links.length > 1) {
      if (!cards) {
        cards = document.createElement('div');
        cards.className = 'nav-panel-cards';
        list.append(cards);
      }
      const card = document.createElement('div');
      card.className = 'nav-panel-card';
      card.append(links[0].cloneNode(true), links[1].cloneNode(true));
      cards.append(card);
    } else if (links.length === 1) {
      if (!group) {
        group = document.createElement('div');
        group.className = 'nav-panel-group';
        group.append(document.createElement('ul'));
        list.append(group);
      }
      const li = document.createElement('li');
      li.append(links[0].cloneNode(true));
      group.querySelector('ul').append(li);
    }
  });
  list.querySelectorAll('.nav-panel-group > ul').forEach((ul) => {
    if (ul.children.length > 10) ul.classList.add('nav-panel-group-split');
  });
  panel.append(list);

  return panel;
}

/**
 * Opens or closes the nav overlay, optionally activating a given rail item.
 * @param {Element} nav The nav element
 * @param {Element} overlay The nav overlay element
 * @param {Boolean} open Whether the overlay should be open
 * @param {Number} [activeIdx] Rail item index to activate when opening
 */
function toggleOverlay(nav, overlay, open, activeIdx = 0) {
  nav.setAttribute('aria-expanded', open ? 'true' : 'false');
  overlay.hidden = !open;
  document.body.style.overflowY = open ? 'hidden' : '';
  const button = nav.querySelector('.nav-hamburger button');
  button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  if (!open) return;

  const railItems = [...overlay.querySelectorAll('.nav-overlay-rail > li')];
  overlay.querySelectorAll('.nav-panel').forEach((panel) => { panel.hidden = true; });
  railItems.forEach((li, i) => li.classList.toggle('is-active', i === activeIdx));
  const panelId = railItems[activeIdx]?.querySelector('button')?.dataset.panelId;
  if (panelId) overlay.querySelector(`#${panelId}`).hidden = false;
  overlay.querySelector('input[type="search"]')?.focus();
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  // build the overlay (search + rail + panels) from the authored items, then
  // strip the non-primary items out of the collapsed top bar's own list
  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  overlay.hidden = true;
  overlay.innerHTML = '<div class="nav-overlay-search"><span class="icon icon-search"></span><input type="search" placeholder="Type to search…" aria-label="Search"></div>';
  const body = document.createElement('div');
  body.className = 'nav-overlay-body';
  const rail = document.createElement('ul');
  rail.className = 'nav-overlay-rail';
  body.append(rail);
  overlay.append(body);

  const navSections = nav.querySelector('.nav-sections');
  const topLevelItems = navSections
    ? [...navSections.querySelectorAll(':scope .default-content-wrapper > ul > li')] : [];

  topLevelItems.forEach((li, idx) => {
    const link = li.querySelector(':scope > a, :scope > p > a');
    const submenu = li.querySelector(':scope > ul');
    const isPrimary = PRIMARY_LABELS.includes(link.textContent.trim());

    const railItem = document.createElement('li');
    if (submenu) {
      const panel = buildNavPanel(link, submenu);
      panel.id = `nav-panel-${idx}`;
      panel.hidden = true;
      body.append(panel);
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.panelId = panel.id;
      button.innerHTML = `${link.textContent.trim()}<span class="nav-rail-chevron"></span>`;
      button.addEventListener('click', () => toggleOverlay(nav, overlay, true, idx));
      railItem.append(button);

      // the top-bar item opens straight to its overlay panel
      submenu.remove();
      li.classList.add('nav-drop');
      link.addEventListener('click', (e) => {
        e.preventDefault();
        toggleOverlay(nav, overlay, true, idx);
      });
    } else {
      railItem.append(link.cloneNode(true));
    }
    rail.append(railItem);

    if (!isPrimary) li.remove();
  });

  // hamburger opens/closes the overlay
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleOverlay(nav, overlay, nav.getAttribute('aria-expanded') !== 'true'));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  // search icon in the tools area opens the overlay focused on search
  nav.querySelector('.nav-tools .icon-search')?.closest('p')?.addEventListener('click', () => {
    toggleOverlay(nav, overlay, true);
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && nav.getAttribute('aria-expanded') === 'true') {
      toggleOverlay(nav, overlay, false);
      nav.querySelector('.nav-hamburger button').focus();
    }
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav, overlay);
  block.append(navWrapper);
}
