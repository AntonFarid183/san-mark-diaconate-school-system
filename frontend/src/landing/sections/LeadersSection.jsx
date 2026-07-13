import Reveal from '../components/Reveal';
import LeaderImage from '../components/LeaderImage';

// Placeholder — five priests today. Adding/removing a priest later is
// purely a matter of editing this array; the section markup doesn't change.
const LEADERS = [
  { id: 'leader-1', name: 'اسم الأب الكاهن', photoSrc: '/san-mark.jpg' },
  { id: 'leader-2', name: 'اسم الأب الكاهن', photoSrc: '/san-mark.jpg' },
  { id: 'leader-3', name: 'اسم الأب الكاهن', photoSrc: '/san-mark.jpg' },
  { id: 'leader-4', name: 'اسم الأب الكاهن', photoSrc: '/san-mark.jpg' },
  { id: 'leader-5', name: 'اسم الأب الكاهن', photoSrc: '/san-mark.jpg' },
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
