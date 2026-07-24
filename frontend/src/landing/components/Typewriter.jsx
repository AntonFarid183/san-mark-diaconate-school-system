import { useState, useEffect, useRef } from 'react';

// Reveals `text` one character at a time. Restarts automatically whenever
// `text` changes (e.g. a new verse). Respects prefers-reduced-motion by
// rendering the full text immediately.
export default function Typewriter({ text, speed = 28, startDelay = 300, className }) {
  const [shown, setShown] = useState('');
  const reduceMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (reduceMotion.current) {
      setShown(text);
      return;
    }

    setShown('');
    let i = 0;
    let interval;
    const startTimer = setTimeout(() => {
      interval = setInterval(() => {
        i += 1;
        setShown(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, speed);
    }, startDelay);

    return () => { clearTimeout(startTimer); clearInterval(interval); };
  }, [text, speed, startDelay]);

  const done = shown.length === text.length;

  return (
    <span className={className}>
      {shown}
      <span className={`landing-typewriter-cursor ${done ? 'landing-typewriter-cursor-done' : ''}`}>|</span>
    </span>
  );
}
