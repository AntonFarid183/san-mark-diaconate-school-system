// Isolated so future features (lightbox click, caption overlay) attach here
// without touching MarqueeRow's layout/animation logic.
export default function GalleryImage({ image }) {
  return (
    <div className="landing-gallery-item">
      <img src={image.src} alt={image.alt || ''} loading="lazy" style={image.objectPosition ? { objectPosition: image.objectPosition } : undefined} />
    </div>
  );
}
