import { getMetadata } from '../../scripts/aem.js';

/**
 * loads and decorates the hero block
 * renders a full-bleed, autoplaying, muted, looping background video (with any
 * authored image used as its poster) while the heading, copy and CTA remain
 * overlaid on top. The video source is taken from an authored `.mp4` link or,
 * failing that, the page's `hero-video` metadata (content links to media are
 * stripped by the delivery pipeline, so metadata is the resilient channel).
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  const videoLink = block.querySelector('a[href*=".mp4"]');
  const videoSrc = (videoLink && videoLink.getAttribute('href')) || getMetadata('hero-video');
  if (!videoSrc) return;

  const posterImg = block.querySelector('picture img');
  const media = (videoLink && videoLink.closest('div'))
    || block.querySelector(':scope > div > div')
    || block;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const video = document.createElement('video');
  ['loop', 'muted', 'playsinline'].forEach((attr) => video.setAttribute(attr, ''));
  if (!reduceMotion) video.setAttribute('autoplay', '');
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('preload', 'auto');
  video.setAttribute('aria-hidden', 'true');
  video.setAttribute('tabindex', '-1');
  if (posterImg) video.poster = posterImg.currentSrc || posterImg.src;

  const source = document.createElement('source');
  source.src = videoSrc;
  source.type = 'video/mp4';
  video.append(source);

  media.replaceChildren(video);
  media.classList.add('hero-media');
  // with a background video the hero mirrors the source (video only): hide the
  // authored heading/copy/CTA overlay while leaving it in the DOM
  const row = media.parentElement;
  if (row) [...row.children].forEach((cell) => { if (cell !== media) cell.classList.add('hero-content'); });

  // some browsers ignore the autoplay attribute until play() is invoked;
  // when the user prefers reduced motion we leave the poster frame showing
  if (!reduceMotion) video.play().catch(() => { /* blocked; poster remains */ });
}
