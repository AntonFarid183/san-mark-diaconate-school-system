import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * One place that decides where the window is scrolled on every navigation:
 *
 * - Going to a new page (link / button): start at the top.
 * - Coming back (browser back/forward, or a back button that passes
 *   state.restoreScroll): return to where the user was on that page, once the
 *   content has loaded tall enough to scroll there.
 * - Same page rewriting its own ?page=/?q= (path unchanged) or a #anchor: leave it alone.
 *
 * Positions are remembered per URL (path + query) for the browser session.
 */
const STORAGE_PREFIX = 'scroll:';
const RESTORE_TIMEOUT_MS = 4000;
const RESTORE_POLL_MS = 50;

const read = (key) => {
  try { return Number(sessionStorage.getItem(STORAGE_PREFIX + key)) || 0; } catch { return 0; }
};
const write = (key, y) => {
  try { sessionStorage.setItem(STORAGE_PREFIX + key, String(Math.round(y))); } catch { /* storage unavailable */ }
};

export default function ScrollManager() {
  const { pathname, search, hash, state } = useLocation();
  const navigationType = useNavigationType();
  const urlKey = `${pathname}${search}`;

  const lastPathname = useRef(null);
  const currentKey = useRef(urlKey);
  useLayoutEffect(() => { currentKey.current = urlKey; }, [urlKey]);

  // The browser's own restoration races with ours (and knows nothing about data that
  // loads after the route renders), so take it over.
  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  // Remember the position of the page being left. Recorded while scrolling and — because
  // scroll events can lag or be skipped — also at every click/key press (a navigation
  // always starts with one), before the next page replaces this one.
  useEffect(() => {
    const save = () => write(currentKey.current, window.scrollY);
    window.addEventListener('scroll', save, { passive: true });
    document.addEventListener('click', save, true);
    document.addEventListener('keydown', save, true);
    window.addEventListener('pagehide', save);
    return () => {
      window.removeEventListener('scroll', save);
      document.removeEventListener('click', save, true);
      document.removeEventListener('keydown', save, true);
      window.removeEventListener('pagehide', save);
    };
  }, []);

  const wantsRestore = navigationType === 'POP' || state?.restoreScroll === true;

  useLayoutEffect(() => {
    const pathChanged = lastPathname.current !== pathname;
    lastPathname.current = pathname;

    if (hash) return; // #anchor: the page scrolls to its section itself

    if (!wantsRestore) {
      if (pathChanged) window.scrollTo(0, 0);
      return;
    }

    const target = read(urlKey);
    if (target <= 0) return;

    // Content usually arrives after the route renders (data fetch), so the page is too
    // short to scroll to `target` yet. Keep trying until it is tall enough, the user
    // scrolls themselves, or time runs out.
    const startedAt = Date.now();
    let cancelled = false;
    const stop = () => { cancelled = true; };
    const userEvents = ['wheel', 'touchstart', 'keydown', 'mousedown'];
    userEvents.forEach((e) => window.addEventListener(e, stop, { passive: true, once: true }));

    const attempt = () => {
      if (cancelled) return;
      const tallEnough = document.documentElement.scrollHeight - window.innerHeight >= target - 1;
      if (tallEnough || Date.now() - startedAt > RESTORE_TIMEOUT_MS) {
        window.scrollTo(0, target);
        cancelled = true;
        return;
      }
      timer = setTimeout(attempt, RESTORE_POLL_MS);
    };
    let timer = setTimeout(attempt, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      userEvents.forEach((e) => window.removeEventListener(e, stop));
    };
    // Re-run only for a new location, not for every state change.
  }, [urlKey, hash]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
