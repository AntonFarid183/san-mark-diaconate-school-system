import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * A new page opens at the top. Without this the window keeps whatever scroll the
 * previous page had, so opening a student from the bottom of a long list landed halfway
 * down their profile.
 *
 * - Only when the path changes: a list rewriting its own ?page=/?q= in the URL must not jump.
 * - Not on back/forward (POP): lists restore their own position (useScrollRestoration).
 * - Not for #anchors: the landing page scrolls to the section itself.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType === 'POP' || hash) return;
    window.scrollTo(0, 0);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
