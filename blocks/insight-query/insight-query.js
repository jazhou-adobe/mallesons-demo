/*
 * Insight Query Block
 *
 * A query-driven insight grid: the author chooses the criteria and this block
 * asks a single persisted GraphQL query (aem-demo-assets/insight-by-filter) for
 * the matching insights. Unlike the curated `insight-collection` block (cards
 * authored by hand) or the single-criterion `insight-list` / `insight-author-list`
 * blocks, this one filters by any COMBINATION of author, category and article
 * type, with a configurable result limit and sort order.
 *
 * Authored structure — two-column `key | value` rows, order-independent:
 *   | insight-query |                     |
 *   | heading       | Latest Thinking     |  (optional; omitted → no header)
 *   | eyebrow       | Insights            |  (optional; omitted → no eyebrow)
 *   | author        | Zhou                |  (author last name, case-insensitive)
 *   | category      | Competition         |  (category value, case-insensitive)
 *   | type          | Featured Insight    |  (articleType value, case-insensitive)
 *   | limit         | 6                   |  (max results, default 6)
 *   | sort          | newest              |  (newest | oldest, default newest)
 *
 * Criteria combine with AND. Any omitted term is left unconstrained (the persisted
 * query defaults it to "" and matches everything). With no author/category/type
 * the block lists the latest insights (bounded by `limit`). Matching is
 * case-insensitive substring.
 *
 * Invoked over GET (the endpoint's CORS policy allows GET only). The persisted
 * query — scalar variables, filter assembled server-side — lives in
 * insight-by-filter.graphql.
 */

const GRAPHQL_ENDPOINT = 'https://publish-p116706-e1142141.adobeaemcloud.com/graphql/execute.json/aem-demo-assets/insight-by-filter';

/**
 * Builds the persisted-query URL: the authored scalar criteria become `;name=value`
 * params (omitted terms fall back to the query's defaults), cache-busted with `ck`.
 * @param {object} cfg
 * @returns {string}
 */
function endpointFor(cfg) {
  const params = [];
  if (cfg.author) params.push(`author=${encodeURIComponent(cfg.author)}`);
  if (cfg.category) params.push(`category=${encodeURIComponent(cfg.category)}`);
  if (cfg.articleType) params.push(`articleType=${encodeURIComponent(cfg.articleType)}`);
  params.push(`limit=${cfg.limit}`);
  params.push(`sort=${encodeURIComponent(cfg.sort)}`);
  return `${GRAPHQL_ENDPOINT};${params.join(';')}?ck=${Date.now()}`;
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
 * @returns {string}
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
 * @param {string} path
 * @returns {string}
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
  const body = el('div', 'insight-query-card-body');
  if (item.articleType) body.append(el('p', 'insight-query-kicker', item.articleType));
  body.append(el('h3', 'insight-query-title', item.title || 'Untitled insight'));
  const date = formatDate(item.articledate);
  if (date) body.append(el('p', 'insight-query-date', date));
  const summary = excerpt(item.introText && item.introText.html);
  if (summary) body.append(el('p', 'insight-query-summary', summary));

  const footer = el('div', 'insight-query-card-footer');
  const tags = (item.category || []).filter(Boolean);
  if (tags.length) {
    const tagList = el('ul', 'insight-query-tags');
    tags.forEach((tag) => tagList.append(el('li', 'insight-query-tag', tag)));
    footer.append(tagList);
  }
  const authors = byline(item.authors);
  if (authors) footer.append(el('p', 'insight-query-authors', `By ${authors}`));

  // eslint-disable-next-line no-underscore-dangle
  const href = slugFor(item._path);
  const card = el('a', 'insight-query-card', body, footer);
  if (href) card.href = href;
  card.setAttribute('aria-label', item.title || 'Insight');
  return card;
}

/**
 * Reads the authored key/value rows into a config object.
 * @param {HTMLElement} block
 * @returns {{heading: string, eyebrow: string, author: string,
 *   category: string, articleType: string, limit: number, sort: string}}
 */
function readConfig(block) {
  const cfg = {
    heading: '',
    eyebrow: '',
    author: '',
    category: '',
    articleType: '',
    limit: 6,
    sort: 'articledate DESC',
  };
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    const key = cells[0].textContent.trim().toLowerCase();
    const value = cells[1].textContent.trim();
    if (!value) return;
    switch (key) {
      case 'heading': cfg.heading = value; break;
      case 'eyebrow': cfg.eyebrow = value; break;
      case 'author': case 'authors': cfg.author = value; break;
      case 'category': case 'categories': cfg.category = value; break;
      case 'type': case 'articletype': cfg.articleType = value; break;
      case 'limit': { const n = parseInt(value, 10); if (n > 0) cfg.limit = n; break; }
      case 'sort': cfg.sort = /^old/i.test(value) ? 'articledate ASC' : 'articledate DESC'; break;
      default: break;
    }
  });
  return cfg;
}

/**
 * Renders the header (eyebrow + heading) into the block.
 * @param {HTMLElement} block
 * @param {object} cfg
 */
function renderHeader(block, cfg) {
  const header = el('div', 'insight-query-header');
  if (cfg.eyebrow) header.append(el('p', 'insight-query-eyebrow', cfg.eyebrow));
  if (cfg.heading) header.append(el('h2', 'insight-query-heading', cfg.heading));
  if (header.childElementCount) block.append(header);
}

/**
 * Renders the card grid (or an empty-state message) into the block.
 * @param {HTMLElement} block
 * @param {Array<object>} items
 */
function renderGrid(block, items) {
  if (!items.length) {
    block.append(el('p', 'insight-query-empty', 'No insights match these criteria.'));
    return;
  }
  const grid = el('div', 'insight-query-grid');
  items.forEach((item) => grid.append(buildCard(item)));
  block.append(grid);
}

/**
 * Loads and decorates the insight query block.
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  const cfg = readConfig(block);
  block.textContent = '';
  block.classList.add('insight-query-loading');

  let items;
  try {
    const resp = await fetch(endpointFor(cfg), { cache: 'no-store' });
    if (!resp.ok) throw new Error(`request failed with status ${resp.status}`);
    const payload = await resp.json();
    items = payload && payload.data && payload.data.insightList && payload.data.insightList.items;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('insight-query: unable to load insights', error);
  }
  block.classList.remove('insight-query-loading');

  renderHeader(block, cfg);
  if (!items) {
    block.append(el('p', 'insight-query-error', 'Insights are currently unavailable.'));
    return;
  }
  renderGrid(block, items);
}
