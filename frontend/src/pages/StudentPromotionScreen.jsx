import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import Layout from '../Layout';

const StudentPromotionScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [history, setHistory] = useState([]);
  const [stages, setStages] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ toGradeId: '', academicYear: '', notes: '' });
  const [msg, setMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [studentRes, historyRes, stagesRes] = await Promise.allSettled([
          apiClient.get(`/students/${id}`),
          apiClient.get(`/students/${id}/grade-history`),
          apiClient.get('/students/stages'),
        ]);
        if (studentRes.status === 'fulfilled') setStudent(studentRes.value.data);
        if (historyRes.status === 'fulfilled') setHistory(historyRes.value.data);
        if (stagesRes.status === 'fulfilled') setStages(stagesRes.value.data);
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    fetchAll();
  }, [id]);

  const fetchGrades = async (stageId) => {
    try {
      const r = await apiClient.get(`/students/grades/${stageId}`);
      setGrades(r.data);
    } catch { setGrades([]); }
  };

  const promote = async () => {
    if (!form.toGradeId || !form.academicYear) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/students/${id}/promote`, form);
      setMsg({ type: 'success', text: 'تم ترقية الطالب بنجاح.' });
      setForm({ toGradeId: '', academicYear: '', notes: '' });
      const [s, h] = await Promise.all([
        apiClient.get(`/students/${id}`),
        apiClient.get(`/students/${id}/grade-history`),
      ]);
      setStudent(s.data);
      setHistory(h.data);
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل الترقية.' });
    } finally { setSubmitting(false); }
  };

  if (loading) return <Layout title="ترقية الطالب"><p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p></Layout>;

  return (
    <Layout title="ترقية الطالب">
      <button className="btn-secondary" style={{ width: 'auto', padding: '0.4rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        onClick={() => navigate(`/students/${id}`)}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
        رجوع
      </button>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 'var(--radius-sm)', background: msg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
          {msg.text}
          <span style={{ cursor: 'pointer' }} onClick={() => setMsg(null)}>✕</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem' }}>
        {/* Student info + promotion form */}
        <div>
          {student && (
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
              <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.75rem' }}>{student.fullName}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>كود: {student.studentCode}</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>المرحلة الحالية: <strong>{student.stageName}</strong></p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>السنة الحالية: <strong>{student.gradeName}</strong></p>
            </div>
          )}

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>ترقية إلى</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <select className="input-field" onChange={e => { fetchGrades(e.target.value); setForm({ ...form, toGradeId: '' }); }}>
                <option value="">اختر المرحلة</option>
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select className="input-field" value={form.toGradeId} onChange={e => setForm({ ...form, toGradeId: e.target.value })}>
                <option value="">اختر السنة الدراسية</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <input className="input-field" placeholder="العام الدراسي (مثال: 2024/2025)" value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })} />
              <textarea className="input-field" placeholder="ملاحظات (اختياري)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ resize: 'vertical' }} />
              <button className="btn-primary" onClick={promote} disabled={!form.toGradeId || !form.academicYear || submitting}>
                {submitting ? 'جاري الترقية...' : 'ترقية الطالب'}
              </button>
            </div>
          </div>
        </div>

        {/* History */}
        <div>
          <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>سجل الترقيات</h3>
          {history.length === 0 ? (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا يوجد سجل ترقيات</div>
          ) : (
            <div className="glass-card" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)' }}>
                    {['من', 'إلى', 'العام الدراسي', 'التاريخ', 'ملاحظات'].map(h => (
                      <th key={h} style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{h.fromGradeName}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'var(--accent-gold)' }}>{h.toGradeName}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{h.academicYear}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(h.promotedAt).toLocaleDateString('ar-EG')}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{h.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentPromotionScreen;
