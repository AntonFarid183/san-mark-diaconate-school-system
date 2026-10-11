import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';

// Enum values mirror DiaconateSchool.Domain.Enums.AttendanceStatus (serialized as numbers)
const STATUS_LABELS = ['حاضر', 'غائب'];
const STATUS_COLORS = ['var(--success)', 'var(--danger)'];
const STATUS_QUERY_NAMES = ['Present', 'Absent'];

// 5/10/2026 — day/month/year, Latin digits, no zero padding.
const formatDay = (value) => {
  const d = new Date(value);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

// "2026-10-08" — what makes two sessions "the same day" (every class meets on its own session).
const dayKey = (value) => {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// "الخميس 8/10/2026" — weekday + date, the way the service days are talked about.
const dayTitle = (value) => `${new Date(value).toLocaleDateString('ar-EG', { weekday: 'long' })} ${formatDay(value)}`;

// Level 2 classes share names with Level 1 ones (both can have an "A"), so say which.
const classCaption = (x) => `${x.gradeName} — فصل ${x.className}${x.classLevel === 2 ? ' (المستوى 2)' : ''}`;

/**
 * Pivots flat attendance records into one row per student and one column per DAY.
 * A day holds one session per class, but a student belongs to a single class, so each
 * student has at most one record per day — the whole stage reads as one list.
 */
const buildAttendanceMatrix = (records) => {
  const days = new Map();
  const students = new Map();

  for (const r of records) {
    const key = dayKey(r.sessionStartsAt);
    if (!days.has(key)) days.set(key, { id: key, startsAt: new Date(r.sessionStartsAt), day: formatDay(r.sessionStartsAt), label: formatDay(r.sessionStartsAt) });
    if (!students.has(r.studentId)) {
      students.set(r.studentId, { id: r.studentId, name: r.studentName, code: r.studentCode, cells: {}, present: 0, absent: 0 });
    }
    const student = students.get(r.studentId);
    student.cells[key] = r;
    if (r.status === 0) student.present += 1;
    else student.absent += 1;
  }

  const columns = [...days.values()].sort((a, b) => a.startsAt - b.startsAt);
  const rows = [...students.values()].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  return { columns, rows };
};

const chipStyle = (on) => ({
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem',
  padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem',
  border: `1px solid ${on ? 'var(--accent-gold)' : 'var(--glass-border)'}`,
  background: on ? 'rgba(251,191,36,0.14)' : 'transparent',
  color: on ? 'var(--accent-gold)' : 'var(--text-secondary)',
  transition: 'all 0.15s',
});

const labelStyle = { fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' };

const SummaryCard = ({ label, value, color }) => (
  <div className="glass-card" style={{ padding: '1.25rem', flex: 1, minWidth: '120px', textAlign: 'center' }}>
    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{label}</p>
    <p style={{ fontSize: '1.6rem', fontWeight: 800, color: color || 'var(--accent-gold)' }}>{value}</p>
  </div>
);

const AttendanceDashboardScreen = () => {
  usePageTitle('لوحة تحكم الحضور');
  const [stages, setStages] = useState([]);
  const [grades, setGrades] = useState([]);
  const [filters, setFilters] = useState({ stageId: '', gradeId: '', status: '' });
  // The sessions recorded for the chosen stage/grade. A "day" button groups every class's session of that date.
  const [sessions, setSessions] = useState([]);
  const [sessionsLoadedFor, setSessionsLoadedFor] = useState(null); // request key the sessions list was loaded for
  const [pickedDays, setPickedDays] = useState([]);                  // day keys the admin has opened
  const [classFilter, setClassFilter] = useState('');                // class narrowing, applied inside the opened days
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [recordsLoadedFor, setRecordsLoadedFor] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [msg, setMsg] = useState(null);
  const [editing, setEditing] = useState(null);
  const [overrideForm, setOverrideForm] = useState({ status: 0, reason: '' });

  useEffect(() => {
    apiClient.get('/students/stages').then(r => setStages(r.data)).catch(() => {});
  }, []);

  // Grades narrow to the chosen stage.
  useEffect(() => {
    const request = filters.stageId ? `/students/grades/${filters.stageId}` : '/students/grades';
    apiClient.get(request).then(r => setGrades(r.data)).catch(() => setGrades([]));
  }, [filters.stageId]);

  const setScopeFilter = (patch) => setFilters(f => ({ ...f, ...patch }));

  const scopeParams = () => {
    const params = {};
    if (filters.stageId) params.stageId = filters.stageId;
    if (filters.gradeId) params.gradeId = filters.gradeId;
    return params;
  };

  const sessionsRequestKey = `${filters.stageId}|${filters.gradeId}|${reloadTick}`;
  const sessionsLoading = sessionsLoadedFor !== sessionsRequestKey;

  // 1) Which sessions exist for this stage/grade (only ones with attendance actually recorded).
  useEffect(() => {
    let current = true;
    const requestKey = sessionsRequestKey;
    apiClient.get('/attendance/sessions', { params: scopeParams() })
      .then(r => {
        if (!current) return;
        const recorded = r.data
          .filter(x => x.presentCount + x.absentCount > 0)
          .sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));
        setSessions(recorded);
        // Keep the picked days that still exist; otherwise open the newest day.
        const existing = new Set(recorded.map(x => dayKey(x.startsAt)));
        setPickedDays(prev => {
          const kept = prev.filter(k => existing.has(k));
          if (kept.length > 0) return kept;
          return recorded.length > 0 ? [dayKey(recorded[0].startsAt)] : [];
        });
      })
      .catch(() => { if (current) { setSessions([]); setMsg({ type: 'error', text: 'فشل تحميل الجلسات.' }); } })
      .finally(() => { if (current) setSessionsLoadedFor(requestKey); });
    return () => { current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.stageId, filters.gradeId, reloadTick]);

  // Days, newest first; each holds the sessions (one per class) of that date.
  const days = useMemo(() => {
    const byDay = new Map();
    for (const x of sessions) {
      const key = dayKey(x.startsAt);
      if (!byDay.has(key)) byDay.set(key, { key, title: dayTitle(x.startsAt), startsAt: x.startsAt, sessions: [] });
      byDay.get(key).sessions.push(x);
    }
    return [...byDay.values()].sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));
  }, [sessions]);

  const pickedDayObjects = days.filter(d => pickedDays.includes(d.key));
  const pickedSessions = pickedDayObjects.flatMap(d => d.sessions);

  // Classes that took part in the opened days — what the in-page class filter offers.
  const classOptions = useMemo(() => {
    const byClass = new Map();
    for (const x of pickedSessions) {
      if (!byClass.has(x.classId)) byClass.set(x.classId, { id: x.classId, caption: classCaption(x), present: 0, absent: 0 });
      const c = byClass.get(x.classId);
      c.present += x.presentCount;
      c.absent += x.absentCount;
    }
    return [...byClass.values()].sort((a, b) => a.caption.localeCompare(b.caption, 'ar'));
  }, [pickedSessions]);

  // A class that's no longer in the opened days can't stay selected.
  const activeClass = classOptions.some(c => c.id === classFilter) ? classFilter : '';
  const scopedSessions = activeClass ? pickedSessions.filter(x => x.classId === activeClass) : pickedSessions;
  const scopedIds = scopedSessions.map(x => x.id);

  // 2) The records of every session in the opened days (all classes) — narrowed to a class client-side.
  const fetchKey = pickedSessions.map(x => x.id).join(',');
  const recordsRequestKey = `${fetchKey}|${reloadTick}`;
  const loading = pickedSessions.length > 0 && recordsLoadedFor !== recordsRequestKey;
  useEffect(() => {
    if (!fetchKey) return;
    let current = true;
    apiClient.get('/attendance/records', { params: { sessionIds: fetchKey } })
      .then(r => { if (current) setRecords(r.data); })
      .catch(() => { if (current) setMsg({ type: 'error', text: 'فشل تحميل بيانات الحضور.' }); })
      .finally(() => { if (current) setRecordsLoadedFor(recordsRequestKey); });
    return () => { current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey, reloadTick]);

  // 3) Consecutive-absence alert — looks across every recorded session in scope, not only the opened days.
  const sessionRangeKey = sessions.length === 0 ? '' : `${sessions[sessions.length - 1].startsAt}|${sessions[0].startsAt}`;
  useEffect(() => {
    if (!sessionRangeKey) return;
    const [first, last] = sessionRangeKey.split('|');
    const lastDay = new Date(last); lastDay.setHours(23, 59, 59, 0);
    let current = true;
    apiClient.get('/attendance/summary', { params: { ...scopeParams(), from: first, to: lastDay.toISOString().slice(0, 19) } })
      .then(r => { if (current) setSummary(r.data); })
      .catch(() => { if (current) setSummary(null); });
    return () => { current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionRangeKey, filters.stageId, filters.gradeId, reloadTick]);

  const alertSummary = sessionRangeKey ? summary : null;
  const refresh = () => setReloadTick(t => t + 1);

  const toggleDay = (key) => setPickedDays(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));
  const allDaysPicked = days.length > 0 && pickedDays.length === days.length;
  const toggleAllDays = () => setPickedDays(allDaysPicked ? [] : days.map(d => d.key));

  const openOverride = (record) => {
    setEditing(record);
    setOverrideForm({ status: record.status, reason: '' });
  };

  const submitOverride = async () => {
    try {
      await apiClient.put(`/attendance/records/${editing.id}`, overrideForm);
      setMsg({ type: 'success', text: 'تم تعديل السجل.' });
      setEditing(null);
      refresh();
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل التعديل.' });
    }
  };

  // Records of the opened days, narrowed to the class chosen inside. The status filter then only
  // changes what the table shows; the cards count everything in the class/day selection.
  const scopedKey = scopedIds.join(',');
  const pickedRecords = useMemo(() => {
    if (!scopedKey) return [];
    const ids = new Set(scopedKey.split(','));
    return records.filter(r => ids.has(r.sessionId));
  }, [scopedKey, records]);
  const visibleRecords = useMemo(
    () => (filters.status === '' ? pickedRecords : pickedRecords.filter(r => r.status === STATUS_QUERY_NAMES.indexOf(filters.status))),
    [pickedRecords, filters.status],
  );
  const matrix = useMemo(() => buildAttendanceMatrix(visibleRecords), [visibleRecords]);
  const presentCount = pickedRecords.filter(r => r.status === 0).length;
  const absentCount = pickedRecords.length - presentCount;

  // ── Reset tools (the admin tried things out and wants a clean slate) ──────
  const failWith = (e, fallback) => setMsg({ type: 'error', text: e.response?.data?.message || fallback });

  const deleteRecord = async () => {
    if (!window.confirm(`حذف تسجيل ${editing.studentName} في "${editing.sessionTitle}"؟`)) return;
    try {
      await apiClient.delete(`/attendance/records/${editing.id}`);
      setMsg({ type: 'success', text: 'تم حذف التسجيل.' });
      setEditing(null);
      refresh();
    } catch (e) { failWith(e, 'فشل حذف التسجيل.'); }
  };

  // Sessions of one day inside the current class filter.
  const sessionsOfDay = (key) => scopedSessions.filter(x => dayKey(x.startsAt) === key);

  const deleteDay = async (column) => {
    const ofDay = sessionsOfDay(column.id);
    const where = activeClass ? classOptions.find(c => c.id === activeClass)?.caption : 'كل الفصول';
    if (!window.confirm(`حذف حضور يوم ${column.label} (${where}) بالكامل؟\nلا يمكن التراجع.`)) return;
    try {
      await apiClient.post('/attendance/reset', { sessionIds: ofDay.map(x => x.id), confirm: true });
      setMsg({ type: 'success', text: 'تم حذف الحضور لهذا اليوم.' });
      refresh();
    } catch (e) { failWith(e, 'فشل الحذف.'); }
  };

  // Wipe the opened days (within the class filter, if one is chosen).
  const resetAttendance = async () => {
    const body = { sessionIds: scopedIds };
    try {
      const preview = (await apiClient.post('/attendance/reset', { ...body, confirm: false })).data;
      if (preview.sessionsDeleted === 0) {
        setMsg({ type: 'error', text: 'لا يوجد حضور مسجل في التحديد الحالي.' });
        return;
      }
      const dayList = pickedDayObjects.map(d => d.title).join('، ');
      const where = activeClass ? classOptions.find(c => c.id === activeClass)?.caption : 'كل الفصول';
      const ok = window.confirm(
        `سيتم حذف الحضور في: ${dayList}\n(${where})\n\n` +
        `${preview.sessionsDeleted} جلسة و${preview.recordsDeleted} تسجيل.\n\nلا يمكن التراجع. هل أنت متأكد؟`
      );
      if (!ok) return;
      await apiClient.post('/attendance/reset', { ...body, confirm: true });
      setMsg({ type: 'success', text: 'تم مسح الحضور.' });
      refresh();
    } catch (e) { failWith(e, 'فشل مسح الحضور.'); }
  };

  const exportExcel = () => {
    const header = ['الطالب', 'الكود', ...matrix.columns.map(c => c.label), 'حاضر', 'غائب'];
    const body = matrix.rows.map(s => [
      s.name,
      s.code,
      ...matrix.columns.map(c => {
        const cell = s.cells[c.id];
        return cell ? STATUS_LABELS[cell.status] : '';
      }),
      s.present,
      s.absent,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
    ws['!cols'] = [{ wch: 30 }, { wch: 16 }, ...matrix.columns.map(() => ({ wch: 14 })), { wch: 8 }, { wch: 8 }];
    const wb = XLSX.utils.book_new();
    wb.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(wb, ws, 'الحضور');
    const dayNames = [...new Set(matrix.columns.map(c => c.day.replaceAll('/', '-')))];
    const datePart = dayNames.length <= 1 ? dayNames[0] : `${dayNames[0]}_الى_${dayNames[dayNames.length - 1]}`;
    XLSX.writeFile(wb, `سجل_الحضور_${datePart ?? ''}.xlsx`);
  };

  return (
    <>
      {msg && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 'var(--radius-sm)', background: msg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
          {msg.text}
          <span style={{ cursor: 'pointer' }} onClick={() => setMsg(null)}>✕</span>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
        <div>
          <label style={labelStyle}>المرحلة</label>
          <select className="premium-input" value={filters.stageId} onChange={e => setScopeFilter({ stageId: e.target.value, gradeId: '' })}>
            <option value="">كل المراحل</option>
            {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>الصف</label>
          <select className="premium-input" value={filters.gradeId} onChange={e => setScopeFilter({ gradeId: e.target.value })}>
            <option value="">كل الصفوف</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>الحالة</label>
          <select className="premium-input" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
            <option value="">كل الحالات</option>
            {STATUS_QUERY_NAMES.map((name, i) => <option key={name} value={name}>{STATUS_LABELS[i]}</option>)}
          </select>
        </div>
        <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.25rem', marginRight: 'auto' }} onClick={exportExcel} disabled={visibleRecords.length === 0}>
          تصدير Excel
        </button>
        <button
          className="btn-secondary"
          style={{ width: 'auto', padding: '0.5rem 1.25rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.4)' }}
          onClick={resetAttendance}
          disabled={scopedIds.length === 0}
          title={scopedIds.length === 0 ? 'افتح يومًا أو أكثر أولًا' : ''}
        >
          مسح حضور {pickedDays.length === 1 ? 'اليوم المفتوح' : `الأيام المفتوحة (${pickedDays.length})`}
        </button>

        {/* Recorded days: one button per date — opening it shows every student of the selection */}
        <div style={{ flexBasis: '100%' }}>
          <label style={{ ...labelStyle, marginBottom: '0.4rem' }}>
            أيام الحضور المسجلة {days.length > 0 && `(${days.length})`}
          </label>
          {sessionsLoading && sessions.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>جاري التحميل...</p>
          ) : sessions.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>لا توجد جلسات حضور مسجلة لهذا الاختيار</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '11rem', overflowY: 'auto', padding: '0.1rem' }}>
              {days.length > 1 && (
                <button type="button" onClick={toggleAllDays} aria-pressed={allDaysPicked} style={{ ...chipStyle(allDaysPicked), justifyContent: 'center' }}>
                  <span style={{ fontWeight: 700 }}>كل الأيام</span>
                </button>
              )}
              {days.map(d => {
                const on = pickedDays.includes(d.key);
                const present = d.sessions.reduce((n, x) => n + x.presentCount, 0);
                const absent = d.sessions.reduce((n, x) => n + x.absentCount, 0);
                return (
                  <button key={d.key} type="button" onClick={() => toggleDay(d.key)} aria-pressed={on} style={{ ...chipStyle(on), padding: '0.6rem 1.1rem', minWidth: '150px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>{d.title}</span>
                    <span style={{ fontSize: '0.7rem' }}>
                      <span style={{ color: STATUS_COLORS[0] }}>{present} حاضر</span>
                      {' · '}
                      <span style={{ color: STATUS_COLORS[1] }}>{absent} غائب</span>
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {d.sessions.length} {d.sessions.length === 1 ? 'فصل' : 'فصول'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Class filter — only once a day is open and more than one class took part */}
      {pickedSessions.length > 0 && classOptions.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>تصفية بالفصل:</span>
          <button type="button" onClick={() => setClassFilter('')} aria-pressed={activeClass === ''} style={{ ...chipStyle(activeClass === ''), flexDirection: 'row', padding: '0.3rem 0.9rem' }}>
            كل الفصول
          </button>
          {classOptions.map(c => (
            <button key={c.id} type="button" onClick={() => setClassFilter(c.id)} aria-pressed={activeClass === c.id} style={{ ...chipStyle(activeClass === c.id), flexDirection: 'row', gap: '0.5rem', padding: '0.3rem 0.9rem' }}>
              <span style={{ fontWeight: 700 }}>{c.caption}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.present + c.absent}</span>
            </button>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <SummaryCard label="الأيام المفتوحة" value={pickedDays.length} />
        <SummaryCard label="حاضر" value={presentCount} color={STATUS_COLORS[0]} />
        <SummaryCard label="غائب" value={absentCount} color={STATUS_COLORS[1]} />
      </div>

      {/* Consecutive absences alert */}
      {alertSummary && alertSummary.byStudent.some(s => s.consecutiveAbsences >= 3) && (
        <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', border: '1px solid var(--danger)' }}>
          <p style={{ color: 'var(--danger)', fontWeight: 700, marginBottom: '0.5rem' }}>⚠ تنبيه: غياب متتالٍ</p>
          {alertSummary.byStudent.filter(s => s.consecutiveAbsences >= 3).map(s => (
            <p key={s.studentId} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {s.studentName} — {s.consecutiveAbsences} غيابات متتالية
            </p>
          ))}
        </div>
      )}

      {/* Records Table */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>جاري التحميل...</p>
        ) : pickedSessions.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>اختر يومًا من الأزرار بالأعلى لعرض الحضور</p>
        ) : visibleRecords.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>لا توجد سجلات مطابقة</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'right' }}>
                  <th style={{ padding: '0.6rem', position: 'sticky', right: 0, background: 'var(--bg-secondary)', minWidth: '200px' }}>
                    الطالب <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>({matrix.rows.length})</span>
                  </th>
                  {matrix.columns.map(c => (
                    <th key={c.id} style={{ padding: '0.6rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {c.label}
                      <button
                        onClick={() => deleteDay(c)}
                        title="حذف حضور هذا اليوم"
                        aria-label={`حذف حضور ${c.label}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', verticalAlign: 'middle',
                          width: '30px', height: '30px', marginInlineStart: '0.5rem', cursor: 'pointer',
                          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)',
                          borderRadius: '8px', color: 'var(--danger)',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                      </button>
                    </th>
                  ))}
                  <th style={{ padding: '0.6rem', textAlign: 'center', color: STATUS_COLORS[0] }}>حاضر</th>
                  <th style={{ padding: '0.6rem', textAlign: 'center', color: STATUS_COLORS[1] }}>غائب</th>
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map(student => (
                  <tr key={student.id} style={{ borderBottom: '1px solid var(--surface-2)' }}>
                    <td style={{ padding: '0.6rem', position: 'sticky', right: 0, background: 'var(--bg-secondary)', whiteSpace: 'nowrap' }}>
                      {student.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({student.code})</span>
                    </td>
                    {matrix.columns.map(c => {
                      const cell = student.cells[c.id];
                      return (
                        <td key={c.id} style={{ padding: '0.4rem', textAlign: 'center' }}>
                          {cell ? (
                            <button
                              onClick={() => openOverride(cell)}
                              title="تعديل"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600, color: STATUS_COLORS[cell.status], padding: '0.2rem 0.5rem' }}
                            >
                              {STATUS_LABELS[cell.status]}
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 700, color: STATUS_COLORS[0] }}>{student.present}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 700, color: STATUS_COLORS[1] }}>{student.absent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Override Modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-card" style={{ padding: '2rem', width: '420px', maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto', direction: 'rtl' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>تعديل حالة الحضور</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{editing.studentName} — {editing.sessionTitle}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {STATUS_LABELS.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => setOverrideForm({ ...overrideForm, status: i })}
                    style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', border: `1px solid ${overrideForm.status === i ? STATUS_COLORS[i] : 'var(--glass-border)'}`, background: overrideForm.status === i ? `${STATUS_COLORS[i]}22` : 'transparent', color: overrideForm.status === i ? STATUS_COLORS[i] : 'var(--text-secondary)', transition: 'all 0.15s' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <textarea className="premium-input" placeholder="سبب التعديل (إلزامي)" rows={3} value={overrideForm.reason} onChange={e => setOverrideForm({ ...overrideForm, reason: e.target.value })} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn-primary" style={{ flex: 1 }} disabled={!overrideForm.reason.trim()} onClick={submitOverride}>حفظ</button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setEditing(null)}>إلغاء</button>
            </div>
            <button
              onClick={deleteRecord}
              style={{ marginTop: '1rem', width: '100%', background: 'none', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              حذف هذا التسجيل
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AttendanceDashboardScreen;
