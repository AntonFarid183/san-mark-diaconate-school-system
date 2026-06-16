import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import Layout from '../Layout';

const ContentPlayer = ({ item }) => {
  const [progress, setProgress] = useState(item.studentProgress || 0);
  const [isCompleted, setIsCompleted] = useState(item.isCompleted || false);
  const mediaRef = useRef(null);
  const heartbeatRef = useRef(null);

  const sendHeartbeat = async (pos, pct) => {
    try {
      await apiClient.post('/progress/heartbeat', {
        contentItemId: item.id,
        lessonId: item.lessonId,
        progress: pct,
        lastPosition: pos,
        accessType: item.type,
      });
    } catch {}
  };

  useEffect(() => {
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  }, []);

  const handleProgress = (pct, pos) => {
    setProgress(Math.max(progress, pct));
    if (pct >= item.completionThreshold && !isCompleted) {
      setIsCompleted(true);
    }
  };

  const typeIcon = { Pdf: 'picture_as_pdf', Video: 'play_circle', Audio: 'music_note', Image: 'image' };

  if (item.type === 'Video') {
    return (
      <div>
        <video ref={mediaRef} controls style={{ width: '100%', borderRadius: 'var(--radius-sm)' }}
          onTimeUpdate={(e) => {
            const pct = Math.round((e.target.currentTime / e.target.duration) * 100);
            handleProgress(pct, Math.round(e.target.currentTime));
          }}
          onPlay={() => {
            heartbeatRef.current = setInterval(() => {
              if (mediaRef.current) {
                const pct = Math.round((mediaRef.current.currentTime / mediaRef.current.duration) * 100);
                sendHeartbeat(Math.round(mediaRef.current.currentTime), pct);
              }
            }, 30000);
          }}
          onPause={() => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); }}
          src={item.fileUrl} />
      </div>
    );
  }

  if (item.type === 'Audio') {
    return (
      <div>
        <audio ref={mediaRef} controls style={{ width: '100%' }}
          onTimeUpdate={(e) => {
            const pct = Math.round((e.target.currentTime / e.target.duration) * 100);
            handleProgress(pct, Math.round(e.target.currentTime));
          }}
          onPlay={() => {
            heartbeatRef.current = setInterval(() => {
              if (mediaRef.current) {
                const pct = Math.round((mediaRef.current.currentTime / mediaRef.current.duration) * 100);
                sendHeartbeat(Math.round(mediaRef.current.currentTime), pct);
              }
            }, 15000);
          }}
          onPause={() => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); }}
          src={item.fileUrl} />
      </div>
    );
  }

  if (item.type === 'Pdf') {
    return (
      <div>
        <iframe src={item.fileUrl} style={{ width: '100%', height: '600px', borderRadius: 'var(--radius-sm)', border: 'none' }}
          title={item.title} />
        <div style={{ marginTop: '0.5rem', display: 'flex', justifyItems: 'center', gap: '0.5rem' }}>
          {item.downloadAllowed && (
            <a href={item.fileUrl} download className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
              تحميل
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <img src={item.fileUrl} alt={item.title} style={{ maxWidth: '100%', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }} />
    </div>
  );
};

const LessonDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get(`/content/lessons/${id}`);
        setLesson(res.data);
        if (res.data.contentItems?.length > 0) {
          setActiveItem(res.data.contentItems[0]);
        }
      } catch {
        setLesson(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <Layout title="عرض الدرس"><p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p></Layout>;
  if (!lesson) return <Layout title="عرض الدرس"><p style={{ textAlign: 'center', padding: '3rem', color: 'var(--danger)' }}>الدرس غير موجود</p></Layout>;

  const completedCount = lesson.contentItems?.filter(ci => ci.isCompleted).length || 0;
  const totalCount = lesson.contentItems?.length || 0;

  return (
    <Layout title={lesson.title}>
      {/* Back button */}
      <button onClick={() => navigate('/lessons')} className="btn-secondary" style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
        العودة للدروس
      </button>

      {/* Lesson header */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ color: 'var(--accent-gold)', fontSize: '1.2rem' }}>{lesson.title}</h2>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>{lesson.description}</p>
          </div>
          {lesson.lessonNumber && (
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'rgba(251, 191, 36, 0.15)', border: '2px solid var(--accent-gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent-gold)', fontWeight: 700, fontSize: '1.1rem',
            }}>{lesson.lessonNumber}</div>
          )}
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>المرحلة: {lesson.stageName}</span>
          <span>الصف: {lesson.gradeName}</span>
          {lesson.weekNumber && <span>الأسبوع: {lesson.weekNumber}</span>}
        </div>
        {/* Progress bar */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
            <span>تم إكمال {completedCount} من {totalCount}</span>
            <span style={{ color: 'var(--accent-gold)' }}>{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-gold-hover))', borderRadius: '3px', transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>

      {/* Content player area */}
      {activeItem && (
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--accent-gold)' }}>
              {activeItem.type === 'Pdf' ? 'picture_as_pdf' : activeItem.type === 'Video' ? 'play_circle' : activeItem.type === 'Audio' ? 'music_note' : 'image'}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{activeItem.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {activeItem.type === 'Video' || activeItem.type === 'Audio' ? `${Math.floor((activeItem.durationSeconds || 0) / 60)}:${String((activeItem.durationSeconds || 0) % 60).padStart(2, '0')} د` : ''}
                {activeItem.fileSize ? ` — ${(activeItem.fileSize / 1024 / 1024).toFixed(1)} MB` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {activeItem.isCompleted ? (
                <span className="material-symbols-outlined" style={{ color: 'var(--success)' }}>check_circle</span>
              ) : (
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'rgba(251, 191, 36, 0.15)', borderRadius: '12px', color: 'var(--accent-gold)' }}>
                  {activeItem.studentProgress || 0}%
                </span>
              )}
            </div>
          </div>
          <ContentPlayer item={activeItem} />
        </div>
      )}

      {/* Content items sidebar */}
      {lesson.contentItems?.length > 0 && (
        <div className="glass-card" style={{ padding: '1rem' }}>
          <h3 style={{ color: 'var(--accent-gold)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>محتويات الدرس</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {lesson.contentItems.map((item, i) => (
              <div key={item.id} onClick={() => setActiveItem(item)} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                background: activeItem?.id === item.id ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                border: activeItem?.id === item.id ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid transparent',
              }}>
                <span style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)',
                }}>{i + 1}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: item.isCompleted ? 'var(--success)' : 'var(--text-muted)' }}>
                  {item.type === 'Pdf' ? 'picture_as_pdf' : item.type === 'Video' ? 'play_circle' : item.type === 'Audio' ? 'music_note' : 'image'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.title}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {item.type === 'Pdf' ? 'PDF' : item.type === 'Video' ? 'فيديو' : item.type === 'Audio' ? 'صوتي' : 'صورة'}
                    {` — ${(item.fileSize / 1024 / 1024).toFixed(1)} MB`}
                  </div>
                </div>
                {item.isCompleted ? (
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--success)' }}>check_circle</span>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: item.studentProgress > 0 ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                    {item.studentProgress > 0 ? `${item.studentProgress}%` : ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default LessonDetailScreen;
