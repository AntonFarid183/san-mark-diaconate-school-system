import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';
import QrScanner from '../components/QrScanner';

// Mirrors DiaconateSchool.Application.DTOs.QrScanResultCode (serialized as numbers)
const QR_RESULT_SUCCESS = 0;
const QR_RESULT_ALREADY_PRESENT = 1;

// How long the camera stays closed behind the result popup before the
// scanner reopens on its own — long enough to read, short enough to keep
// scanning a whole class moving without an extra tap per student.
const SCAN_PAUSE_MS = 1400;

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
  // '' = every level at once — covers a grade never split into levels
  // (everyone defaults to Level1 anyway) as well as deliberately taking
  // attendance for both levels together. 1/2 narrows to one level.
  const [level, setLevel] = useState('');
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(todayStr());
  // 'class': pick grade + class as before. 'grade': skip class, take
  // attendance for every class (at the chosen level, or all of them) in one
  // grade. 'stage': skip grade/class entirely and take attendance for every
  // class in every grade under the stage at once.
  const [scope, setScope] = useState('class');

  const [roster, setRoster] = useState([]);
  const [statusByStudent, setStatusByStudent] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanFeed, setScanFeed] = useState([]); // recent scan results, newest first — shown while the scanner is open
  const [scanPause, setScanPause] = useState(null); // { success, text } — camera closed, popup shown, while set
  const scanPauseTimerRef = useRef(null);

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

  // Grade + year + level -> classes (class scope only — a single class
  // belongs to exactly one level, so "كل المستويات" doesn't apply here;
  // fall back to Level1 like before when no level is picked). Level used to
  // default to 1 server-side when omitted (GET /classes' [FromQuery]
  // StudentLevel level = Level1), which is exactly why level-2 classes used
  // to be invisible here — there was no level param sent at all.
  useEffect(() => {
    setClassId(''); setClasses([]);
    if (scope === 'class' && gradeId && academicYearId) {
      apiClient.get('/classes', { params: { gradeId, academicYearId, level: level || 1 } }).then(r => {
        setClasses(r.data);
        const target = initialTarget.current.classId;
        if (target && r.data.find(c => c.id === target)) setClassId(target);
        initialTarget.current = {}; // consume — only auto-apply once
      }).catch(() => setClasses([]));
    }
  }, [scope, gradeId, academicYearId, level]);

  // Class or date -> roster for that day (class scope)
  useEffect(() => {
    if (scope !== 'class') return;
    if (classId && date) fetchRoster();
    else { setRoster([]); setStatusByStudent({}); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, classId, date]);

  // Grade (or stage) + year + level + date -> roster. Same call either way —
  // gradeId narrows the stage-wide query to one grade when scope is 'grade'.
  useEffect(() => {
    if (scope !== 'grade' && scope !== 'stage') return;
    const ready = scope === 'grade' ? !!gradeId : !!stageId;
    if (ready && stageId && academicYearId && date) fetchStageRoster();
    else { setRoster([]); setStatusByStudent({}); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, stageId, gradeId, academicYearId, level, date]);

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

  const fetchStageRoster = async () => {
    setLoading(true);
    try {
      const params = { stageId, academicYearId, date };
      if (level) params.level = level; // omitted = every level
      if (scope === 'grade') params.gradeId = gradeId;
      const r = await apiClient.get('/attendance/stage-roster', { params });
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

  // Closes the camera behind a result popup for SCAN_PAUSE_MS, then reopens
  // it automatically — every outcome pauses (not just success): a wrong-
  // class or already-present hit needs the same beat to read as a fresh
  // one, otherwise jsQR just refires it every frame the card stays in view.
  const pauseThenResume = (success, text) => {
    setScanPause({ success, text });
    if (scanPauseTimerRef.current) clearTimeout(scanPauseTimerRef.current);
    scanPauseTimerRef.current = setTimeout(() => setScanPause(null), SCAN_PAUSE_MS);
  };

  const handleScan = async (qrToken) => {
    try {
      const r = await apiClient.post('/attendance/scan', { qrToken, classId, date });
      const result = r.data;
      const success = result.resultCode === QR_RESULT_SUCCESS || result.resultCode === QR_RESULT_ALREADY_PRESENT;
      if (success && result.record) {
        setStatusByStudent(prev => ({ ...prev, [result.record.studentId]: 0 })); // 0 = Present
      }
      const text = result.record ? `${result.record.studentName} — ${result.message}` : result.message;
      setScanFeed(prev => [{ id: Date.now(), success, text }, ...prev].slice(0, 8));
      pauseThenResume(success, text);
    } catch (e) {
      const text = e.response?.data?.message || 'فشل تسجيل الحضور بالكود.';
      setScanFeed(prev => [{ id: Date.now(), success: false, text }, ...prev].slice(0, 8));
      pauseThenResume(false, text);
    }
  };

  // Scanner closed (either the pause popup or the admin hitting إغلاق) —
  // don't leave a stale timer alive to reopen the camera after that.
  useEffect(() => {
    if (!scannerOpen && scanPauseTimerRef.current) {
      clearTimeout(scanPauseTimerRef.current);
      scanPauseTimerRef.current = null;
      setScanPause(null);
    }
  }, [scannerOpen]);

  const save = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(statusByStudent).map(([studentId, status]) => ({ studentId, status }));
      if (scope === 'grade' || scope === 'stage') {
        await apiClient.post('/attendance/record-stage', {
          stageId, academicYearId, date, entries,
          level: level || null, // null = every level
          gradeId: scope === 'grade' ? gradeId : null,
        });
      } else {
        await apiClient.post('/attendance/record-class', { classId, date, entries });
      }
      setMsg({ type: 'success', text: 'تم حفظ الحضور بنجاح.' });
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل حفظ الحضور.' });
    } finally {
      setSaving(false);
    }
  };

  const ready = scope === 'stage' ? !!(stageId && academicYearId)
    : scope === 'grade' ? !!(gradeId && academicYearId)
    : !!classId;

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
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={() => setScope('class')}
            style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, border: `1px solid ${scope === 'class' ? 'var(--accent-gold)' : 'var(--glass-border)'}`, background: scope === 'class' ? 'rgba(251,191,36,0.12)' : 'transparent', color: scope === 'class' ? 'var(--accent-gold)' : 'var(--text-secondary)' }}
          >
            فصل واحد
          </button>
          <button
            type="button"
            onClick={() => setScope('grade')}
            style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, border: `1px solid ${scope === 'grade' ? 'var(--accent-gold)' : 'var(--glass-border)'}`, background: scope === 'grade' ? 'rgba(251,191,36,0.12)' : 'transparent', color: scope === 'grade' ? 'var(--accent-gold)' : 'var(--text-secondary)' }}
          >
            صف كامل
          </button>
          <button
            type="button"
            onClick={() => setScope('stage')}
            style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, border: `1px solid ${scope === 'stage' ? 'var(--accent-gold)' : 'var(--glass-border)'}`, background: scope === 'stage' ? 'rgba(251,191,36,0.12)' : 'transparent', color: scope === 'stage' ? 'var(--accent-gold)' : 'var(--text-secondary)' }}
          >
            المرحلة كاملة
          </button>
        </div>
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
          {(scope === 'class' || scope === 'grade') && (
            <div style={{ minWidth: '180px' }}>
              <label style={labelStyle}>الصف</label>
              <select className="premium-input" value={gradeId} onChange={e => setGradeId(e.target.value)} disabled={!stageId}>
                <option value="">اختر الصف</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}
          {scope !== 'class' && (
            <div style={{ minWidth: '150px' }}>
              <label style={labelStyle}>المستوى</label>
              <select className="premium-input" value={level} onChange={e => setLevel(e.target.value ? Number(e.target.value) : '')}>
                <option value="">الكل (بدون تقسيم)</option>
                <option value={1}>المستوى 1</option>
                <option value={2}>المستوى 2</option>
              </select>
            </div>
          )}
          {scope === 'class' && (
            <div style={{ minWidth: '140px' }}>
              <label style={labelStyle}>المستوى</label>
              <select className="premium-input" value={level || 1} onChange={e => setLevel(Number(e.target.value))}>
                <option value={1}>المستوى 1</option>
                <option value={2}>المستوى 2</option>
              </select>
            </div>
          )}
          {scope === 'class' && (
            <div style={{ minWidth: '140px' }}>
              <label style={labelStyle}>الفصل</label>
              <select className="premium-input" value={classId} onChange={e => setClassId(e.target.value)} disabled={!gradeId}>
                <option value="">اختر الفصل</option>
                {classes.map(c => <option key={c.id} value={c.id}>فصل {c.name}</option>)}
              </select>
            </div>
          )}
          <div style={{ minWidth: '150px' }}>
            <label style={labelStyle}>اليوم</label>
            <input className="premium-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {!ready ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>groups</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
            {scope === 'stage'
              ? 'اختر السنة الدراسية والمرحلة لعرض طلاب المرحلة كاملة وتسجيل حضورهم'
              : scope === 'grade'
              ? 'اختر السنة الدراسية والمرحلة والصف لعرض طلاب الصف كاملاً (بمستوياته) وتسجيل حضورهم'
              : 'اختر السنة الدراسية والمرحلة والصف والفصل لعرض الطلاب وتسجيل حضورهم'}
          </p>
        </div>
      ) : loading ? (
        <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>
      ) : roster.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>event_busy</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
            {scope === 'stage' ? 'لا يوجد طلاب في هذه المرحلة' : scope === 'grade' ? 'لا يوجد طلاب في هذا الصف' : 'لا يوجد طلاب في هذا الفصل'}
          </p>
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
              {scope === 'class' && (
                <button
                  onClick={() => setScannerOpen(true)}
                  style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)', borderRadius: 'var(--radius-sm)', padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle', marginLeft: '0.3rem' }}>qr_code_scanner</span>
                  مسح كارنيه الطالب
                </button>
              )}
            </div>
          </div>

          {scanFeed.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1rem' }}>
              {scanFeed.map(item => (
                <div key={item.id} style={{ fontSize: '0.8rem', padding: '0.4rem 0.7rem', borderRadius: '6px', background: item.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: item.success ? 'var(--success)' : 'var(--danger)' }}>
                  {item.text}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {roster.map(student => {
              const status = statusByStudent[student.studentId];
              return (
                <div key={student.studentId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', borderRadius: '8px', background: status !== undefined ? `${STATUS_COLORS[status]}08` : 'var(--surface-1)', transition: 'background 0.2s' }}>
                  <div>
                    <span style={{ fontSize: '0.9rem' }}>{student.studentName}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>({student.studentCode})</span>
                    {scope === 'stage' && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', marginRight: '0.5rem' }}>{student.gradeName} — فصل {student.className}</span>
                    )}
                    {scope === 'grade' && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', marginRight: '0.5rem' }}>فصل {student.className}</span>
                    )}
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

      {scannerOpen && (
        scanPause ? (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '84px', height: '84px', borderRadius: '50%',
                background: scanPause.success ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                border: `2px solid ${scanPause.success ? 'var(--success)' : 'var(--danger)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'scan-pause-pop 0.25s ease',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '44px', color: scanPause.success ? 'var(--success)' : 'var(--danger)' }}>
                {scanPause.success ? 'check_circle' : 'error'}
              </span>
            </div>
            <p style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, textAlign: 'center', maxWidth: '85vw' }}>
              {scanPause.text}
            </p>
            <style>{'@keyframes scan-pause-pop { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }'}</style>
          </div>
        ) : (
          <QrScanner onScan={handleScan} onClose={() => setScannerOpen(false)} />
        )
      )}
    </>
  );
};

const labelStyle = {
  display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600,
};

export default AttendanceSessionsScreen;
