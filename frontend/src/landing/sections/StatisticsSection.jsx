import { useState, useEffect } from 'react';
import Reveal from '../components/Reveal';
import StatisticCard from '../components/StatisticCard';
import { getStatistics } from '../data/statisticsData';

export default function StatisticsSection() {
  const [statistics, setStatistics] = useState([]);
  const [start, setStart] = useState(false);

  // Sourcing is fully decoupled from rendering — getStatistics() resolves
  // placeholder data today and a real backend call later, with this
  // component never needing to change either way.
  useEffect(() => {
    getStatistics().then(setStatistics);
  }, []);

  if (statistics.length === 0) return null;

  return (
    <section className="landing-section" id="statistics">
      <div className="landing-section-heading">
        <span className="landing-section-eyebrow">بالأرقام</span>
        <h2 className="landing-section-title">أثر متنامٍ في خدمة الكنيسة</h2>
        <p className="landing-section-subtitle">نص فرعي مؤقت يصف نمو المدرسة وأثرها — يُستبدل بمحتوى نهائي لاحقاً.</p>
      </div>

      <Reveal onReveal={() => setStart(true)}>
        <div className="landing-stats-grid">
          {statistics.map(stat => (
            <StatisticCard key={stat.id} stat={stat} start={start} />
          ))}
        </div>
      </Reveal>
    </section>
  );
}
