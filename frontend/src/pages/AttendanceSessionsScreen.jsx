import { useState, useEffect } from 'react';
import apiClient from '../apiClient';
import Layout from '../Layout';

// Enum values mirror DiaconateSchool.Domain.Enums (serialized as numbers by the API)
const STATUS_LABELS = ['حاضر', 'متأخر', 'غائب', 'معتذر'];
const STATUS_COLORS = ['var(--success)', '#f59e0b', 'var(--danger)', 'var(--text-muted)'];
const SESSION_STATUS_LABELS = ['مجدولة', 'مفتوحة', 'مغلقة'];
const SESSION_SCHEDULED = 0;
const SESSION_OPEN = 1;
const SESSION_CLOSED = 2;

const AttendanceSessionsScreen = () => {
  const [grades, setGrades] = useState([]);
  const [gradeId, setGradeId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', gradeId: '', date: '' });
  const [expandedId, setExpandedId] = useState(null);
  const [roster, setRoster] = useState([]);
  const [records, setRecords] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [sessionPin, setSessionPin] = useState(null);

  useEffect(() => {
    apiClient.get('/students/grades').then(r => setGrades(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchSessions(); }, [gradeId]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (gradeId) params.gradeId = gradeId;
      const r = await apiClient.get('/attendance/sessions', { params });
      setSessions(r.data);
    } catch { setMsg({ type: 'error', text: 'فشل تحميل الجلسات.' }); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setForm({ title: '', gradeId: gradeId || '', date: new Date().toISOString().slice(0, 10) });
    setShowForm(true);
  };

  const submitCreate = async () => {
    try {
      await apiClient.post('/attendance/sessions', {
        title: form.title,
        gradeId: form.gradeId,
        startsAt: `${form.date}T00:00:00`,
        endsAt: `${form.date}T23:59:59`,
        lateAfterMinutes: 15,
      });
      setMsg({ type: 'success', text: 'تم إنشاء الجلسة.' });
      setShowForm(false);
      fetchSessions();
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل إنشاء الجلسة.' });
    }
  };

  const openSession = async (id) => {
    try {
      await apiClient.post(`/attendance/sessions/${id}/open`);
      fetchSessions();
    } catch { setMsg({ type: 'error', text: 'فشل فتح الجلسة.' }); }
  };

  const closeSession = async (id) => {
    if (!window.confirm('إغلاق الجلسة؟ سيتم تسجيل غياب لكل من لم يتم تسجيل حضوره.')) return;
    try {
      await apiClient.post(`/attendance/sessions/${id}/close`);
      setMsg({ type: 'success', text: 'تم إغلاق الجلسة.' });
      fetchSessions();
      if (expandedId === id) loadRoster({ id, gradeId: sessions.find(s => s.id === id)?.gradeId });
    } catch { setMsg({ type: 'error', text: 'فشل إغلاق الجلسة.' }); }
  };

  const loadRoster = async (session) => {
    setExpandedId(session.id);
    setRosterLoading(true);
    try {
      const [studentsRes, recordsRes, detailRes] = await Promise.all([
        apiClient.get('/students', { params: { gradeId: session.gradeId, pageSize: 300, page: 1 } }),
        apiClient.get(`/attendance/sessions/${session.id}/records`),
        apiClient.get(`/attendance/sessions/${session.id}`),
      ]);
      setRoster(studentsRes.data.students);
      setRecords(recordsRes.data);
      setSessionPin(detailRes.data.pin);
    } catch { setMsg({ type: 'error', text: 'فشل تحميل كشف الحضور.' }); }
    finally { setRosterLoading(false); }
  };

  const toggleExpand = (session) => {
    if (expandedId === session.id) { setExpandedId(null); return; }
    loadRoster(session);
  };

  const mark = async (sessionId, studentId, status) => {
    try {
      await apiClient.post(`/attendance/sessions/${sessionId}/checkin-manual`, { studentId, status });
      const recordsRes = await apiClient.get(`/attendance/sessions/${sessionId}/records`);
      setRecords(recordsRes.data);
      fetchSessions();
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل التسجيل.' });
    }
  };

  const recordFor = (studentId) => records.find(r => r.studentId === studentId);

  return (
    <Layout title="جلسات الحضور">
      {msg && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 'var(--radius-sm)', background: msg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
          {msg.text}
          <span style={{ cursor: 'pointer' }} onClick={() => setMsg(null)}>✕</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <select className="premium-input" value={gradeId} onChange={e => setGradeId(e.target.value)} style={{ maxWidth: '260px' }}>
          <option value="">كل الصفوف</option>
          {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.5rem' }} onClick={openCreate}>+ جلسة جديدة</button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>
      ) : sessions.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>event_busy</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>لا توجد جلسات</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sessions.map(s => (
            <div key={s.id} className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => toggleExpand(s)}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ color: 'var(--accent-gold)', fontSize: '1rem' }}>{s.title}</h3>
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.6rem', borderRadius: '20px', background: 'rgba(251,191,36,0.12)', color: 'var(--accent-gold)' }}>{s.gradeName}</span>
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.6rem', borderRadius: '20px', background: s.status === SESSION_OPEN ? 'rgba(16,185,129,0.15)' : s.status === SESSION_CLOSED ? 'rgba(148,163,184,0.15)' : 'rgba(251,191,36,0.12)', color: s.status === SESSION_OPEN ? 'var(--success)' : s.status === SESSION_CLOSED ? 'var(--text-muted)' : 'var(--accent-gold)' }}>
                      {SESSION_STATUS_LABELS[s.status]}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    {new Date(s.startsAt).toLocaleDateString('ar-EG')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem', display: 'flex', gap: '0.75rem' }}>
                    <span>حاضر: {s.presentCount}</span>
                    <span>متأخر: {s.lateCount}</span>
                    <span>غائب: {s.absentCount}</span>
                    <span>معتذر: {s.excusedCount}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                  {s.status === SESSION_SCHEDULED && (
                    <button className="btn-primary" style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => openSession(s.id)}>فتح الجلسة</button>
                  )}
                  {s.status === SESSION_OPEN && (
                    <button style={{ background: 'none', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '6px', padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => closeSession(s.id)}>إغلاق الجلسة</button>
                  )}
                </div>
              </div>

              {expandedId === s.id && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--glass-border)' }}>
                  {s.status === SESSION_OPEN && (
                    <div style={{ marginBottom: '1.25rem', textAlign: 'center', padding: '1rem', background: 'rgba(251,191,36,0.08)', borderRadius: 'var(--radius-sm)' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>رمز الدخول لهذه الجلسة</p>
                      <p style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '0.3rem', color: 'var(--accent-gold)' }}>{sessionPin || '......'}</p>
                    </div>
                  )}
                  {rosterLoading ? (
                    <p style={{ textAlign: 'center', padding: '1rem' }}>جاري التحميل...</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {roster.map(student => {
                        const rec = recordFor(student.id);
                        return (
                          <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                            <div>
                              <span style={{ fontSize: '0.88rem' }}>{student.fullName}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>({student.studentCode})</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                              {rec && (
                                <span style={{ fontSize: '0.75rem', color: STATUS_COLORS[rec.status], marginLeft: '0.5rem' }}>{STATUS_LABELS[rec.status]}</span>
                              )}
                              {STATUS_LABELS.map((label, st) => (
                                <button
                                  key={st}
                                  disabled={s.status !== SESSION_OPEN}
                                  onClick={() => mark(s.id, student.id, st)}
                                  style={{
                                    fontSize: '0.72rem', padding: '0.25rem 0.55rem', borderRadius: '6px', cursor: s.status === SESSION_OPEN ? 'pointer' : 'not-allowed',
                                    border: `1px solid ${rec?.status === st ? STATUS_COLORS[st] : 'var(--glass-border)'}`,
                                    background: rec?.status === st ? `${STATUS_COLORS[st]}22` : 'transparent',
                                    color: rec?.status === st ? STATUS_COLORS[st] : 'var(--text-secondary)',
                                    opacity: s.status === SESSION_OPEN ? 1 : 0.5,
                                  }}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-card" style={{ padding: '2rem', width: '420px', direction: 'rtl' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>جلسة حضور جديدة</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input className="premium-input" placeholder="عنوان الجلسة" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <select className="premium-input" value={form.gradeId} onChange={e => setForm({ ...form, gradeId: e.target.value })}>
                <option value="">اختر الصف</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>تاريخ الجلسة</label>
              <input className="premium-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn-primary" style={{ flex: 1 }} disabled={!form.title || !form.gradeId || !form.date} onClick={submitCreate}>إنشاء</button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AttendanceSessionsScreen;
