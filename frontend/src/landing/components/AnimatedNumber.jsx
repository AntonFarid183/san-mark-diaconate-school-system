import { useEffect, useRef, useState } from 'react';

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Counts from 0 to `value` once `start` becomes true. Never restarts once
 * it has run. Respects prefers-reduced-motion (jumps straight to the final
 * value instead of animating).
 *
 * Formatting is deliberately simple and prop-driven so future formats
 * ("1,250+", "10K+", "95%") never require touching this component —
 * only `value`/`suffix` change. For genuinely non-numeric stats (e.g.
 * "24/7"), the parent should skip this component entirely and render
 * `staticValue` instead (see StatisticCard).
 */
export default function AnimatedNumber({ value, start, duration = 1800, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const hasRun = useRef(false);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!start || hasRun.current) return;
    hasRun.current = true;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      setDisplay(Math.round(eased * value));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(value); // guarantee it lands exactly on the target
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [start, value, duration]);

  return (
    <span>
      {display.toLocaleString('ar-EG')}
      {suffix}
    </span>
  );
}
