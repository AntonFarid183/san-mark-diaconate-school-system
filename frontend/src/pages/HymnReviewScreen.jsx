import { useState, useEffect } from 'react';
import Layout from '../Layout';
import apiClient from '../apiClient';

const statusBadge = (status) => {
  const map = {
    Submitted: { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', label: 'بانتظار المراجعة' },
    Approved: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', label: 'مقبول' },
    Rejected: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', label: 'مرفوض' },
  };
  const s = map[status] || map.Submitted;
  return <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.7rem', borderRadius: '20px', background: s.bg, color: s.color, fontWeight: 600 }}>{s.label}</span>;
};

const HymnReviewScreen = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [grade, setGrade] = useState(70);
  const [activeTab, setActiveTab] = useState('pending');
  const [submitting, setSubmitting] = useState(false);

  const fetchSubmissions = async (filter) => {
    try {
      const url = filter === 'pending' ? '/hymn/submissions?filter=pending' : '/hymn/submissions';
      const res = await apiClient.get(url);
      setSubmissions(res.data || []);
    } catch {
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(activeTab);
  }, [activeTab]);

  const pendingCount = submissions.filter(s => s.status === 'Submitted').length;

  const submitReview = async (decision) => {
    if (!review || submitting) return;
    setSubmitting(true);
    try {
      await apiClient.put(`/hymn/submissions/${review.id}/review`, {
        status: decision,
        feedback,
        grade: decision === 'Approved' ? grade : null,
      });
      setReview(null);
      setFeedback('');
      setGrade(70);
      fetchSubmissions(activeTab);
    } catch {}
    setSubmitting(false);
  };

  const filteredSubmissions = activeTab === 'pending'
    ? submissions.filter(s => s.status === 'Submitted')
    : submissions;

  if (loading) return <Layout title="مراجعة الألحان"><p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p></Layout>;

  return (
    <Layout title="مراجعة الألحان">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.9rem' }}>{pendingCount} تسجيلات بانتظار المراجعة</p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setActiveTab('pending')} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 1rem', background: activeTab === 'pending' ? 'rgba(251,191,36,0.15)' : 'transparent' }}>قيد الانتظار</button>
          <button onClick={() => setActiveTab('all')} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 1rem', background: activeTab === 'all' ? 'rgba(251,191,36,0.15)' : 'transparent' }}>الكل</button>
        </div>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>rate_review</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>لا توجد تسجيلات {activeTab === 'pending' ? 'بانتظار المراجعة' : ''}</p>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <th style={{ textAlign: 'right', padding: '0.75rem 1rem' }}>الطالب</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 1rem' }}>اللحن</th>
                <th style={{ textAlign: 'center', padding: '0.75rem 1rem' }}>تاريخ التقديم</th>
                <th style={{ textAlign: 'center', padding: '0.75rem 1rem' }}>الحالة</th>
                <th style={{ textAlign: 'center', padding: '0.75rem 1rem' }}>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map(sub => (
                <tr key={sub.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{sub.studentName}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{sub.hymnTitle}</td>
                  <td style={{ textAlign: 'center', padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(sub.submittedAt).toLocaleDateString('ar-EG')}
                  </td>
                  <td style={{ textAlign: 'center', padding: '0.75rem 1rem' }}>{statusBadge(sub.status)}</td>
                  <td style={{ textAlign: 'center', padding: '0.75rem 1rem' }}>
                    <button onClick={() => { setReview(sub); setFeedback(sub.feedback || ''); setGrade(sub.grade || 70); }}
                      className={sub.status === 'Submitted' ? 'btn-primary' : 'btn-secondary'}
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.8rem' }}>
                      {sub.status === 'Submitted' ? 'مراجعة' : 'عرض'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {review && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setReview(null); } }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '1.5rem' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>مراجعة: {review.hymnTitle}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>الطالب: </span>{review.studentName}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>تاريخ التقديم: </span>{new Date(review.submittedAt).toLocaleDateString('ar-EG')}</div>
              </div>

              <div className="glass-card" style={{ padding: '1rem', textAlign: 'center', margin: '0.5rem 0' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--accent-gold)' }}>music_note</span>
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {review.audioUrl ? (
                    <audio controls src={review.audioUrl} style={{ width: '100%' }} />
                  ) : (
                    'مشغل التسجيل سيكون متاحًا عند رفع الملفات'
                  )}
                </div>
              </div>

              {review.status === 'Submitted' ? (
                <>
                  <div>
                    <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>الدرجة (0-100)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="range" min="0" max="100" value={grade} onChange={e => setGrade(parseInt(e.target.value))} style={{ flex: 1 }} />
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-gold)', minWidth: '40px' }}>{grade}</span>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>الملاحظات</label>
                    <textarea value={feedback} onChange={e => setFeedback(e.target.value)} className="input-field" style={{ minHeight: '80px' }} placeholder="اكتب ملاحظاتك هنا..." />
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => setReview(null)} className="btn-secondary">إلغاء</button>
                    <button onClick={() => submitReview('Approved')} disabled={submitting} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
                      قبول
                    </button>
                    <button onClick={() => submitReview('Rejected')} disabled={submitting} style={{ padding: '0.5rem 1.2rem', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                      رفض
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {review.grade && (
                    <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(16,185,129,0.1)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الدرجة</div>
                      <div style={{ fontSize: '2rem', fontWeight: 700, color: review.grade >= 70 ? '#10b981' : '#ef4444' }}>{review.grade}%</div>
                    </div>
                  )}
                  {review.feedback && (
                    <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600, color: '#fff' }}>الملاحظات: </span>{review.feedback}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                    <button onClick={() => setReview(null)} className="btn-secondary">إغلاق</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default HymnReviewScreen;
