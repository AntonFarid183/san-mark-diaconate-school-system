import { useRef } from 'react';

/**
 * Lets a screen ignore out-of-order responses. Typing in a search box fires
 * several requests; a slow early one must not overwrite the result of a later one.
 *
 *   const id = guard.begin();
 *   const res = await apiClient.get(...);
 *   if (!guard.isCurrent(id)) return;
 */
export default function useRequestGuard() {
  const latest = useRef(0);
  return {
    begin: () => ++latest.current,
    isCurrent: (id) => id === latest.current,
  };
}
