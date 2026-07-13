import Reveal from '../components/Reveal';
import HighlightCard from '../components/HighlightCard';

// Placeholder — real church contact details will replace this content later.
const CONTACT_ITEMS = [
  { icon: 'location_on', title: 'العنوان', description: 'كنيسة مارمرقس النزهة 2 — نص عنوان مؤقت يُستبدل لاحقاً.' },
  { icon: 'call', title: 'الهاتف', description: '01xxxxxxxxx' },
  { icon: 'mail', title: 'البريد الإلكتروني', description: 'info@example.com' },
  { icon: 'schedule', title: 'مواعيد الخدمة', description: 'نص مؤقت لمواعيد المدرسة والخدمة — يُستبدل لاحقاً.' },
];

export default function ContactSection() {
  return (
    <section className="landing-section" id="contact">
      <div className="landing-section-heading">
        <span className="landing-section-eyebrow">تواصل معنا</span>
        <h2 className="landing-section-title">بيانات التواصل</h2>
        <p className="landing-section-subtitle">يسعدنا تواصلكم مع خدمة مدرسة الشمامسة عبر أي من الوسائل التالية.</p>
      </div>

      <div className="landing-grid-cards">
        {CONTACT_ITEMS.map((c, i) => (
          <Reveal key={i} delay={i * 60}>
            <HighlightCard {...c} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
