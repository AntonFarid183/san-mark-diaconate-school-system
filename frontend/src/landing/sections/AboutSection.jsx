import Reveal from '../components/Reveal';
import HighlightCard from '../components/HighlightCard';
import AboutImageCollage from '../components/AboutImageCollage';

// Placeholder — later becomes the church building, a liturgy moment, and a
// classroom/activity photo (accentA / accentB). Swapping to a 3-photo
// collage is purely adding entries here.
const ABOUT_IMAGES = [
  { src: '/Avva Markos Church.jpg', alt: 'كنيسة أنبا مرقس', slot: 'primary' },
];

const HIGHLIGHTS = [
  { icon: 'self_improvement', title: 'عنوان مؤقت', description: 'وصف مؤقت يشرح جانب النمو الروحي — يُستبدل بمحتوى نهائي لاحقاً.' },
  { icon: 'menu_book', title: 'عنوان مؤقت', description: 'وصف مؤقت يشرح جانب التعليم الطقسي — يُستبدل بمحتوى نهائي لاحقاً.' },
  { icon: 'groups', title: 'عنوان مؤقت', description: 'وصف مؤقت يشرح جانب مجتمع الكنيسة — يُستبدل بمحتوى نهائي لاحقاً.' },
];

export default function AboutSection() {
  return (
    <section className="landing-section" id="about">
      <div className="landing-about-grid">
        <Reveal className="landing-about-content">
          <span className="landing-section-eyebrow">من نحن</span>
          <h2 className="landing-about-title">عنوان تعريفي بالكنيسة ومدرسة الشمامسة</h2>
          <p className="landing-about-intro">
            فقرة تمهيدية قصيرة تُجيب بإيجاز عن هوية الكنيسة ورسالة المدرسة — نص مؤقت يُستبدل لاحقاً.
          </p>
          <p className="landing-about-description">
            فقرة أطول تشرح بالتفصيل تاريخ الكنيسة وأهداف مدرسة إعداد الشمامسة ودورها الروحي والتعليمي في خدمة أبناء الكنيسة. نص مؤقت يُستبدل بمحتوى نهائي لاحقاً.
          </p>

          <div className="landing-about-highlights">
            {HIGHLIGHTS.map((h, i) => (
              <HighlightCard key={i} {...h} />
            ))}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <AboutImageCollage images={ABOUT_IMAGES} />
        </Reveal>
      </div>
    </section>
  );
}
