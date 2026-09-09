/*
 * Article Hero Block
 * Full-bleed navy hero for an authored insight article. Renders a background
 * image band with a navy gradient overlay, a rule-framed centred eyebrow /
 * title / published date, then a navy continuation carrying the serif lead and
 * the author byline — mirroring the source article's masthead.
 *
 * Authored structure (single column; media row anywhere, text rows in order):
 *   media   -> hero background image
 *   row 1   -> eyebrow (e.g. "Featured Insight")
 *   row 2   -> the title (an <h1>)
 *   row 3   -> published date
 *   row 4   -> lead paragraph
 *   row 5   -> byline (may contain author links)
 *
 * @param {Element} block The article-hero block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  let media = null;
  const texts = [];
  rows.forEach((row) => {
    if (row.querySelector('picture, img')) media = row;
    else texts.push(row);
  });

  const cellOf = (row) => row && (row.querySelector(':scope > div') || row);
  const [eyebrowRow, titleRow, publishedRow, leadRow, bylineRow] = texts;

  block.textContent = '';

  // top band: background image + gradient overlay + rule-framed masthead
  const banner = document.createElement('div');
  banner.className = 'article-hero-banner';

  const img = media && media.querySelector('img');
  if (img) {
    const bg = document.createElement('div');
    bg.className = 'article-hero-bg';
    bg.style.backgroundImage = `url("${img.getAttribute('src')}")`;
    banner.append(bg);
  }
  const overlay = document.createElement('div');
  overlay.className = 'article-hero-overlay';
  banner.append(overlay);

  const frame = document.createElement('div');
  frame.className = 'article-hero-frame';
  if (eyebrowRow) {
    const p = document.createElement('p');
    p.className = 'article-hero-eyebrow';
    p.textContent = cellOf(eyebrowRow).textContent.trim();
    frame.append(p);
  }
  if (titleRow) {
    const h1 = titleRow.querySelector('h1') || document.createElement('h1');
    if (!titleRow.querySelector('h1')) h1.textContent = cellOf(titleRow).textContent.trim();
    frame.append(h1);
  }
  if (publishedRow) {
    const p = document.createElement('p');
    p.className = 'article-hero-published';
    p.textContent = cellOf(publishedRow).textContent.trim();
    frame.append(p);
  }
  banner.append(frame);
  block.append(banner);

  // navy continuation: serif lead + byline
  if (leadRow || bylineRow) {
    const lead = document.createElement('div');
    lead.className = 'article-hero-lead';
    if (leadRow) {
      const p = document.createElement('p');
      p.className = 'article-hero-lead-text';
      p.innerHTML = cellOf(leadRow).innerHTML;
      lead.append(p);
    }
    if (bylineRow) {
      const p = document.createElement('p');
      p.className = 'article-hero-byline';
      p.innerHTML = cellOf(bylineRow).innerHTML;
      lead.append(p);
    }
    block.append(lead);
  }
}
