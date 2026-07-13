import Reveal from '../components/Reveal';
import HighlightCard from '../components/HighlightCard';

// Placeholder — the church will provide the final ordination requirements;
// swapping content later is just editing this array.
const REQUIREMENTS = [
  { icon: 'school', title: 'شرط مؤقت', description: 'وصف مؤقت لأحد شروط الرسامة — يُستبدل بمحتوى نهائي لاحقاً.' },
  { icon: 'menu_book', title: 'شرط مؤقت', description: 'وصف مؤقت لأحد شروط الرسامة — يُستبدل بمحتوى نهائي لاحقاً.' },
  { icon: 'self_improvement', title: 'شرط مؤقت', description: 'وصف مؤقت لأحد شروط الرسامة — يُستبدل بمحتوى نهائي لاحقاً.' },
  { icon: 'verified', title: 'شرط مؤقت', description: 'وصف مؤقت لأحد شروط الرسامة — يُستبدل بمحتوى نهائي لاحقاً.' },
];

export default function OrdinationSection() {
  return (
    <section className="landing-section" id="ordination">
      <div className="landing-section-heading">
        <span className="landing-section-eyebrow">دليل الشمامسة</span>
        <h2 className="landing-section-title">شروط الرسامة</h2>
        <p className="landing-section-subtitle">نص فرعي مؤقت يوضح الشروط والمتطلبات الروحية والتعليمية للرسامة — يُستبدل بمحتوى نهائي لاحقاً.</p>
      </div>

      <div className="landing-grid-cards">
        {REQUIREMENTS.map((r, i) => (
          <Reveal key={i} delay={i * 60}>
            <HighlightCard {...r} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
