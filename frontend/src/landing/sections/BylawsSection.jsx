import Reveal from '../components/Reveal';
import HighlightCard from '../components/HighlightCard';

// Placeholder — final school bylaws will replace this content later.
const RULES = [
  { icon: 'schedule', title: 'بند مؤقت', description: 'وصف مؤقت لأحد بنود لائحة المدرسة — يُستبدل بمحتوى نهائي لاحقاً.' },
  { icon: 'checklist', title: 'بند مؤقت', description: 'وصف مؤقت لأحد بنود لائحة المدرسة — يُستبدل بمحتوى نهائي لاحقاً.' },
  { icon: 'gavel', title: 'بند مؤقت', description: 'وصف مؤقت لأحد بنود لائحة المدرسة — يُستبدل بمحتوى نهائي لاحقاً.' },
];

export default function BylawsSection() {
  return (
    <section className="landing-section" id="bylaws">
      <div className="landing-section-heading">
        <span className="landing-section-eyebrow">اللوائح</span>
        <h2 className="landing-section-title">لائحة المدرسة</h2>
        <p className="landing-section-subtitle">نص فرعي مؤقت يشرح قواعد وأنظمة المدرسة — يُستبدل بمحتوى نهائي لاحقاً.</p>
      </div>

      <div className="landing-grid-cards landing-grid-cards-3">
        {RULES.map((r, i) => (
          <Reveal key={i} delay={i * 60}>
            <HighlightCard {...r} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
