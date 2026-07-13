import { useState, useRef } from 'react';
import GalleryImage from './GalleryImage';

/**
 * Reusable infinite marquee row — used today for the Church Gallery, but
 * generic enough to reuse for any "auto-scrolling strip" need later
 * (e.g. sponsor logos, verse ticker) since it only depends on `images`.
 *
 * images: [{ id, src, alt, caption? }]  — caption is accepted but not
 * rendered yet; reserved for a future lightbox/caption feature.
 * reverse: flips the travel direction.
 */
export default function MarqueeRow({ images, reverse = false }) {
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef(null);

  const handleTouchStart = () => {
    clearTimeout(resumeTimer.current);
    setPaused(true);
  };

  const handleTouchEnd = () => {
    resumeTimer.current = setTimeout(() => setPaused(false), 600);
  };

  // Duplicate the list once — the CSS animation travels exactly -50%,
  // which lands precisely at the seam between the two copies.
  const doubled = [...images, ...images];

  return (
    <div
      className="landing-gallery-row-viewport"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`landing-gallery-row-track ${reverse ? 'landing-gallery-row-reverse' : ''} ${paused ? 'landing-gallery-paused' : ''}`}>
        {doubled.map((image, i) => (
          <GalleryImage key={`${image.id}-${i}`} image={image} />
        ))}
      </div>
    </div>
  );
}
