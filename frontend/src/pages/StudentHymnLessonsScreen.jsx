import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';

export default function StudentHymnLessonsScreen() {
  usePageTitle('دروس الألحان');
  const [items, setItems]         = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading]     = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [lessonsRes, progressRes] = await Promise.allSettled([
          apiClient.get('/hymn-lessons/my'),
          apiClient.get('/hymn-lessons/my-progress'),
        ]);
        if (lessonsRes.status === 'fulfilled') setItems(lessonsRes.value.data);
        if (progressRes.status === 'fulfilled') {
          const map = {};
          progressRes.value.data.forEach(p => { map[p.hymnLessonId] = p; });
          setProgressMap(map);
        }
      } catch { setItems([]); } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>;

  return (
    <>
      {items.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>music_note</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>لا توجد دروس ألحان لمرحلتك حالياً</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {items.map(item => {
            const p   = progressMap[item.id];
            const pct = p?.watchedPercent ?? 0;
            const done = p?.isCompleted ?? false;

            return (
              <div key={item.id} className="glass-card card-hover"
                style={{ padding: '1.5rem', border: `1px solid ${done ? 'rgba(16,185,129,0.35)' : 'var(--glass-border)'}` }}
                onClick={() => navigate(`/hymn-lessons/${item.id}`)
                }>

                {/* Top row: icon + title + completion badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '30px', color: done ? 'var(--success)' : 'var(--accent-gold)', flexShrink: 0 }}>
                    {done ? 'check_circle' : item.videoType === 2 ? 'smart_display' : item.videoType === 1 ? 'videocam' : 'music_note'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.97rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.stageName}</div>
                  </div>
                  {/* % badge */}
                  {item.videoType !== 0 && (done || pct > 0) && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '20px', whiteSpace: 'nowrap', flexShrink: 0,
                      background: done ? 'rgba(16,185,129,0.15)' : 'rgba(251,191,36,0.12)',
                      color: done ? 'var(--success)' : 'var(--accent-gold)' }}>
                      {done ? 'مكتمل' : `${Math.round(pct)}%`}
                    </span>
                  )}
                </div>

                {item.description && <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.75rem' }}>{item.description}</p>}

                {/* Progress bar */}
                {item.videoType !== 0 && pct > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ height: '3px', background: 'var(--surface-3)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: done ? 'var(--success)' : 'var(--accent-gold)', borderRadius: '2px' }} />
                    </div>
                  </div>
                )}

                {/* Content tags + action label */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {item.videoType !== 0 && (
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '20px', background: 'rgba(96,165,250,0.12)', color: 'var(--c-blue)' }}>
                      {item.videoType === 2 ? 'يوتيوب' : 'فيديو'}
                    </span>
                  )}
                  {(item.lyricsType === 1 || item.lyricsType === 3) && (
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '20px', background: 'rgba(239,68,68,0.12)', color: 'var(--c-red)' }}>PDF</span>
                  )}
                  {(item.lyricsType === 2 || item.lyricsType === 3) && (
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '20px', background: 'rgba(52,211,153,0.12)', color: 'var(--c-emerald)' }}>صورة</span>
                  )}
                  <span style={{ marginRight: 'auto', fontSize: '0.78rem', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {done ? 'مراجعة' : pct > 0 ? 'استكمال' : 'ابدأ'}
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_back</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
