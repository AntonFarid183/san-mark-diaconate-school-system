import { useEffect } from 'react';
import { KEYWORDS, DEFAULT_DESCRIPTION, SITE_URL } from './keywords';

function setMeta(selector, attr, name, content) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  const previous = el.getAttribute('content');
  el.setAttribute('content', content);
  return () => el.setAttribute('content', previous ?? '');
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  const previous = el.getAttribute('href');
  el.setAttribute('href', href);
  return () => el.setAttribute('href', previous ?? '');
}

// Per-page title/description for the public (crawlable) pages. The app is a
// client-rendered SPA, so without this every URL would present the identical
// <title> and description to Google and to link previews.
// Restores the previous values on unmount so a signed-in screen's own title
// is never left holding a stale public-page one.
export default function useSeo({ title, description = DEFAULT_DESCRIPTION, keywords = KEYWORDS }) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const restore = [
      setMeta('meta[name="description"]', 'name', 'description', description),
      setMeta('meta[name="keywords"]', 'name', 'keywords', keywords),
      setMeta('meta[property="og:title"]', 'property', 'og:title', title),
      setMeta('meta[property="og:description"]', 'property', 'og:description', description),
      // index.html ships a canonical for the homepage; left as-is it would tell
      // Google that /self-register and /curriculum/* are duplicates of "/" and
      // to drop them from the index. Each public page must name itself.
      setCanonical(`${SITE_URL}${window.location.pathname}`),
      setMeta('meta[property="og:url"]', 'property', 'og:url', `${SITE_URL}${window.location.pathname}`),
    ];
    return () => {
      document.title = previousTitle;
      restore.forEach(fn => fn());
    };
  }, [title, description, keywords]);
}
