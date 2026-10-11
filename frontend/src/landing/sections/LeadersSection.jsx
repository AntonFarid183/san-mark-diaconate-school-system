import Reveal from '../components/Reveal';
import LeaderImage from '../components/LeaderImage';

// Six priests, in display order. Adding/removing a priest later is
// purely a matter of editing this array; the section markup doesn't change.
// Photos still on the placeholder get replaced by dropping a file in public/fathers.
const LEADERS = [
  { id: 'leader-1', name: 'أبونا يوحنا زاخر', photoSrc: '/san-mark.jpg' },
  { id: 'leader-2', name: 'أبونا فيلوباتير مجدي', photoSrc: '/san-mark.jpg' },
  { id: 'leader-3', name: 'أبونا إيلاريون جرجس', photoSrc: '/san-mark.jpg' },
  { id: 'leader-4', name: 'أبونا مرقس نسيم', photoSrc: '/san-mark.jpg' },
  { id: 'leader-5', name: 'أبونا صموئيل القمص صليب', photoSrc: '/san-mark.jpg' },
  { id: 'leader-6', name: 'أبونا موسى', photoSrc: '/san-mark.jpg' },
];

export default function LeadersSection() {
  return (
    <section className="landing-section" id="leaders">
      <div className="landing-section-heading">
        <h2 className="landing-section-title">آباء الكنيسة</h2>
      </div>

      <div className="landing-leaders-grid">
        {LEADERS.map(leader => (
          <Reveal key={leader.id} className="landing-leader-simple-card">
            <LeaderImage src={leader.photoSrc} alt={leader.name} shape="circle" />
            <p className="landing-leader-simple-name">{leader.name}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
