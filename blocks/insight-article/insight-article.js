/*
 * Insight Article Block
 * Renders a Mallesons "Latest Thinking" insight from a Content Fragment.
 * The block is authored with a Content Fragment path in its first row, e.g.
 *   /content/dam/aem-demo-assets/mallesons/test-insight
 * and, optionally, a Content Fragment variation name in a second row, e.g.
 *   singapore
 * These build a persisted GraphQL query URL (…;insightPath=…[;variation=…]).
 * The returned payload drives the full article layout (hero, byline, intro,
 * body, taxonomy, authors).
 */

const GRAPHQL_ENDPOINT = 'https://publish-p116706-e1142141.adobeaemcloud.com/graphql/execute.json/aem-demo-assets/insight-by-path';

/**
 * Builds the persisted GraphQL query URL for an insight.
 * @param {string} insightPath Content Fragment path
 * @param {string} [variation] optional Content Fragment variation name
 * @returns {string} fully qualified endpoint URL
 */
function endpointFor(insightPath, variation) {
  let url = `${GRAPHQL_ENDPOINT};insightPath=${insightPath}`;
  if (variation) url += `;variation=${variation}`;
  return url;
}

/**
 * Creates an element with an optional class and children (nodes or strings).
 * @param {string} tag
 * @param {string|null} className
 * @param {...(Node|string)} children
 * @returns {HTMLElement}
 */
function el(tag, className, ...children) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  children.forEach((child) => {
    if (child === null || child === undefined) return;
    node.append(child.nodeType ? child : document.createTextNode(child));
  });
  return node;
}

/**
 * Returns the rich-text markup for a Content Fragment field. Fragments arrive
 * in one of two shapes:
 *  - already real HTML (e.g. `<p>…</p><ul><li>…`), used as-is; or
 *  - double-encoded, where the real markup is entity-escaped (`&lt;p&gt;…`)
 *    inside an outer element, so the decoded text content IS the real HTML.
 * We only unwrap the extra layer when escaped tags are actually present,
 * otherwise unwrapping would discard the genuine markup and leave plain text.
 * @param {string} payloadHtml
 * @returns {string} rich-text HTML markup
 */
function decodeRichText(payloadHtml) {
  if (!payloadHtml) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = payloadHtml.trim();
  if (/&lt;\/?[a-z]/i.test(payloadHtml)) {
    return tmp.textContent.trim();
  }
  return tmp.innerHTML.trim();
}

/**
 * Removes authored inline styles so the block CSS controls presentation, and
 * drops empty paragraphs left behind by the source editor.
 * @param {HTMLElement} root
 */
function stripAuthoredStyles(root) {
  root.querySelectorAll('[style]').forEach((node) => node.removeAttribute('style'));
  root.querySelectorAll('p').forEach((p) => {
    if (!p.textContent.trim() && !p.querySelector('img')) p.remove();
  });
}

/**
 * Formats an ISO date as e.g. "27 August 2026".
 * @param {string} iso
 * @returns {string}
 */
function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(date);
}

/**
 * Joins an author's name parts.
 * @param {{firstName?: string, lastName?: string}} author
 * @returns {string}
 */
function authorName(author) {
  return [author.firstName, author.lastName].filter(Boolean).join(' ');
}

/**
 * Returns up to two uppercase initials for an author avatar.
 * @param {string} name
 * @returns {string}
 */
function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Builds a decoded rich-text wrapper, or null when empty.
 * @param {string} className
 * @param {string} payloadHtml
 * @returns {HTMLElement|null}
 */
function richTextBlock(className, payloadHtml) {
  const html = decodeRichText(payloadHtml);
  if (!html) return null;
  const wrapper = el('div', className);
  wrapper.innerHTML = html;
  stripAuthoredStyles(wrapper);
  return wrapper;
}

/**
 * Builds the full-bleed navy hero (kicker, title, published date).
 * @param {object} item
 * @returns {HTMLElement}
 */
function buildHero(item) {
  const inner = el('div', 'insight-article-hero-inner');
  if (item.articleType) inner.append(el('p', 'insight-article-kicker', item.articleType));
  inner.append(el('h1', null, item.title || ''));
  const date = formatDate(item.articledate);
  if (date) {
    const published = el('p', 'insight-article-published', `Published ${date}`);
    published.dataset.date = item.articledate;
    inner.append(published);
  }
  return el('div', 'insight-article-hero', inner);
}

