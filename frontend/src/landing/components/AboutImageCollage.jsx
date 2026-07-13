const SLOT_CLASS = {
  primary: 'landing-about-slot-primary',
  accentA: 'landing-about-slot-accent-a',
  accentB: 'landing-about-slot-accent-b',
};

/**
 * Reusable layered-collage image container.
 *
 * images: [{ src, alt, slot: 'primary' | 'accentA' | 'accentB' }]
 *
 * Today only `primary` is passed in, so it renders as a single full-bleed
 * photo. To evolve into a 2-3 image collage later, just add more entries
 * with slot: 'accentA' / 'accentB' — this component and the About section's
 * grid layout do not need to change.
 */
export default function AboutImageCollage({ images }) {
  return (
    <div className="landing-about-image">
      <div className="landing-about-image-glow" />
      {images.map((image, i) => (
        <div key={i} className={`landing-about-image-slot ${SLOT_CLASS[image.slot] || SLOT_CLASS.primary}`}>
          <img src={image.src} alt={image.alt || ''} loading="lazy" />
        </div>
      ))}
    </div>
  );
}
