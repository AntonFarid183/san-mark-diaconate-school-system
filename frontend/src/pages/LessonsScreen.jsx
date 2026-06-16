import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import Layout from '../Layout';

const statusChip = (status) => {
  const styles = {
    NEW: { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', label: 'جديد' },
    'In Progress': { bg: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', label: 'قيد التقدم' },
    Completed: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', label: 'مكتمل' },
  };
  const s = styles[status] || { bg: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)', label: status };
  return (
    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: s.bg, color: s.color, fontWeight: 600 }}>
      {s.label}
    </span>
  );
};

const LessonsScreen = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const filters = [
    { key: 'ALL', label: 'الكل' },
    { key: 'Published', label: 'المنشورة' },
    { key: 'In Progress', label: 'قيد التقدم' },
    { key: 'Completed', label: 'المكتملة' },
  ];

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const profileRes = await apiClient.get('/students/me');
        const gradeId = profileRes.data.gradeId;
        const res = await apiClient.get(`/content/lessons?gradeId=${gradeId}&pageSize=50`);
        setLessons(res.data.lessons || []);
      } catch {
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, []);

  const filteredLessons = activeFilter === 'ALL'
    ? lessons
    : lessons.filter(l => {
        if (activeFilter === 'Published') return l.isPublished;
        if (activeFilter === 'In Progress') return false;
        if (activeFilter === 'Completed') return false;
        return true;
      });

  return (
    <Layout title="الدروس">
      <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>تصفح الدروس المتاحة للمرحلة الدراسية الخاصة بك</p>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button key={f.key} onClick={() => setActiveFilter(f.key)} style={{
            padding: '0.4rem 1.2rem', borderRadius: '20px', border: activeFilter === f.key ? 'none' : '1px solid var(--glass-border)',
            background: activeFilter === f.key ? 'var(--accent-gold)' : 'transparent',
            color: activeFilter === f.key ? '#1e293b' : 'var(--text-secondary)',
            fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
          }}>{f.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="glass-card" style={{ padding: '1.5rem', animation: 'pulse 1.5s infinite' }}>
              <div style={{ height: '20px', width: '60%', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', marginBottom: '1rem' }} />
              <div style={{ height: '12px', width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '0.5rem' }} />
              <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }} />
            </div>
          ))}
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>menu_book</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>لا توجد دروس متاحة لهذا الصف</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {filteredLessons.map(lesson => (
            <div key={lesson.id} className="glass-card" style={{ padding: '1.25rem', cursor: 'pointer', position: 'relative' }}
              onClick={() => navigate(`/lessons/${lesson.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: 'rgba(251, 191, 36, 0.15)', border: '2px solid var(--accent-gold)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent-gold)', fontWeight: 700, fontSize: '1.1rem',
                  }}>{lesson.lessonNumber}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{lesson.title}</div>
                    {lesson.weekNumber && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0.15rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'inline-block', marginTop: '0.2rem' }}>
                        الأسبوع {lesson.weekNumber}
                      </span>
                    )}
                  </div>
                </div>
                {statusChip(lesson.isPublished ? (lesson.completed ? 'Completed' : 'Published') : 'NEW')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>description</span>
                  {lesson.contentItemCount || 0} ملفات
                </span>
                <div style={{ flex: 1, margin: '0 1rem', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: '0%', height: '100%', background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-gold-hover))', borderRadius: '2px' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default LessonsScreen;
