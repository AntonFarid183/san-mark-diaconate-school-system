import MarqueeRow from '../components/MarqueeRow';

// Placeholder data — reuses the two real assets already in /public with
// varied crops for visual variety. Replacing with real church photos later
// is a matter of swapping these two arrays; nothing else changes.
const ROW_1_IMAGES = [
  { id: 'r1-1', src: '/san-mark-wide.png', alt: 'الكنيسة', objectPosition: 'center' },
  { id: 'r1-2', src: '/san-mark.jpg', alt: 'الكنيسة', objectPosition: 'top' },
  { id: 'r1-3', src: '/san-mark-wide.png', alt: 'الكنيسة', objectPosition: 'left' },
  { id: 'r1-4', src: '/san-mark.jpg', alt: 'الكنيسة', objectPosition: 'center' },
  { id: 'r1-5', src: '/san-mark-wide.png', alt: 'الكنيسة', objectPosition: 'right' },
];

const ROW_2_IMAGES = [
  { id: 'r2-1', src: '/san-mark.jpg', alt: 'الكنيسة', objectPosition: 'bottom' },
  { id: 'r2-2', src: '/san-mark-wide.png', alt: 'الكنيسة', objectPosition: 'right' },
  { id: 'r2-3', src: '/san-mark.jpg', alt: 'الكنيسة', objectPosition: 'center' },
  { id: 'r2-4', src: '/san-mark-wide.png', alt: 'الكنيسة', objectPosition: 'left' },
  { id: 'r2-5', src: '/san-mark.jpg', alt: 'الكنيسة', objectPosition: 'top' },
];

export default function GallerySection() {
  return (
    <section className="landing-section landing-gallery" id="gallery">
      <div className="landing-section-heading">
        <span className="landing-section-eyebrow">لمحة من الكنيسة</span>
        <h2 className="landing-section-title">معرض الكنيسة</h2>
        <p className="landing-section-subtitle">نص فرعي يصف جولة بصرية هادئة في أروقة الكنيسة وأيقوناتها وأنشطتها الروحية.</p>
      </div>

      <div className="landing-gallery-rows">
        <MarqueeRow images={ROW_1_IMAGES} />
        <MarqueeRow images={ROW_2_IMAGES} reverse />
      </div>
    </section>
  );
}
