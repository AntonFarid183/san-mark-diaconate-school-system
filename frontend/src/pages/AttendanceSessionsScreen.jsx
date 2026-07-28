import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';

// Enum values mirror DiaconateSchool.Domain.Enums.AttendanceStatus (serialized as numbers)
const STATUS_PRESENT = 0;
const STATUS_ABSENT = 1;
const STATUS_LABELS = ['حاضر', 'غائب'];
const STATUS_COLORS = ['var(--success)', 'var(--danger)'];

const todayStr = () => new Date().toISOString().slice(0, 10);

const AttendanceSessionsScreen = () => {
  usePageTitle('تسجيل الحضور');
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
  const [date, setDate] = useState(todayStr());

  const [roster, setRoster] = useState([]);
  const [statusByStudent, setStatusByStudent] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

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
    setGradeId(''); setGrades([]); setClassId(''); setClasses([]);
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
    setClassId(''); setClasses([]);
    if (gradeId && academicYearId) {
      apiClient.get('/classes', { params: { gradeId, academicYearId } }).then(r => {
        setClasses(r.data);
        const target = initialTarget.current.classId;
        if (target && r.data.find(c => c.id === target)) setClassId(target);
        initialTarget.current = {}; // consume — only auto-apply once
      }).catch(() => setClasses([]));
    }
  }, [gradeId, academicYearId]);

  // Class or date -> roster for that day
  useEffect(() => {
    if (classId && date) fetchRoster();
    else { setRoster([]); setStatusByStudent({}); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, date]);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get('/attendance/class-roster', { params: { classId, date } });
      setRoster(r.data);
      const map = {};
      r.data.forEach(s => { if (s.status !== null && s.status !== undefined) map[s.studentId] = s.status; });
      setStatusByStudent(map);
    } catch { setMsg({ type: 'error', text: 'فشل تحميل كشف الطلاب.' }); }
    finally { setLoading(false); }
  };

  const setStatus = (studentId, status) => {
    setStatusByStudent(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    const map = {};
    roster.forEach(s => { map[s.studentId] = status; });
    setStatusByStudent(map);
  };

  const markedCount = Object.keys(statusByStudent).length;

  const save = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(statusByStudent).map(([studentId, status]) => ({ studentId, status }));
      await apiClient.post('/attendance/record-class', { classId, date, entries });
      setMsg({ type: 'success', text: 'تم حفظ الحضور بنجاح.' });
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل حفظ الحضور.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {msg && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 'var(--radius-sm)', background: msg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
          {msg.text}
          <span style={{ cursor: 'pointer' }} onClick={() => setMsg(null)}>✕</span>
        </div>
      )}

      {/* Cascading filters: Academic Year → Stage → Grade → Class, plus the day */}
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
          <div style={{ minWidth: '150px' }}>
            <label style={labelStyle}>اليوم</label>
            <input className="premium-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {!classId ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>groups</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>اختر السنة الدراسية والمرحلة والصف والفصل لعرض الطلاب وتسجيل حضورهم</p>
        </div>
      ) : loading ? (
        <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>
      ) : roster.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>event_busy</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>لا يوجد طلاب في هذا الفصل</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              تم تسجيل {markedCount} من {roster.length} طالب
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => markAll(STATUS_PRESENT)}
                style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid var(--success)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle', marginLeft: '0.3rem' }}>done_all</span>
                تحضير الجميع
              </button>
              <button
                onClick={() => markAll(STATUS_ABSENT)}
                style={{ background: 'none', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
              >
                تغييب الجميع
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {roster.map(student => {
              const status = statusByStudent[student.studentId];
              return (
                <div key={student.studentId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', borderRadius: '8px', background: status !== undefined ? `${STATUS_COLORS[status]}08` : 'rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                  <div>
                    <span style={{ fontSize: '0.9rem' }}>{student.studentName}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>({student.studentCode})</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    {STATUS_LABELS.map((label, st) => (
                      <button
                        key={st}
                        onClick={() => setStatus(student.studentId, st)}
                        style={{
                          fontSize: '0.8rem', padding: '0.35rem 0.9rem', borderRadius: '6px', cursor: 'pointer',
                          border: `1px solid ${status === st ? STATUS_COLORS[st] : 'var(--glass-border)'}`,
                          background: status === st ? `${STATUS_COLORS[st]}22` : 'transparent',
                          color: status === st ? STATUS_COLORS[st] : 'var(--text-secondary)',
                          fontWeight: status === st ? 700 : 400,
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

          <button
            className="btn-primary"
            style={{ width: '100%', marginTop: '1.5rem' }}
            disabled={saving || markedCount === 0}
            onClick={save}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ الحضور'}
          </button>
        </div>
      )}
    </>
  );
};

const labelStyle = {
  display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600,
};

export default AttendanceSessionsScreen;
