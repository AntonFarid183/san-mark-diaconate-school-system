import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';

// Enum values mirror DiaconateSchool.Domain.Enums.AttendanceStatus (serialized as numbers)
const STATUS_PRESENT = 0;
const STATUS_LABELS = ['حاضر', 'غائب'];
const STATUS_COLORS = ['var(--success)', 'var(--danger)'];
const SESSION_STATUS_LABELS = ['مجدولة', 'مفتوحة', 'مغلقة'];
const SESSION_SCHEDULED = 0;
const SESSION_OPEN = 1;
const SESSION_CLOSED = 2;

const AttendanceSessionsScreen = () => {
  usePageTitle('جلسات الحضور');
  // Deep-link target from a notification click — consumed once, then cleared
  const [searchParams] = useSearchParams();
  const initialTarget = useRef({
    academicYearId: searchParams.get('academicYearId') || '',
    stageId: searchParams.get('stageId') || '',
    gradeId: searchParams.get('gradeId') || '',
    classId: searchParams.get('classId') || '',
  });

  const [academicYears, setAcademicYears] = useState([]);
  const [stages, setStages] = useState([]);
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);

  const [academicYearId, setAcademicYearId] = useState('');
  const [stageId, setStageId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [classId, setClassId] = useState('');

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', date: '' });
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [roster, setRoster] = useState([]);
  const [records, setRecords] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [sessionPin, setSessionPin] = useState(null);
  const [undoItem, setUndoItem] = useState(null);
  const undoTimer = useRef(null);

  // Academic years — default to current
  useEffect(() => {
    apiClient.get('/academic-years').then(r => {
      setAcademicYears(r.data);
      const target = initialTarget.current.academicYearId;
      const match = target && r.data.find(y => y.id === target);
      const current = r.data.find(y => y.isCurrent);
      if (match) setAcademicYearId(match.id);
      else if (current) setAcademicYearId(current.id);
    }).catch(() => {});
    apiClient.get('/students/stages').then(r => {
      setStages(r.data);
      if (initialTarget.current.stageId) setStageId(initialTarget.current.stageId);
    }).catch(() => {});
  }, []);

  // Stage -> grades
  useEffect(() => {
    setGradeId(''); setGrades([]); setClassId(''); setClasses([]); setSessions([]);
    if (stageId) {
      apiClient.get(`/students/grades/${stageId}`).then(r => {
        setGrades(r.data);
        const target = initialTarget.current.gradeId;
        if (target && r.data.find(g => g.id === target)) setGradeId(target);
      }).catch(() => setGrades([]));
    }
  }, [stageId]);

  // Grade + year -> classes
  useEffect(() => {
    setClassId(''); setClasses([]); setSessions([]);
    if (gradeId && academicYearId) {
      apiClient.get('/classes', { params: { gradeId, academicYearId } }).then(r => {
        setClasses(r.data);
        const target = initialTarget.current.classId;
        if (target && r.data.find(c => c.id === target)) setClassId(target);
        initialTarget.current = {}; // consume — only auto-apply once
      }).catch(() => setClasses([]));
    }
  }, [gradeId, academicYearId]);

  // Class -> sessions
  useEffect(() => {
    if (classId) fetchSessions();
    else setSessions([]);
  }, [classId]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get('/attendance/sessions', { params: { classId } });
      setSessions(r.data);
    } catch { setMsg({ type: 'error', text: 'فشل تحميل الجلسات.' }); }
    finally { setLoading(false); }
  };

  const selectedClass = classes.find(c => c.id === classId);

  const openCreate = () => {
    setForm({ title: '', date: new Date().toISOString().slice(0, 10) });
    setShowForm(true);
  };

  const submitCreate = async () => {
    setCreating(true);
    try {
      const res = await apiClient.post('/attendance/sessions', {
        title: form.title,
        classId,
        startsAt: `${form.date}T00:00:00`,
        endsAt: `${form.date}T23:59:59`,
      });
      setMsg(res.data.wasExisting
        ? { type: 'success', text: 'توجد جلسة بالفعل لهذا الفصل في هذا التاريخ — تم فتحها.' }
        : { type: 'success', text: 'تم إنشاء الجلسة.' });
      setShowForm(false);
      fetchSessions();
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل إنشاء الجلسة.' });
    } finally {
      setCreating(false);
    }
  };

  const activateSession = async (id) => {
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
      if (expandedId === id) {
        const session = sessions.find(s => s.id === id);
        if (session) loadRoster(session);
      }
    } catch { setMsg({ type: 'error', text: 'فشل إغلاق الجلسة.' }); }
  };

  const loadRoster = async (session) => {
    setExpandedId(session.id);
    setRosterLoading(true);
    setRecords([]);
    setUndoItem(null);
    try {
      const [recordsRes, detailRes] = await Promise.all([
        apiClient.get(`/attendance/sessions/${session.id}/records`),
        apiClient.get(`/attendance/sessions/${session.id}`),
      ]);
      // Roster comes from the class's own student list — never a broader grade roster
      setRoster(selectedClass?.students ?? []);
      setRecords(recordsRes.data);
      setSessionPin(detailRes.data.pin);
    } catch { setMsg({ type: 'error', text: 'فشل تحميل كشف الحضور.' }); }
    finally { setRosterLoading(false); }
  };

  const toggleExpand = (session) => {
    if (expandedId === session.id) { setExpandedId(null); return; }
    loadRoster(session);
  };

  const triggerUndo = (item) => {
    clearTimeout(undoTimer.current);
    setUndoItem(item);
    undoTimer.current = setTimeout(() => setUndoItem(null), 3500);
  };

  const mark = async (sessionId, studentId, status, studentName) => {
    const prevRecord = records.find(r => r.studentId === studentId);
    const prevStatus = prevRecord?.status ?? null;

    // Optimistic update — update local state immediately, no re-fetch
    setRecords(curr =>
      prevRecord
        ? curr.map(r => r.studentId === studentId ? { ...r, status } : r)
        : [...curr, { studentId, status, id: null }]
    );

    // Show undo only when changing an already-recorded student
    if (prevStatus !== null && prevStatus !== status) {
      triggerUndo({ sessionId, studentId, studentName, prevStatus });
    }

    try {
      await apiClient.post(`/attendance/sessions/${sessionId}/checkin-manual`, { studentId, status });
    } catch (e) {
      // Rollback on server error
      setRecords(curr =>
        prevRecord
          ? curr.map(r => r.studentId === studentId ? prevRecord : r)
          : curr.filter(r => r.studentId !== studentId)
      );
      setUndoItem(null);
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل التسجيل.' });
    }
  };

  const undoMark = () => {
    if (!undoItem) return;
    clearTimeout(undoTimer.current);
    const { sessionId, studentId, studentName, prevStatus } = undoItem;
    setUndoItem(null);
    mark(sessionId, studentId, prevStatus, studentName);
  };

  const markAllPresent = async (session) => {
    const unmarked = roster.filter(s => !records.find(r => r.studentId === s.id));
    if (unmarked.length === 0) return;

    const studentIds = unmarked.map(s => s.id);

    // Optimistic: add all unmarked as Present
    setRecords(curr => [
      ...curr,
      ...studentIds.map(id => ({ studentId: id, status: STATUS_PRESENT, id: null })),
    ]);

    try {
      await apiClient.post(`/attendance/sessions/${session.id}/mark-bulk`, {
        studentIds,
        status: STATUS_PRESENT,
      });
    } catch (e) {
      // Re-fetch accurate state on error
      try {
        const res = await apiClient.get(`/attendance/sessions/${session.id}/records`);
        setRecords(res.data);
      } catch { /* keep optimistic */ }
      setMsg({ type: 'error', text: 'فشل تسجيل الحضور الجماعي.' });
    }
  };

  const recordFor = (studentId) => records.find(r => r.studentId === studentId);

  const unmarkedCount = (sessionId) => {
    if (expandedId !== sessionId) return 0;
    return roster.filter(s => !records.find(r => r.studentId === s.id)).length;
  };

  return (
    <>
      {msg && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 'var(--radius-sm)', background: msg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
          {msg.text}
          <span style={{ cursor: 'pointer' }} onClick={() => setMsg(null)}>✕</span>
        </div>
      )}

      {/* Cascading filters: Academic Year → Stage → Grade → Class */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: '160px' }}>
            <label style={labelStyle}>السنة الدراسية</label>
            <select className="premium-input" value={academicYearId} onChange={e => setAcademicYearId(e.target.value)}>
              <option value="">اختر السنة</option>
              {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
          <div style={{ minWidth: '160px' }}>
            <label style={labelStyle}>المرحلة</label>
            <select className="premium-input" value={stageId} onChange={e => setStageId(e.target.value)}>
              <option value="">اختر المرحلة</option>
              {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ minWidth: '180px' }}>
            <label style={labelStyle}>الصف</label>
            <select className="premium-input" value={gradeId} onChange={e => setGradeId(e.target.value)} disabled={!stageId}>
              <option value="">اختر الصف</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div style={{ minWidth: '140px' }}>
            <label style={labelStyle}>الفصل</label>
            <select className="premium-input" value={classId} onChange={e => setClassId(e.target.value)} disabled={!gradeId}>
              <option value="">اختر الفصل</option>
              {classes.map(c => <option key={c.id} value={c.id}>فصل {c.name}</option>)}
            </select>
          </div>
          {classId && (
            <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.5rem', marginRight: 'auto' }} onClick={openCreate}>+ جلسة جديدة</button>
          )}
        </div>
      </div>

      {!classId ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>groups</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>اختر السنة الدراسية والمرحلة والصف والفصل لعرض جلسات الحضور</p>
        </div>
      ) : loading ? (
        <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>
      ) : sessions.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>event_busy</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>لا توجد جلسات لهذا الفصل</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sessions.map(s => (
            <div key={s.id} className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => toggleExpand(s)}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <h3 style={{ color: 'var(--accent-gold)', fontSize: '1rem' }}>{s.title}</h3>
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.6rem', borderRadius: '20px', background: 'rgba(251,191,36,0.12)', color: 'var(--accent-gold)' }}>{s.gradeName} — فصل {s.className}</span>
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.6rem', borderRadius: '20px', background: s.status === SESSION_OPEN ? 'rgba(16,185,129,0.15)' : s.status === SESSION_CLOSED ? 'rgba(148,163,184,0.15)' : 'rgba(251,191,36,0.12)', color: s.status === SESSION_OPEN ? 'var(--success)' : s.status === SESSION_CLOSED ? 'var(--text-muted)' : 'var(--accent-gold)' }}>
                      {SESSION_STATUS_LABELS[s.status]}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    {new Date(s.startsAt).toLocaleDateString('ar-EG')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem', display: 'flex', gap: '0.75rem' }}>
                    <span style={{ color: 'var(--success)' }}>حاضر: {s.presentCount}</span>
                    <span style={{ color: 'var(--danger)' }}>غائب: {s.absentCount}</span>
                    {s.totalStudents > 0 && <span style={{ color: 'var(--text-muted)' }}>الإجمالي: {s.totalStudents}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                  {s.status === SESSION_SCHEDULED && (
                    <button className="btn-primary" style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => activateSession(s.id)}>فتح الجلسة</button>
                  )}
                  {s.status === SESSION_OPEN && (
                    <button style={{ background: 'none', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '6px', padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => closeSession(s.id)}>إغلاق الجلسة</button>
                  )}
                </div>
              </div>

              {expandedId === s.id && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--glass-border)' }}>
                  {s.status === SESSION_OPEN && (
                    <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px', textAlign: 'center', padding: '1rem', background: 'rgba(251,191,36,0.08)', borderRadius: 'var(--radius-sm)' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>رمز الدخول</p>
                        <p style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '0.3rem', color: 'var(--accent-gold)' }}>{sessionPin || '......'}</p>
                      </div>
                      {unmarkedCount(s.id) > 0 && (
                        <button
                          onClick={() => markAllPresent(s)}
                          style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid var(--success)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', padding: '0 1.25rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, minWidth: '180px' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginLeft: '0.4rem' }}>done_all</span>
                          تسجيل الجميع حاضر ({unmarkedCount(s.id)})
                        </button>
                      )}
                    </div>
                  )}
                  {rosterLoading ? (
                    <p style={{ textAlign: 'center', padding: '1rem' }}>جاري التحميل...</p>
                  ) : roster.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>لا يوجد طلاب في هذا الفصل</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {roster.map(student => {
                        const rec = recordFor(student.id);
                        return (
                          <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.75rem', borderRadius: '8px', background: rec ? `${STATUS_COLORS[rec.status]}08` : 'rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                            <div>
                              <span style={{ fontSize: '0.88rem' }}>{student.fullName}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>({student.studentCode})</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                              {STATUS_LABELS.map((label, st) => (
                                <button
                                  key={st}
                                  disabled={s.status !== SESSION_OPEN}
                                  onClick={() => mark(s.id, student.id, st, student.fullName)}
                                  style={{
                                    fontSize: '0.78rem', padding: '0.3rem 0.75rem', borderRadius: '6px',
                                    cursor: s.status === SESSION_OPEN ? 'pointer' : 'not-allowed',
                                    border: `1px solid ${rec?.status === st ? STATUS_COLORS[st] : 'var(--glass-border)'}`,
                                    background: rec?.status === st ? `${STATUS_COLORS[st]}22` : 'transparent',
                                    color: rec?.status === st ? STATUS_COLORS[st] : 'var(--text-secondary)',
                                    fontWeight: rec?.status === st ? 700 : 400,
                                    opacity: s.status === SESSION_OPEN ? 1 : 0.5,
                                    transition: 'all 0.15s',
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

      {/* Undo Toast */}
      {undoItem && (
        <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(12px)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 300, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
          <span style={{ color: 'var(--text-secondary)' }}>تم تغيير حالة <strong style={{ color: 'var(--text-primary)' }}>{undoItem.studentName}</strong></span>
          <button onClick={undoMark} style={{ background: 'none', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)', borderRadius: '6px', padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>تراجع</button>
        </div>
      )}

      {/* Create Session Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-card" style={{ padding: '2rem', width: '400px', direction: 'rtl' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>جلسة حضور جديدة</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              فصل {selectedClass?.name} — {grades.find(g => g.id === gradeId)?.name}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input className="premium-input" placeholder="عنوان الجلسة" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '-0.5rem' }}>تاريخ الجلسة</label>
              <input className="premium-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              إذا كانت هناك جلسة بالفعل لهذا الفصل في هذا التاريخ، سيتم فتحها بدلاً من إنشاء جلسة جديدة.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn-primary" style={{ flex: 1 }} disabled={!form.title.trim() || !form.date || creating} onClick={submitCreate}>
                {creating ? 'جاري الإنشاء...' : 'إنشاء'}
              </button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const labelStyle = {
  display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600,
};

export default AttendanceSessionsScreen;
