import { useEffect, useRef, useState } from 'react';

// Generic fade + small upward reveal, triggered once when the element enters
// the viewport. Reusable by any landing section — not About-specific.
//
// `onReveal` is optional — fires once at the same moment the fade-in
// triggers, letting a child (e.g. a stat counter) start its own animation
// in sync with becoming visible, without each consumer wiring up its own
// IntersectionObserver.
export default function Reveal({ children, className = '', delay = 0, onReveal }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          onReveal?.();
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      className={`landing-reveal ${visible ? 'landing-reveal-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
