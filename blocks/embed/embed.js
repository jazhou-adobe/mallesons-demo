/*
 * Embed Block
 * Takes the raw HTML authored in the block and renders it directly on the page.
 * The markup is authored as escaped text (so it survives DA, which strips
 * <script>/<iframe> from parsed document content); the block reads that text
 * and injects it as real markup. Scripts inserted via innerHTML never execute,
 * so any <script> tags are re-created to run (e.g. Flourish's embed.js).
 *
 * @param {Element} block The embed block element
 */
export default function decorate(block) {
  const raw = block.textContent.trim();
  block.textContent = '';
  if (!raw) return;

  const content = document.createElement('div');
  content.className = 'embed-content';
  content.innerHTML = raw;

  content.querySelectorAll('script').forEach((original) => {
    const script = document.createElement('script');
    [...original.attributes].forEach((attr) => script.setAttribute(attr.name, attr.value));
    script.textContent = original.textContent;
    original.replaceWith(script);
  });

  block.append(content);
}
