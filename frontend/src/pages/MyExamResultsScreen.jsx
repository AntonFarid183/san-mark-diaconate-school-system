import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import Layout from '../Layout';

const PERIOD_LABEL = { 0: 'منتصف الفصل', 1: 'نهاية الفصل', 2: 'مكمل' };
const STATUS_LABEL = { 0: 'معلق', 1: 'مقبول', 2: 'مرفوض' };
const STATUS_COLOR = { 0: 'var(--warning)', 1: 'var(--success)', 2: 'var(--danger)' };

const classifyColor = (p) => {
  if (p >= 60) return 'var(--success)';
  return 'var(--danger)';
};

const classify = (p) => {
  if (p >= 90) return 'امتياز';
  if (p >= 80) return 'جيد جداً';
  if (p >= 70) return 'جيد';
  if (p >= 60) return 'مقبول';
  return 'راسب';
};

const MyExamResultsScreen = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const r = await apiClient.get('/exam/my-results');
        setResults(r.data);
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <Layout title="نتائجي"><p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p></Layout>;

  return (
    <Layout title="نتائجي">
      {results.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>assignment</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>لا توجد نتائج حتى الآن</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {results.map(r => {
            const p = Math.round(r.percentage);
            return (
              <div key={r.id} className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.25rem' }}>{r.examTitle}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.academicYear} — {PERIOD_LABEL[r.period]}</div>
                  </div>
                  <span style={{ padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', background: `${STATUS_COLOR[r.status]}22`, color: STATUS_COLOR[r.status] }}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: classifyColor(p) }}>{p}%</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>النسبة</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{r.score}/{r.totalScore}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>الدرجة</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: classifyColor(p) }}>{classify(p)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>التقدير</div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ flex: 1 }}>
                    <div style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ width: `${p}%`, height: '100%', background: p >= 60 ? 'var(--success)' : 'var(--danger)', borderRadius: '5px', transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                </div>

                {r.notes && <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}>ملاحظة: {r.notes}</p>}

                {r.certificateId && r.status === 1 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <button className="btn-secondary" style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                      onClick={() => navigate(`/certificates/${r.certificateId}`)}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>workspace_premium</span>
                      عرض الشهادة
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default MyExamResultsScreen;
