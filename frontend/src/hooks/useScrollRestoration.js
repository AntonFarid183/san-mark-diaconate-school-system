import { useEffect, useLayoutEffect, useRef } from 'react';

/**
 * Remembers how far down a list the user scrolled, so coming back to it (from a
 * detail page) lands on the same row instead of the top.
 *
 * - key:     identifies the view (the list's URL, including page/search).
 * - restore: true only when arriving by "back" (browser back, or the in-app back
 *            buttons) — a fresh visit from the sidebar should start at the top.
 * - ready:   true once the list has real content; the page is too short to scroll
 *            to the saved position before that.
 */
const storageKey = (key) => `scroll:${key}`;

const readSaved = (key) => {
  try { return Number(sessionStorage.getItem(storageKey(key))) || 0; } catch { return 0; }
};

const writeSaved = (key, y) => {
  try { sessionStorage.setItem(storageKey(key), String(y)); } catch { /* storage unavailable */ }
};

export default function useScrollRestoration({ key, restore, ready }) {
  // Read before anything can overwrite it (dev-mode double mount runs the unmount
  // cleanup straight after the first mount, which would save a scroll of 0).
  const savedOnArrival = useRef(null);
  if (savedOnArrival.current === null) savedOnArrival.current = { key, y: readSaved(key) };

  const restoredFor = useRef(null);

  // While on screen: keep the latest position up to date.
  useEffect(() => {
    const save = () => writeSaved(key, window.scrollY);
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, [key]);

  // On the way out: save the exact position before the next page replaces this one
  // (a shorter page clamps the scroll right after, so a scroll listener alone can miss it).
  useLayoutEffect(() => () => writeSaved(key, window.scrollY), [key]);

  useEffect(() => {
    if (!ready || !restore || restoredFor.current === key) return;
    restoredFor.current = key;
    const saved = savedOnArrival.current.key === key ? savedOnArrival.current.y : readSaved(key);
    if (saved > 0) window.scrollTo(0, saved); // the list is already laid out, no need to wait a frame
  }, [key, restore, ready]);
}
