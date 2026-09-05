/*
 * Author Inquiry Block
 *
 * A query-driven people grid: the author chooses a practice and this block asks
 * a single persisted GraphQL query (aem-demo-assets/authors-all) for the author
 * Content Fragments, then renders every attribute of the matching people
 * (profile picture, name, practices, biography, tags). Unlike the insight blocks
 * (which query insights), this queries the author CF model directly.
 *
 * Authored structure — two-column `key | value` rows, order-independent:
 *   | author-inquiry |                                   |
 *   | heading        | Our Experts in Competition        |  (optional)
 *   | eyebrow        | The Team                          |  (optional)
 *   | practice       | Photographer                      |  (optional → all)
 *   | limit          | 8                                 |  (max results, default 8)
 *   | sort           | name                              |  (name | practice, default name)
 *
 * The demo author CF model has no literal "practices" field; its multi-value
 * role attribute is `occupations`, so a practice filters authors whose
 * occupations contain the value (case-insensitive substring).
 *
 * The block fetches the full author feed from the persisted query (GET,
 * cacheable) and filters/sorts/limits client-side. Server-side matrix params
 * are avoided: AEM's persisted-query GET transport does not URL-decode
 * space-containing values, and a cross-origin POST with an object filter is
 * CORS-blocked (the endpoint allows GET only). Fetching once and filtering in
 * JS keeps every criterion reliable.
 */

const GRAPHQL_ENDPOINT = 'https://publish-p116706-e1142141.adobeaemcloud.com/graphql/execute.json/aem-demo-assets/authors-all';

// Upper bound on the feed pulled before client-side filtering.
const FEED_LIMIT = 100;

/**
 * Builds the feed URL (all authors), cache-busted with `ck`.
 * @returns {string}
 */
function feedUrl() {
  return `${GRAPHQL_ENDPOINT};limit=${FEED_LIMIT}?ck=${Date.now()}`;
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
    if (child == null) return;
    node.append(child.nodeType ? child : document.createTextNode(child));
  });
  return node;
}

/**
 * Returns a plain-text excerpt from an author biography (MultiFormatString).
 * @param {object} bio the biography field ({ plaintext, html })
 * @param {number} max
 * @returns {string}
 */
function excerpt(bio, max = 180) {
  const text = (bio && bio.plaintext ? bio.plaintext : '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

/**
 * The person's full name.
 * @param {object} item
 * @returns {string}
 */
function fullName(item) {
  return [item.firstName, item.lastName].filter(Boolean).join(' ').trim();
}

/**
 * Reads the authored `key | value` rows into a config object.
 * @param {HTMLElement} block
 * @returns {{heading:string, eyebrow:string, practice:string, limit:number, sort:string}}
 */
function readConfig(block) {
  const cfg = {
    heading: '', eyebrow: '', practice: '', limit: 8, sort: 'name',
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
      case 'practice': cfg.practice = value; break;
      case 'limit': { const n = parseInt(value, 10); if (n > 0) cfg.limit = n; break; }
      case 'sort': cfg.sort = /^practice$/i.test(value) ? 'practice' : 'name'; break;
      default: break;
    }
  });
  return cfg;
}

/**
 * Case-insensitive test of whether an author practises the authored practice.
 * @param {object} item
 * @param {object} cfg
 * @returns {boolean}
 */
function matches(item, cfg) {
  if (!cfg.practice) return true;
  const needle = cfg.practice.toLowerCase();
  return (item.occupations || [])
    .some((v) => String(v || '').toLowerCase().includes(needle));
}

/**
 * Filters, sorts and limits the author feed per the authored config.
 * @param {Array<object>} feed
 * @param {object} cfg
 * @returns {Array<object>}
 */
function selectItems(feed, cfg) {
  const rows = feed.filter((item) => matches(item, cfg));
  rows.sort((a, b) => {
    if (cfg.sort === 'practice') {
      const pa = (a.occupations || [])[0] || '';
      const pb = (b.occupations || [])[0] || '';
      if (pa !== pb) return pa.localeCompare(pb);
    }
    return String(a.lastName || '').localeCompare(String(b.lastName || ''));
  });
  return rows.slice(0, cfg.limit);
}

/**
 * Builds a single author card exposing every populated attribute.
 * @param {object} item
 * @returns {HTMLElement}
 */
function buildCard(item) {
  const card = el('article', 'author-inquiry-card');

  const pic = item.profilePicture;
  // eslint-disable-next-line no-underscore-dangle
  const photoUrl = pic && pic._publishUrl;
  if (photoUrl) {
    const img = el('img');
    img.src = photoUrl;
    img.alt = fullName(item);
    img.loading = 'lazy';
    if (pic.width) img.width = pic.width;
    if (pic.height) img.height = pic.height;
    card.append(el('div', 'author-inquiry-photo', img));
  }

  const body = el('div', 'author-inquiry-body');
  body.append(el('h3', 'author-inquiry-name', fullName(item)));

  const practices = (item.occupations || []).filter(Boolean);
  if (practices.length) {
    body.append(el('p', 'author-inquiry-practices', practices.join(' · ')));
  }

  const bio = excerpt(item.biography);
  if (bio) body.append(el('p', 'author-inquiry-bio', bio));

  // eslint-disable-next-line no-underscore-dangle
  const tags = (item._tags || []).filter(Boolean);
  if (tags.length) {
    const ul = el('ul', 'author-inquiry-tags');
    tags.forEach((t) => ul.append(el('li', 'author-inquiry-tag', t.split('/').pop())));
    body.append(ul);
  }

  card.append(body);
  return card;
}

/**
 * Renders the header (eyebrow + heading) into the block.
 * @param {HTMLElement} block
 * @param {object} cfg
 */
function renderHeader(block, cfg) {
  if (!cfg.eyebrow && !cfg.heading) return;
  const header = el('div', 'author-inquiry-header');
  if (cfg.eyebrow) header.append(el('p', 'author-inquiry-eyebrow', cfg.eyebrow));
  if (cfg.heading) header.append(el('h2', 'author-inquiry-heading', cfg.heading));
  block.append(header);
}

/**
 * Renders the card grid (or an empty-state message) into the block.
 * @param {HTMLElement} block
 * @param {Array<object>} items
 */
function renderGrid(block, items) {
  if (!items.length) {
    block.append(el('p', 'author-inquiry-empty', 'No people match this practice.'));
    return;
  }
  const grid = el('div', 'author-inquiry-grid');
  items.forEach((item) => grid.append(buildCard(item)));
  block.append(grid);
}

/**
 * Loads and decorates the author inquiry block.
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  const cfg = readConfig(block);
  block.textContent = '';
  block.classList.add('author-inquiry-loading');
  let feed = [];
  try {
    const resp = await fetch(feedUrl(), { cache: 'no-store' });
    if (!resp.ok) throw new Error(`request failed with status ${resp.status}`);
    const payload = await resp.json();
    feed = (payload && payload.data && payload.data.authorList
      && payload.data.authorList.items) || [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('author-inquiry: unable to load authors', error);
    block.classList.remove('author-inquiry-loading');
    renderHeader(block, cfg);
    block.append(el('p', 'author-inquiry-error', 'Our people are currently unavailable.'));
    return;
  }
  block.classList.remove('author-inquiry-loading');
  renderHeader(block, cfg);
  renderGrid(block, selectItems(feed, cfg));
}
