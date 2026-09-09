/*
 * Article Body Block
 * A constrained reading column for an authored insight article. The block wraps
 * a run of default content (headings, paragraphs, lists); decoration flattens
 * the block's cell so the prose sits directly under `.article-body` and the CSS
 * can style it as a centred reading column matching the source article.
 *
 * @param {Element} block The article-body block element
 */
export default function decorate(block) {
  const cell = block.querySelector(':scope > div > div');
  if (cell) block.replaceChildren(...cell.childNodes);
}
