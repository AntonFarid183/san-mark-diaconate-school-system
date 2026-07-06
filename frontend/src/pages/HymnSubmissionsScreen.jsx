import { useState, useEffect } from 'react';
import apiClient from '../apiClient';
import Layout from '../Layout';
import { BACKEND_URL as BASE } from '../config';

const STATUS_LABELS = {
  not_submitted: { label: 'لم يُسلّم', color: 'var(--text-muted)' },
  pending: { label: 'قيد المراجعة', color: 'var(--accent-gold)' },
  approved: { label: 'تمت الموافقة', color: 'var(--success)' },
  resubmission_requested: { label: 'مطلوب إعادة التسجيل', color: 'var(--danger)' },
};

export default function HymnSubmissionsScreen() {
  const [stages, setStages] = useState([]);
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [hymnLessons, setHymnLessons] = useState([]);

  const [stageId, setStageId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [classId, setClassId] = useState('');
  const [hymnLessonId, setHymnLessonId] = useState('');

  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [reviewItem, setReviewItem] = useState(null); // roster item being reviewed
  const [scoreInput, setScoreInput] = useState('');
  const [commentsInput, setCommentsInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get('/students/stages').then(r => setStages(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setGradeId(''); setClasses([]); setClassId(''); setHymnLessonId(''); setHymnLessons([]); setRoster([]);
    if (stageId) apiClient.get(`/students/grades/${stageId}`).then(r => setGrades(r.data)).catch(() => setGrades([]));
    else setGrades([]);
  }, [stageId]);

  useEffect(() => {
    setClassId(''); setRoster([]);
    if (gradeId) {
      // Classes are scoped to the current academic year
      apiClient.get('/academic-years').then(yRes => {
        const current = yRes.data.find(y => y.isCurrent);
        if (current) {
          apiClient.get('/classes', { params: { gradeId, academicYearId: current.id } })
            .then(r => setClasses(r.data)).catch(() => setClasses([]));
        }
      }).catch(() => {});
    } else {
      setClasses([]);
    }
  }, [gradeId]);

  useEffect(() => {
    setHymnLessonId(''); setRoster([]);
    if (stageId) {
      apiClient.get('/hymn-lessons', { params: { stageId } }).then(r => setHymnLessons(r.data)).catch(() => setHymnLessons([]));
    }
  }, [stageId]);

  const loadRoster = async () => {
    if (!hymnLessonId || !gradeId) return;
    setLoading(true);
    setRoster([]);
    try {
      const r = await apiClient.get('/hymn-submissions/roster', {
        params: { hymnLessonId, gradeId, classId: classId || undefined }
      });
      setRoster(r.data);
    } catch {
      setMsg({ type: 'error', text: 'فشل تحميل القائمة.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoster(); }, [hymnLessonId, classId]);

  const openReview = (item) => {
    setReviewItem(item);
    setScoreInput(item.score != null ? String(item.score) : '');
    setCommentsInput(item.comments || '');
  };

  const submitReview = async (approve) => {
    if (!reviewItem?.submissionId) return;
    if (approve && (!scoreInput || parseFloat(scoreInput) < 0)) {
      setMsg({ type: 'error', text: 'الدرجة مطلوبة عند الموافقة.' });
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(`/hymn-submissions/${reviewItem.submissionId}/review`, {
        score: approve ? parseFloat(scoreInput) : null,
        comments: commentsInput.trim() || null,
        approve,
      });
      setReviewItem(null);
      loadRoster();
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل حفظ المراجعة.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="مراجعة تسجيلات الألحان">
      <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        استعرض تسجيلات الطلاب لكل لحن وقيّمها.
      </p>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
          {msg.text}
          <span style={{ cursor: 'pointer' }} onClick={() => setMsg(null)}>✕</span>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '160px' }}>
            <label style={labelStyle}>المرحلة</label>
            <select className="premium-input" value={stageId} onChange={e => setStageId(e.target.value)}>
              <option value="">اختر المرحلة</option>
              {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ minWidth: '160px' }}>
            <label style={labelStyle}>الصف</label>
            <select className="premium-input" value={gradeId} onChange={e => setGradeId(e.target.value)} disabled={!stageId}>
              <option value="">اختر الصف</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div style={{ minWidth: '160px' }}>
            <label style={labelStyle}>الفصل (اختياري)</label>
            <select className="premium-input" value={classId} onChange={e => setClassId(e.target.value)} disabled={!gradeId}>
              <option value="">كل الفصول</option>
              {classes.map(c => <option key={c.id} value={c.id}>فصل {c.name}</option>)}
            </select>
          </div>
          <div style={{ minWidth: '200px' }}>
            <label style={labelStyle}>اللحن</label>
            <select className="premium-input" value={hymnLessonId} onChange={e => setHymnLessonId(e.target.value)} disabled={!stageId}>
              <option value="">اختر اللحن</option>
              {hymnLessons.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>جاري التحميل...</p>
      ) : !hymnLessonId || !gradeId ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)', display: 'block', marginBottom: '1rem' }}>music_note</span>
          <p style={{ color: 'var(--text-muted)' }}>اختر المرحلة والصف واللحن لعرض التسجيلات</p>
        </div>
      ) : roster.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>لا يوجد طلاب في هذا الصف</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(15,23,42,0.4)' }}>
                  <th style={thStyle}>الطالب</th>
                  <th style={thStyle}>الفصل</th>
                  <th style={thStyle}>الحالة</th>
                  <th style={thStyle}>تاريخ التسليم</th>
                  <th style={thStyle}>الدرجة</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {roster.map(item => {
                  const status = STATUS_LABELS[item.status];
                  return (
                    <tr key={item.studentId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600 }}>{item.studentName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.studentCode}</div>
                      </td>
                      <td style={tdStyle}>{item.className || '—'}</td>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '0.78rem', padding: '0.2rem 0.7rem', borderRadius: '20px', background: `${status.color}22`, color: status.color, fontWeight: 600 }}>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('ar-EG') : '—'}
                      </td>
                      <td style={tdStyle}>{item.score ?? '—'}</td>
                      <td style={tdStyle}>
                        {item.submissionId ? (
                          <button onClick={() => openReview(item)} className="btn-secondary" style={{ padding: '0.3rem 1rem', fontSize: '0.8rem' }}>
                            استماع ومراجعة
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review modal */}
      {reviewItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setReviewItem(null)}>
          <div className="glass-card" style={{ padding: '2rem', width: '480px', maxWidth: '92vw', direction: 'rtl' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.25rem' }}>{reviewItem.studentName}</h3>

            <audio controls src={`${BASE}${reviewItem.recordingUrl}`} style={{ width: '100%', marginBottom: '1.25rem' }} />

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>الدرجة</label>
              <input className="premium-input" type="number" min="0" step="0.5" value={scoreInput} onChange={e => setScoreInput(e.target.value)} placeholder="مثال: 9" />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>ملاحظات (اختياري)</label>
              <textarea className="premium-input" value={commentsInput} onChange={e => setCommentsInput(e.target.value)} style={{ width: '100%', minHeight: '80px', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => submitReview(true)} disabled={saving} style={{ flex: 1, padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--success)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
                {saving ? '...' : 'موافقة'}
              </button>
              <button onClick={() => submitReview(false)} disabled={saving} style={{ flex: 1, padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
                طلب إعادة تسجيل
              </button>
              <button onClick={() => setReviewItem(null)} className="btn-secondary" style={{ flex: 1 }}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

const labelStyle = {
  display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600,
};

const thStyle = {
  padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, fontSize: '0.8rem',
  color: 'var(--text-muted)', whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '0.65rem 1rem', whiteSpace: 'nowrap',
};
