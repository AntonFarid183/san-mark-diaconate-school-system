import { useState, useEffect } from 'react';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';

const ProgressScreen = () => {
  usePageTitle('ملخص التقدم');
  const [progressData, setProgressData] = useState(null);
  const [expandedStage, setExpandedStage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get('/progress/dashboard');
        setProgressData(res.data);
        if (res.data.stages?.length > 0) setExpandedStage(res.data.stages[0].stageId);
      } catch (err) { console.error('Failed to load progress', err); } finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>;
  if (!progressData) return <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--danger)' }}>فشل تحميل البيانات</p>;

  const { overallProgress, completedLessons, totalLessons, stages, recentActivity } = progressData;

  return (
    <>
      {/* Overall progress card */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ position: 'relative', width: '100px', height: '100px' }}>
          <svg width="100" height="100" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--surface-3)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--accent-gold)" strokeWidth="3" strokeDasharray={`${overallProgress || 0}, 100`} strokeLinecap="round" transform="rotate(-90 18 18)" />
          </svg>
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-gold)' }}>{overallProgress || 0}%</span>
        </div>
        <div>
          <h3 style={{ color: '#fff', fontSize: '1.1rem' }}>التقدم العام</h3>
          <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>تم إكمال {completedLessons || 0} من أصل {totalLessons || 0} درس</p>
          <div style={{ marginTop: '0.75rem', height: '8px', background: 'var(--surface-3)', borderRadius: '4px', overflow: 'hidden', minWidth: '200px' }}>
            <div style={{ width: `${totalLessons > 0 ? ((completedLessons || 0) / (totalLessons || 1)) * 100 : 0}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-gold-hover))', borderRadius: '4px' }} />
          </div>
        </div>
      </div>

      {/* Stages with collapsible sections */}
      {stages?.map(stage => (
        <div key={stage.stageId} className="glass-card" style={{ marginBottom: '1rem', overflow: 'hidden', padding: 0 }}>
          <div onClick={() => setExpandedStage(expandedStage === stage.stageId ? null : stage.stageId)}
            style={{ padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{stage.stageName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {stage.completedLessons}/{stage.totalLessons} دروس مكتملة
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '80px', height: '6px', background: 'var(--surface-3)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${stage.totalLessons > 0 ? (stage.completedLessons / stage.totalLessons) * 100 : 0}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-gold-hover))', borderRadius: '3px' }} />
              </div>
              <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', transform: expandedStage === stage.stageId ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>expand_more</span>
            </div>
          </div>
          {expandedStage === stage.stageId && stage.lessons?.length > 0 && (
            <div style={{ borderTop: '1px solid var(--glass-border)', padding: '0.5rem 0' }}>
              {stage.lessons.map(lesson => (
                <div key={lesson.lessonId} style={{ padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: lesson.isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'var(--surface-3)',
                      border: lesson.isCompleted ? '2px solid var(--success)' : '2px solid var(--divider)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 700, color: lesson.isCompleted ? 'var(--success)' : 'var(--text-secondary)',
                    }}>{lesson.lessonNumber}</span>
                    <div>
                      <div style={{ fontSize: '0.85rem' }}>{lesson.title}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lesson.status}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {lesson.progress > 0 && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>{lesson.progress}%</span>
                    )}
                    {lesson.isCompleted && (
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--success)' }}>check_circle</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Recent activity */}
      {recentActivity?.length > 0 && (
        <div className="glass-card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
          <h3 style={{ color: 'var(--accent-gold)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>آخر النشاطات</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentActivity.map((act, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--surface-2)' }}>
                <div style={{ fontSize: '0.85rem' }}>{act.description}</div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(act.timestamp).toLocaleDateString('ar-EG')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ProgressScreen;
