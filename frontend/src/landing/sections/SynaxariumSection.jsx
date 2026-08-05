import { useEffect, useState } from 'react';
import Reveal from '../components/Reveal';
import apiClient from '../../apiClient';

// A saint's story can run long — collapse it to a gentle excerpt and let the
// reader choose to open the rest, so the card stays calm and scannable
// rather than a wall of text.
const EXCERPT_LENGTH = 220;

function SaintCard({ saint, index }) {
  const [expanded, setExpanded] = useState(false);
  const needsToggle = saint.story.length > EXCERPT_LENGTH;
  const shown = expanded || !needsToggle ? saint.story : saint.story.slice(0, EXCERPT_LENGTH).trim() + '…';

  return (
    <Reveal delay={index * 90} className="landing-synax-card">
      <div className="landing-synax-card-icon">
        <span className="material-symbols-outlined" aria-hidden="true">history_edu</span>
      </div>
      <h3 className="landing-synax-card-title">{saint.title}</h3>
      <p className="landing-synax-card-story">{shown}</p>
      {needsToggle && (
        <button type="button" className="landing-synax-toggle" onClick={() => setExpanded(v => !v)}>
          {expanded ? 'إخفاء' : 'قراءة السيرة كاملة'}
          <span className="material-symbols-outlined" aria-hidden="true">{expanded ? 'expand_less' : 'expand_more'}</span>
        </button>
      )}
    </Reveal>
  );
}

export default function SynaxariumSection() {
  const [day, setDay] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | unavailable

  useEffect(() => {
    let cancelled = false;
    apiClient.get('/synaxarium/today')
      .then(r => { if (!cancelled) { setDay(r.data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('unavailable'); });
    return () => { cancelled = true; };
  }, []);

  // Quiet on failure — a missing external page shouldn't visibly break the
  // landing page for every visitor while it's down.
  if (status === 'unavailable') return null;

  return (
    <section className="landing-section landing-synax-section" id="synaxarium">
      <div className="landing-section-heading">
        <span className="landing-section-eyebrow">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }} aria-hidden="true">auto_stories</span>
          سنكسار اليوم
        </span>
        <h2 className="landing-section-title">تذكار قديسي اليوم</h2>
        <p className="landing-section-subtitle">
          {status === 'ready' ? day.dayHeading : 'كل يوم تذكار وسيرة من سير القديسين والشهداء الأبرار'}
        </p>
      </div>

      {status === 'loading' && (
        <div className="landing-synax-loading" aria-live="polite">
          <span className="landing-synax-loading-dot" />
          <span className="landing-synax-loading-dot" />
          <span className="landing-synax-loading-dot" />
        </div>
      )}

      {status === 'ready' && (
        <>
          {day.blessing && (
            <Reveal className="landing-synax-blessing">
              <span className="material-symbols-outlined" aria-hidden="true">format_quote</span>
              <p>{day.blessing}</p>
            </Reveal>
          )}

          <div className="landing-synax-grid">
            {day.saints.map((s, i) => (
              <SaintCard key={i} saint={s} index={i} />
            ))}
          </div>

          {day.isStale && (
            <p className="landing-synax-stale-hint">
              يُعرض آخر سنكسار متاح — قد لا يعكس تذكار اليوم بدقة.
            </p>
          )}

          <a
            href="https://st-takla.org/zJ/index.php/ar-synaxarium"
            target="_blank"
            rel="noopener noreferrer"
            className="landing-synax-source"
          >
            المصدر: موقع الأنبا تكلاهيمانوت
            <span className="material-symbols-outlined" aria-hidden="true">north_west</span>
          </a>
        </>
      )}
    </section>
  );
}
