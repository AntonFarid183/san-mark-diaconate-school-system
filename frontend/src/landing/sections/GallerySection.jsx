import GalleryCarousel from '../components/GalleryCarousel';

export default function GallerySection() {
  return (
    <section className="landing-section landing-gallery" id="gallery">
      <div className="landing-section-heading">
        <span className="landing-section-eyebrow">لحظات من خدمتنا</span>
        <h2 className="landing-section-title">معرض الصور لمدرسة الشمامسة</h2>
        <p className="landing-section-subtitle">لقطات من أنشطة المدرسة وخدمتها وأبنائها.</p>
      </div>

      <GalleryCarousel />
    </section>
  );
}
