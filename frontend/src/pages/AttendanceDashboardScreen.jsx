import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';

// Enum values mirror DiaconateSchool.Domain.Enums.AttendanceStatus (serialized as numbers)
const STATUS_LABELS = ['حاضر', 'غائب'];
const STATUS_COLORS = ['var(--success)', 'var(--danger)'];
const STATUS_QUERY_NAMES = ['Present', 'Absent'];
const METHOD_PIN = 1;

// 5/10/2026 — day/month/year, Latin digits, no zero padding.
const formatDay = (value) => {
  const d = new Date(value);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

/**
 * Pivots flat attendance records into one row per student and one column per
 * session, ordered by session date. Two sessions on the same day get the
 * session title appended so their columns stay distinguishable.
 */
const buildAttendanceMatrix = (records) => {
  const sessions = new Map();
  const students = new Map();

  for (const r of records) {
    if (!sessions.has(r.sessionId)) {
      sessions.set(r.sessionId, { id: r.sessionId, title: r.sessionTitle, startsAt: new Date(r.sessionStartsAt) });
    }
    if (!students.has(r.studentId)) {
      students.set(r.studentId, { id: r.studentId, name: r.studentName, code: r.studentCode, cells: {}, present: 0, absent: 0 });
    }
    const student = students.get(r.studentId);
    student.cells[r.sessionId] = r;
    if (r.status === 0) student.present += 1;
    else student.absent += 1;
  }

  const sortedSessions = [...sessions.values()].sort((a, b) => a.startsAt - b.startsAt);
  const dayCounts = {};
  sortedSessions.forEach(s => { s.day = formatDay(s.startsAt); dayCounts[s.day] = (dayCounts[s.day] || 0) + 1; });
  const columns = sortedSessions.map(s => ({ ...s, label: dayCounts[s.day] > 1 ? `${s.day} - ${s.title}` : s.day }));

  const rows = [...students.values()].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  return { columns, rows };
};

// Chip text for a session: its date, plus the class when the list spans several classes
// (two classes on the same day would otherwise look identical).
const sessionLabel = (all) => {
  const multipleClasses = new Set(all.map(x => x.classId)).size > 1;
  return (x) => `${formatDay(x.startsAt)}${multipleClasses ? ` — ${x.gradeName} ${x.className}` : ''}`;
};

const chipStyle = (on) => ({
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem',
  padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem',
  border: `1px solid ${on ? 'var(--accent-gold)' : 'var(--glass-border)'}`,
  background: on ? 'rgba(251,191,36,0.14)' : 'transparent',
  color: on ? 'var(--accent-gold)' : 'var(--text-secondary)',
  transition: 'all 0.15s',
});

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
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [filters, setFilters] = useState({ stageId: '', gradeId: '', classId: '', status: '' });
  // Sessions the admin has recorded for the chosen stage/grade/class — shown as buttons.
  // Picking one (or several) is what fills the table below.
  const [sessions, setSessions] = useState([]);
  const [sessionsLoadedFor, setSessionsLoadedFor] = useState(null); // request key the sessions list was loaded for
  const [selectedIds, setSelectedIds] = useState([]);
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [recordsLoadedFor, setRecordsLoadedFor] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [msg, setMsg] = useState(null);
  const [editing, setEditing] = useState(null);
  const [overrideForm, setOverrideForm] = useState({ status: 0, reason: '' });

  useEffect(() => {
    apiClient.get('/students/stages').then(r => setStages(r.data)).catch(() => {});
    apiClient.get('/academic-years').then(r => setAcademicYears(r.data)).catch(() => {});
  }, []);

  // Grades narrow to the chosen stage; classes narrow to the chosen grade (across all academic years).
  useEffect(() => {
    const request = filters.stageId ? `/students/grades/${filters.stageId}` : '/students/grades';
    apiClient.get(request).then(r => setGrades(r.data)).catch(() => setGrades([]));
  }, [filters.stageId]);

  useEffect(() => {
    if (!filters.gradeId || academicYears.length === 0) return;
    // The classes endpoint returns one level at a time (Level 1 unless told otherwise), so ask for both.
    const requests = academicYears.flatMap(y => [1, 2].map(level =>
      apiClient.get('/classes', { params: { gradeId: filters.gradeId, academicYearId: y.id, level } })
        .then(r => r.data)
        .catch(() => [])
    ));
    Promise.all(requests).then(results => setClasses(results.flat()));
  }, [filters.gradeId, academicYears]);

  const setScopeFilter = (patch) => setFilters(f => ({ ...f, ...patch }));

  const scopeParams = () => {
    const params = {};
    if (filters.stageId) params.stageId = filters.stageId;
    if (filters.gradeId) params.gradeId = filters.gradeId;
    if (filters.classId) params.classId = filters.classId;
    return params;
  };

  const sessionsRequestKey = `${filters.stageId}|${filters.gradeId}|${filters.classId}|${reloadTick}`;
  const sessionsLoading = sessionsLoadedFor !== sessionsRequestKey;

  // 1) Which sessions exist for this scope (only ones with attendance actually recorded).
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
        // Keep what was picked if it still exists; otherwise start from the latest session.
        setSelectedIds(prev => {
          const kept = prev.filter(id => recorded.some(x => x.id === id));
          return kept.length > 0 ? kept : recorded.slice(0, 1).map(x => x.id);
        });
      })
      .catch(() => { if (current) { setSessions([]); setMsg({ type: 'error', text: 'فشل تحميل الجلسات.' }); } })
      .finally(() => { if (current) setSessionsLoadedFor(requestKey); });
    return () => { current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.stageId, filters.gradeId, filters.classId, reloadTick]);

  // 2) The records of the picked sessions.
  const selectedKey = selectedIds.join(',');
  const recordsRequestKey = `${selectedKey}|${reloadTick}`;
  const loading = selectedIds.length > 0 && recordsLoadedFor !== recordsRequestKey;
  useEffect(() => {
    if (!selectedKey) return;
    let current = true;
    apiClient.get('/attendance/records', { params: { sessionIds: selectedKey } })
      .then(r => { if (current) setRecords(r.data); })
      .catch(() => { if (current) setMsg({ type: 'error', text: 'فشل تحميل بيانات الحضور.' }); })
      .finally(() => { if (current) setRecordsLoadedFor(recordsRequestKey); });
    return () => { current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, reloadTick]);

  // 3) Consecutive-absence alert — looks across every recorded session in scope, not only the picked ones.
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
  }, [sessionRangeKey, filters.stageId, filters.gradeId, filters.classId, reloadTick]);

  const alertSummary = sessionRangeKey ? summary : null;
  const refresh = () => setReloadTick(t => t + 1);

  const toggleSession = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const allSelected = sessions.length > 0 && selectedIds.length === sessions.length;
  const toggleAll = () => setSelectedIds(allSelected ? [] : sessions.map(x => x.id));

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

  // The status filter only changes what the table shows; the cards count everything picked.
  const pickedRecords = useMemo(() => (selectedIds.length === 0 ? [] : records), [selectedIds.length, records]);
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

  const deleteSession = async (column) => {
    if (!window.confirm(`حذف حضور يوم ${column.label} بالكامل (كل الطلاب)؟\nلا يمكن التراجع.`)) return;
    try {
      await apiClient.delete(`/attendance/sessions/${column.id}`);
      setMsg({ type: 'success', text: 'تم حذف الحضور لهذا اليوم.' });
      refresh();
    } catch (e) { failWith(e, 'فشل الحذف.'); }
  };

  // Wipe exactly the sessions that are currently picked.
  const resetAttendance = async () => {
    const body = { sessionIds: selectedIds };
    try {
      const preview = (await apiClient.post('/attendance/reset', { ...body, confirm: false })).data;
      if (preview.sessionsDeleted === 0) {
        setMsg({ type: 'error', text: 'لا يوجد حضور مسجل في الجلسات المحددة.' });
        return;
      }
      const days = sessions.filter(x => selectedIds.includes(x.id)).map(sessionLabel(sessions)).join('، ');
      const ok = window.confirm(
        `سيتم حذف حضور الجلسات المحددة:\n${days}\n\n` +
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
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>المرحلة</label>
          <select className="premium-input" value={filters.stageId} onChange={e => setScopeFilter({ stageId: e.target.value, gradeId: '', classId: '' })}>
            <option value="">كل المراحل</option>
            {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>الصف</label>
          <select className="premium-input" value={filters.gradeId} onChange={e => setScopeFilter({ gradeId: e.target.value, classId: '' })}>
            <option value="">كل الصفوف</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>الفصل</label>
          <select className="premium-input" value={filters.classId} onChange={e => setScopeFilter({ classId: e.target.value })} disabled={!filters.gradeId}>
            <option value="">كل الفصول</option>
            {(filters.gradeId ? classes : []).map(c => <option key={c.id} value={c.id}>فصل {c.name}{c.level === 2 ? ' — المستوى 2' : ''}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>الحالة</label>
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
          disabled={selectedIds.length === 0}
          title={selectedIds.length === 0 ? 'اختر جلسة أو أكثر أولًا' : ''}
        >
          مسح الحضور المحدد ({selectedIds.length})
        </button>

        {/* Recorded sessions — click to show, click again to hide; several can be shown together */}
        <div style={{ flexBasis: '100%' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
            الجلسات المسجلة {sessions.length > 0 && `(${sessions.length})`}
          </label>
          {sessionsLoading && sessions.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>جاري التحميل...</p>
          ) : sessions.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>لا توجد جلسات حضور مسجلة لهذا الاختيار</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '9.5rem', overflowY: 'auto', padding: '0.1rem' }}>
              <button
                type="button"
                onClick={toggleAll}
                style={chipStyle(allSelected)}
              >
                <span style={{ fontWeight: 700 }}>الكل</span>
              </button>
              {sessions.map(x => {
                const label = sessionLabel(sessions)(x);
                const on = selectedIds.includes(x.id);
                return (
                  <button key={x.id} type="button" onClick={() => toggleSession(x.id)} aria-pressed={on} style={chipStyle(on)}>
                    <span style={{ fontWeight: 700 }}>{label}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      <span style={{ color: STATUS_COLORS[0] }}>{x.presentCount} حاضر</span>
                      {' · '}
                      <span style={{ color: STATUS_COLORS[1] }}>{x.absentCount} غائب</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <SummaryCard label="عدد الجلسات المحددة" value={selectedIds.length} />
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
        ) : selectedIds.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>اختر جلسة من الأزرار بالأعلى لعرض الحضور</p>
        ) : visibleRecords.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>لا توجد سجلات مطابقة</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'right' }}>
                  <th style={{ padding: '0.6rem', position: 'sticky', right: 0, background: 'var(--bg-secondary)', minWidth: '200px' }}>الطالب</th>
                  {matrix.columns.map(c => (
                    <th key={c.id} title={c.title} style={{ padding: '0.6rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {c.label}
                      <button
                        onClick={() => deleteSession(c)}
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
