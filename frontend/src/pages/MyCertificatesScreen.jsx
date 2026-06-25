import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import Layout from '../Layout';

const classifyColor = (p) => {
  if (p >= 90) return 'var(--success)';
  if (p >= 80) return '#60a5fa';
  if (p >= 70) return 'var(--warning)';
  if (p >= 60) return '#a78bfa';
  return 'var(--danger)';
};

const MyCertificatesScreen = () => {
  const navigate = useNavigate();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const r = await apiClient.get('/certificate/my');
        setCerts(r.data);
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <Layout title="شهاداتي"><p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p></Layout>;

  return (
    <Layout title="شهاداتي">
      {certs.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>workspace_premium</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>لا توجد شهادات حتى الآن</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>تصدر الشهادات تلقائياً عند اعتماد نتائج الامتحانات</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {certs.map(c => {
            const pct = Math.round(c.percentage);
            return (
              <div key={c.id} className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: classifyColor(pct) }}>workspace_premium</span>
                <h3 style={{ color: 'var(--accent-gold)', margin: '0.75rem 0 0.25rem', fontSize: '1rem' }}>{c.examTitle}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.gradeName} — {c.academicYear}</p>
                <div style={{ margin: '1rem 0' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 700, color: classifyColor(pct) }}>{pct}%</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>{c.classification}</span>
                </div>
                <button className="btn-primary" style={{ width: '100%' }} onClick={() => navigate(`/certificates/${c.id}`)}>
                  عرض الشهادة
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default MyCertificatesScreen;
