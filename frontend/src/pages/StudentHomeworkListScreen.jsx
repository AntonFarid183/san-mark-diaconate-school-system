import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import Layout from '../Layout';

export default function StudentHomeworkListScreen() {
  const navigate = useNavigate();
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/homework/my').then(r => setHomeworks(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="الواجبات">
      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>جاري التحميل...</p>
      ) : homeworks.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)', display: 'block', marginBottom: '1rem' }}>assignment</span>
          <p style={{ color: 'var(--text-muted)' }}>لا توجد واجبات حالياً</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {homeworks.map(hw => (
            <div key={hw.id} className="glass-card table-row-hover" style={{ padding: '1.1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate(`/homework/${hw.id}`)}>
              <div>
                <div style={{ fontWeight: 700 }}>{hw.title}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{hw.subjectName} — {hw.totalMarks} درجة</div>
              </div>
              {hw.hasSubmitted ? (
                <span style={{ fontSize: '0.85rem', fontWeight: 700, padding: '0.3rem 0.9rem', borderRadius: '20px', background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }}>
                  {hw.score} / {hw.totalMarks}
                </span>
              ) : (
                <span style={{ fontSize: '0.8rem', padding: '0.3rem 0.9rem', borderRadius: '20px', background: 'rgba(251,191,36,0.12)', color: 'var(--accent-gold)', fontWeight: 700 }}>
                  لم يُحل بعد
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