/**
 * Builds a breadcrumb trail ending in the article title.
 * @param {object} item
 * @returns {HTMLElement}
 */
function buildBreadcrumb(item) {
  const nav = el('nav', 'insight-article-breadcrumb');
  nav.setAttribute('aria-label', 'Breadcrumb');
  const trail = ['Insights', 'Latest Thinking', item.title].filter(Boolean);
  trail.forEach((label, i) => {
    if (i) nav.append(el('span', 'insight-article-breadcrumb-sep', '/'));
    const current = i === trail.length - 1;
    nav.append(el('span', current ? 'insight-article-breadcrumb-current' : null, label));
  });
  return nav;
}

/**
 * Builds the byline row: "Authored by …" plus the Summarise-with-AI affordance.
 * @param {object} item
 * @returns {HTMLElement}
 */
function buildByline(item) {
  const row = el('div', 'insight-article-byline');
  const names = (item.authors || []).map(authorName).filter(Boolean);
  if (names.length) {
    const text = names.length > 1
      ? `Authored by ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
      : `Authored by ${names[0]}`;
    row.append(el('p', 'insight-article-authored', text));
  }
  const pill = el('span', 'insight-article-ai');
  pill.append(el('span', 'insight-article-ai-spark', '\u2726'), 'Summarise with AI');
  row.append(pill);
  return row;
}

/**
 * Builds the Categories taxonomy row from practices, sectors and categories.
 * @param {object} item
 * @returns {HTMLElement|null}
 */
function buildCategories(item) {
  const values = [...new Set([
    ...(item.category || []),
    ...(item.practices || []),
    ...(item.sectors || []),
  ])].filter(Boolean);
  if (!values.length) return null;
  const section = el('section', 'insight-article-categories');
  section.append(el('h2', null, 'Categories'));
  const list = el('ul', 'insight-article-tags');
  values.forEach((value) => list.append(el('li', null, value)));
  section.append(list);
  return section;
}

/**
 * Builds the cream "Meet The Authors" band.
 * @param {object} item
 * @returns {HTMLElement|null}
 */
function buildAuthors(item) {
  const authors = item.authors || [];
  if (!authors.length) return null;
  const offices = item.offices || [];
  const inner = el('div', 'insight-article-authors-inner');
  inner.append(el('h2', null, 'Meet The Authors'));
  const grid = el('div', 'insight-article-author-grid');
  authors.forEach((author, i) => {
    const name = authorName(author);
    const card = el('div', 'insight-article-author-card');
    card.append(el('span', 'insight-article-author-avatar', initials(name)));
    const info = el('div', 'insight-article-author-info');
    info.append(el('p', 'insight-article-author-name', name));
    const office = offices[i] || offices[0];
    if (office && office.name) {
      info.append(el('p', 'insight-article-author-office', office.name));
    }
    card.append(info);
    grid.append(card);
  });
  inner.append(grid);
  return el('section', 'insight-article-authors', inner);
}

/**
 * Renders the full article into the block.
 * @param {HTMLElement} block
 * @param {object} item
 */
function render(block, item) {
  block.textContent = '';
  document.title = item.browserTitle || item.title || document.title;

  block.append(buildHero(item));

  const body = el('div', 'insight-article-body');
  body.append(buildBreadcrumb(item), buildByline(item));
  const intro = richTextBlock('insight-article-intro', item.introText && item.introText.html);
  if (intro) body.append(intro);
  const content = richTextBlock('insight-article-content', item.body && item.body.html);
  if (content) body.append(content);
  const categories = buildCategories(item);
  if (categories) body.append(categories);
  block.append(body);

  const authors = buildAuthors(item);
  if (authors) block.append(authors);
}

/**
 * Loads and decorates the insight article block.
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const insightPath = (rows[0] ? rows[0].textContent : '').trim();
  const variation = (rows[1] ? rows[1].textContent : '').trim();
  block.textContent = '';
  if (!insightPath) return;

  block.classList.add('insight-article-loading');
  let item;
  try {
    const resp = await fetch(endpointFor(insightPath, variation));
    if (!resp.ok) throw new Error(`request failed with status ${resp.status}`);
    const payload = await resp.json();
    item = payload && payload.data && payload.data.insightByPath && payload.data.insightByPath.item;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`insight-article: unable to load ${insightPath}`, error);
  }
  block.classList.remove('insight-article-loading');

  if (!item) {
    block.append(el('p', 'insight-article-error', 'This insight is currently unavailable.'));
    return;
  }
  render(block, item);
}
