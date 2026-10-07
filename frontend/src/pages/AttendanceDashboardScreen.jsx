import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';

// Enum values mirror DiaconateSchool.Domain.Enums.AttendanceStatus (serialized as numbers)
const STATUS_LABELS = ['حاضر', 'غائب'];
const STATUS_COLORS = ['var(--success)', 'var(--danger)'];
const STATUS_QUERY_NAMES = ['Present', 'Absent'];
const METHOD_PIN = 1;

const toInputDate = (d) => d.toISOString().slice(0, 10);

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

const SummaryCard = ({ label, value, color }) => (
  <div className="glass-card" style={{ padding: '1.25rem', flex: 1, minWidth: '120px', textAlign: 'center' }}>
    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{label}</p>
    <p style={{ fontSize: '1.6rem', fontWeight: 800, color: color || 'var(--accent-gold)' }}>{value}</p>
  </div>
);

const AttendanceDashboardScreen = () => {
  usePageTitle('لوحة تحكم الحضور');
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const [stages, setStages] = useState([]);
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [filters, setFilters] = useState({
    stageId: '', gradeId: '', classId: '', status: '', from: toInputDate(weekAgo), to: toInputDate(today),
  });
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
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
    Promise.all(
      academicYears.map(y =>
        apiClient.get('/classes', { params: { gradeId: filters.gradeId, academicYearId: y.id } })
          .then(r => r.data)
          .catch(() => [])
      )
    ).then(results => setClasses(results.flat()));
  }, [filters.gradeId, academicYears]);

  const setScopeFilter = (patch) => setFilters(f => ({ ...f, ...patch }));

  useEffect(() => { fetchData(); }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const from = `${filters.from}T00:00:00`;
      const to = `${filters.to}T23:59:59`;

      const scopeParams = { from, to };
      if (filters.stageId) scopeParams.stageId = filters.stageId;
      if (filters.gradeId) scopeParams.gradeId = filters.gradeId;
      if (filters.classId) scopeParams.classId = filters.classId;

      const summaryParams = scopeParams;
      const recordParams = { ...scopeParams };
      if (filters.status !== '') recordParams.status = filters.status;

      const [summaryRes, recordsRes] = await Promise.all([
        apiClient.get('/attendance/summary', { params: summaryParams }),
        apiClient.get('/attendance/records', { params: recordParams }),
      ]);
      setSummary(summaryRes.data);
      setRecords(recordsRes.data);
    } catch { setMsg({ type: 'error', text: 'فشل تحميل بيانات الحضور.' }); }
    finally { setLoading(false); }
  };

  const applyQuickRange = (days) => {
    const from = new Date(today.getTime() - days * 86400000);
    setFilters(f => ({ ...f, from: toInputDate(from), to: toInputDate(today) }));
  };

  const openOverride = (record) => {
    setEditing(record);
    setOverrideForm({ status: record.status, reason: '' });
  };

  const submitOverride = async () => {
    try {
      await apiClient.put(`/attendance/records/${editing.id}`, overrideForm);
      setMsg({ type: 'success', text: 'تم تعديل السجل.' });
      setEditing(null);
      fetchData();
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل التعديل.' });
    }
  };

  const matrix = useMemo(() => buildAttendanceMatrix(records), [records]);

  // ── Reset tools (the admin tried things out and wants a clean slate) ──────
  const failWith = (e, fallback) => setMsg({ type: 'error', text: e.response?.data?.message || fallback });

  const deleteRecord = async () => {
    if (!window.confirm(`حذف تسجيل ${editing.studentName} في "${editing.sessionTitle}"؟`)) return;
    try {
      await apiClient.delete(`/attendance/records/${editing.id}`);
      setMsg({ type: 'success', text: 'تم حذف التسجيل.' });
      setEditing(null);
      fetchData();
    } catch (e) { failWith(e, 'فشل حذف التسجيل.'); }
  };

  const deleteSession = async (column) => {
    if (!window.confirm(`حذف حضور يوم ${column.label} بالكامل (كل الطلاب)؟\nلا يمكن التراجع.`)) return;
    try {
      await apiClient.delete(`/attendance/sessions/${column.id}`);
      setMsg({ type: 'success', text: 'تم حذف الحضور لهذا اليوم.' });
      fetchData();
    } catch (e) { failWith(e, 'فشل الحذف.'); }
  };

  const hasScope = !!(filters.stageId || filters.gradeId || filters.classId);
  const scopeLabel = () => {
    if (filters.classId) return `الفصل ${classes.find(c => c.id === filters.classId)?.name ?? ''}`;
    if (filters.gradeId) return grades.find(g => g.id === filters.gradeId)?.name ?? 'الصف المحدد';
    return stages.find(s => s.id === filters.stageId)?.name ?? 'المرحلة المحددة';
  };

  const resetAttendance = async () => {
    const body = {
      stageId: filters.stageId || null,
      gradeId: filters.gradeId || null,
      classId: filters.classId || null,
      from: `${filters.from}T00:00:00`,
      to: `${filters.to}T23:59:59`,
    };
    try {
      const preview = (await apiClient.post('/attendance/reset', { ...body, confirm: false })).data;
      if (preview.sessionsDeleted === 0) {
        setMsg({ type: 'error', text: 'لا يوجد حضور مسجل في هذا النطاق.' });
        return;
      }
      const ok = window.confirm(
        `سيتم حذف حضور ${scopeLabel()} من ${filters.from} إلى ${filters.to}:\n` +
        `${preview.sessionsDeleted} جلسة و${preview.recordsDeleted} تسجيل.\n\nلا يمكن التراجع. هل أنت متأكد؟`
      );
      if (!ok) return;
      await apiClient.post('/attendance/reset', { ...body, confirm: true });
      setMsg({ type: 'success', text: 'تم مسح الحضور.' });
      fetchData();
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
    XLSX.writeFile(wb, `سجل_الحضور_${filters.from}_${filters.to}.xlsx`);
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
            {(filters.gradeId ? classes : []).map(c => <option key={c.id} value={c.id}>فصل {c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>الحالة</label>
          <select className="premium-input" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
            <option value="">كل الحالات</option>
            {STATUS_QUERY_NAMES.map((name, i) => <option key={name} value={name}>{STATUS_LABELS[i]}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>من</label>
          <input className="premium-input" type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>إلى</label>
          <input className="premium-input" type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button className="btn-secondary" style={{ width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.8rem' }} onClick={() => applyQuickRange(0)}>اليوم</button>
          <button className="btn-secondary" style={{ width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.8rem' }} onClick={() => applyQuickRange(7)}>أسبوع</button>
          <button className="btn-secondary" style={{ width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.8rem' }} onClick={() => applyQuickRange(30)}>شهر</button>
        </div>
        <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.25rem', marginRight: 'auto' }} onClick={exportExcel} disabled={records.length === 0}>
          تصدير Excel
        </button>
        <button
          className="btn-secondary"
          style={{ width: 'auto', padding: '0.5rem 1.25rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.4)' }}
          onClick={resetAttendance}
          disabled={!hasScope}
          title={hasScope ? '' : 'اختر مرحلة أو صفًا أو فصلًا أولًا'}
        >
          مسح الحضور
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <SummaryCard label="عدد الجلسات" value={summary.totalSessions} />
          <SummaryCard label="حاضر" value={summary.presentCount} color={STATUS_COLORS[0]} />
          <SummaryCard label="غائب" value={summary.absentCount} color={STATUS_COLORS[1]} />
        </div>
      )}

      {/* Consecutive absences alert */}
      {summary && summary.byStudent.some(s => s.consecutiveAbsences >= 3) && (
        <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', border: '1px solid var(--danger)' }}>
          <p style={{ color: 'var(--danger)', fontWeight: 700, marginBottom: '0.5rem' }}>⚠ تنبيه: غياب متتالٍ</p>
          {summary.byStudent.filter(s => s.consecutiveAbsences >= 3).map(s => (
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
        ) : records.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>لا توجد سجلات في هذه الفترة</p>
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
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem', padding: '0 0 0 0.35rem', opacity: 0.75 }}
                      >✕</button>
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
