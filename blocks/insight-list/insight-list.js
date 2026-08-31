/*
 * Insight List Block
 * Lists Mallesons "Latest Thinking" insights for a given category.
 * The block is authored with a category value in its first row, e.g.
 *   Telecommunications
 * which drives a persisted GraphQL query
 * (…/insights-by-category;category=<value>). The returned fragments are
 * rendered as a responsive card grid, newest first.
 *
 * A cache-busting timestamp is appended to every request so authors always
 * see freshly published content (the endpoint is served with s-maxage=600).
 */

const GRAPHQL_ENDPOINT = 'https://publish-p116706-e1142141.adobeaemcloud.com/graphql/execute.json/aem-demo-assets/insights-by-category';

/**
 * Builds the persisted GraphQL query URL for a category, cache-busted.
 * @param {string} category
 * @returns {string} fully qualified endpoint URL
 */
function endpointFor(category) {
  return `${GRAPHQL_ENDPOINT};category=${encodeURIComponent(category)}?ck=${Date.now()}`;
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
 * Decodes a Content Fragment rich-text field to real HTML. Fragments arrive
 * either as real HTML or double-encoded (entity-escaped inside an outer
 * element); the extra layer is only unwrapped when escaped tags are present.
 * @param {string} payloadHtml
 * @returns {string} rich-text HTML markup
 */
function decodeRichText(payloadHtml) {
  if (!payloadHtml) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = payloadHtml.trim();
  if (/&lt;\/?[a-z]/i.test(payloadHtml)) return tmp.textContent.trim();
  return tmp.innerHTML.trim();
}

/**
 * Returns a plain-text excerpt from a rich-text field.
 * @param {string} payloadHtml
 * @param {number} [max=180]
 * @returns {string}
 */
function excerpt(payloadHtml, max = 180) {
  const html = decodeRichText(payloadHtml);
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const text = tmp.textContent.replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`;
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
 * Joins an insight's authors into a byline, e.g. "James Zhou & Jane Doe".
 * @param {Array<{firstName?: string, lastName?: string}>} authors
 * @returns {string}
 */
function byline(authors) {
  const names = (authors || [])
    .map((a) => [a.firstName, a.lastName].filter(Boolean).join(' '))
    .filter(Boolean);
  if (!names.length) return '';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}

/**
 * Derives the article page slug from a fragment path (last path segment).
 * @param {string} path e.g. /content/dam/aem-demo-assets/mallesons/test-insight
 * @returns {string} e.g. /test-insight
 */
function slugFor(path) {
  if (!path) return '';
  const segment = path.split('/').filter(Boolean).pop();
  return segment ? `/${segment}` : '';
}

/**
 * Builds a single insight card.
 * @param {object} item
 * @returns {HTMLElement}
 */
function buildCard(item) {
  const body = el('div', 'insight-list-card-body');
  if (item.articleType) body.append(el('p', 'insight-list-kicker', item.articleType));
  body.append(el('h3', 'insight-list-title', item.title || 'Untitled insight'));
  const date = formatDate(item.articledate);
  if (date) body.append(el('p', 'insight-list-date', date));
  const summary = excerpt(item.introText && item.introText.html);
  if (summary) body.append(el('p', 'insight-list-summary', summary));

  const footer = el('div', 'insight-list-card-footer');
  const tags = (item.category || []).filter(Boolean);
  if (tags.length) {
    const tagList = el('ul', 'insight-list-tags');
    tags.forEach((tag) => tagList.append(el('li', 'insight-list-tag', tag)));
    footer.append(tagList);
  }
  const authors = byline(item.authors);
  if (authors) footer.append(el('p', 'insight-list-authors', `By ${authors}`));

  // eslint-disable-next-line no-underscore-dangle
  const href = slugFor(item._path);
  const card = el('a', 'insight-list-card', body, footer);
  if (href) card.href = href;
  card.setAttribute('aria-label', item.title || 'Insight');
  return card;
}

/**
 * Renders the card grid (or an empty-state message) into the block.
 * @param {HTMLElement} block
 * @param {string} category
 * @param {Array<object>} items
 */
function render(block, category, items) {
  const header = el('div', 'insight-list-header');
  header.append(el('p', 'insight-list-eyebrow', 'Latest Thinking'));
  header.append(el('h2', 'insight-list-heading', category));
  block.append(header);

  if (!items.length) {
    block.append(el('p', 'insight-list-empty', `No insights found for “${category}”.`));
    return;
  }

  const grid = el('div', 'insight-list-grid');
  items
    .slice()
    .sort((a, b) => new Date(b.articledate || 0) - new Date(a.articledate || 0))
    .forEach((item) => grid.append(buildCard(item)));
  block.append(grid);
}

/**
 * Loads and decorates the insight list block.
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  const category = (block.textContent || '').trim();
  block.textContent = '';
  if (!category) return;

  block.classList.add('insight-list-loading');
  let items;
  try {
    const resp = await fetch(endpointFor(category), { cache: 'no-store' });
    if (!resp.ok) throw new Error(`request failed with status ${resp.status}`);
    const payload = await resp.json();
    items = payload && payload.data && payload.data.insightList && payload.data.insightList.items;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`insight-list: unable to load category "${category}"`, error);
  }
  block.classList.remove('insight-list-loading');

  if (!items) {
    block.append(el('p', 'insight-list-error', 'Insights are currently unavailable.'));
    return;
  }
  render(block, category, items);
}
