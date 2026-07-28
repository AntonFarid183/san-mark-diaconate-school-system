import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';

// Cycled deterministically per subject name so the palette stays consistent
// across visits without needing a hardcoded subject → color map.
const SUBJECT_PALETTE = [
  { color: 'var(--accent-amber)', bg: 'rgba(245,158,11,0.12)', icon: 'menu_book' },
  { color: 'var(--accent-blue)', bg: 'rgba(59,130,246,0.12)', icon: 'auto_stories' },
  { color: 'var(--accent-violet)', bg: 'rgba(167,139,250,0.12)', icon: 'church' },
  { color: 'var(--c-green)', bg: 'rgba(34,197,94,0.12)', icon: 'history_edu' },
  { color: 'var(--c-pink)', bg: 'rgba(244,114,182,0.12)', icon: 'psychology' },
  { color: 'var(--c-cyan)', bg: 'rgba(6,182,212,0.12)', icon: 'diversity_3' },
];

const paletteFor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return SUBJECT_PALETTE[hash % SUBJECT_PALETTE.length];
};

const scoreTone = (score, total) => {
  if (total <= 0) return { color: 'var(--success)', bg: 'rgba(16,185,129,0.15)' };
  const pct = score / total;
  if (pct >= 0.85) return { color: 'var(--success)', bg: 'rgba(16,185,129,0.15)' };
  if (pct >= 0.5) return { color: 'var(--accent-gold)', bg: 'rgba(251,191,36,0.15)' };
  return { color: 'var(--danger)', bg: 'rgba(239,68,68,0.15)' };
};

const motivationFor = (donePct, pendingCount) => {
  if (pendingCount === 0) return { icon: 'celebration', text: 'رائع! خلّصت كل واجباتك 🎉' };
  if (donePct >= 70) return { icon: 'local_fire_department', text: 'شغل ممتاز، باقي شوية وتخلّص الكل!' };
  if (donePct >= 30) return { icon: 'trending_up', text: 'كمّل كده، إنت في الطريق الصح!' };
  return { icon: 'rocket_launch', text: 'يلا نبدأ! كل واجب تحله بيقرّبك من هدفك' };
};

export default function StudentHomeworkListScreen() {
  usePageTitle('واجباتي');
  const navigate = useNavigate();
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/homework/my').then(r => setHomeworks(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>جاري التحميل...</p>;
  }

  if (homeworks.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '56px', color: 'var(--accent-gold)', display: 'block', marginBottom: '1rem' }}>emoji_events</span>
        <p style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem' }}>لا توجد واجبات دلوقتي</p>
        <p style={{ color: 'var(--text-muted)' }}>لما يكون فيه واجب جديد هتلاقيه هنا — استنى وشوف!</p>
      </div>
    );
  }

  const totalCount = homeworks.length;
  const doneCount = homeworks.filter(h => h.hasSubmitted).length;
  const pendingCount = totalCount - doneCount;
  const donePct = Math.round((doneCount / totalCount) * 100);
  const motivation = motivationFor(donePct, pendingCount);

  const bySubject = homeworks.reduce((acc, hw) => {
    (acc[hw.subjectName] ||= []).push(hw);
    return acc;
  }, {});

  return (
    <>
      {/* ── Progress hero ── */}
      <div
        className="glass-card"
        style={{
          padding: '1.5rem 1.75rem', marginBottom: '1.75rem',
          background: 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(251,191,36,0.02) 100%)',
          border: '1px solid rgba(251,191,36,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
              background: 'rgba(251,191,36,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--accent-gold)' }}>{motivation.icon}</span>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>{motivation.text}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                خلّصت {doneCount} من {totalCount} واجب
              </p>
            </div>
          </div>

          {/* Circular-ish progress bar */}
          <div style={{ minWidth: '160px', flex: 1, maxWidth: '260px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              <span>نسبة الإنجاز</span>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{donePct}%</span>
            </div>
            <div style={{ height: '10px', borderRadius: '20px', background: 'var(--surface-3)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${donePct}%`, borderRadius: '20px',
                background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-amber))',
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Subjects ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {Object.entries(bySubject).map(([subjectName, items]) => {
          const palette = paletteFor(subjectName);
          const subjectDone = items.filter(h => h.hasSubmitted).length;

          return (
            <div key={subjectName}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                  background: palette.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: palette.color }}>{palette.icon}</span>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{subjectName}</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {subjectDone} / {items.length}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.85rem' }}>
                {items.map(hw => {
                  const tone = hw.hasSubmitted ? scoreTone(hw.score ?? 0, hw.totalMarks) : null;
                  return (
                    <div
                      key={hw.id}
                      className="glass-card"
                      style={{
                        padding: '1.1rem 1.25rem', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                        borderTop: `3px solid ${palette.color}`,
                        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                      }}
                      onClick={() => navigate(`/homework/${hw.id}`)}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 30px var(--shadow-tint)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: '0.6rem', lineHeight: 1.4 }}>{hw.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{hw.totalMarks} درجة</span>
                        {hw.hasSubmitted ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', fontWeight: 700, padding: '0.25rem 0.7rem', borderRadius: '20px', background: tone.bg, color: tone.color }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                              {hw.score / hw.totalMarks >= 0.85 ? 'star' : 'check_circle'}
                            </span>
                            {hw.score} / {hw.totalMarks}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.78rem', padding: '0.25rem 0.7rem', borderRadius: '20px', background: palette.bg, color: palette.color, fontWeight: 700 }}>
                            يلا نحلّه
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
