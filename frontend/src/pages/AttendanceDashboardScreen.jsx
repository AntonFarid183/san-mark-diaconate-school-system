import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';

// Enum values mirror DiaconateSchool.Domain.Enums.AttendanceStatus (serialized as numbers)
const STATUS_LABELS = ['حاضر', 'غائب'];
const STATUS_COLORS = ['var(--success)', 'var(--danger)'];
const STATUS_QUERY_NAMES = ['Present', 'Absent'];
const METHOD_PIN = 1;

const toInputDate = (d) => d.toISOString().slice(0, 10);

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

  const [grades, setGrades] = useState([]);
  const [filters, setFilters] = useState({
    gradeId: '', status: '', from: toInputDate(weekAgo), to: toInputDate(today),
  });
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [editing, setEditing] = useState(null);
  const [overrideForm, setOverrideForm] = useState({ status: 0, reason: '' });

  useEffect(() => {
    apiClient.get('/students/grades').then(r => setGrades(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchData(); }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const from = `${filters.from}T00:00:00`;
      const to = `${filters.to}T23:59:59`;

      const summaryParams = { from, to };
      if (filters.gradeId) summaryParams.gradeId = filters.gradeId;

      const recordParams = { from, to };
      if (filters.gradeId) recordParams.gradeId = filters.gradeId;
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

  const exportExcel = () => {
    const rows = records.map((r, i) => ({
      '#': i + 1,
      'الطالب': r.studentName,
      'الكود': r.studentCode,
      'الجلسة': r.sessionTitle,
      'الحالة': STATUS_LABELS[r.status] ?? r.status,
      'الطريقة': r.method === METHOD_PIN ? 'رمز دخول' : 'يدوي',
      'تاريخ التسجيل': new Date(r.recordedAt).toLocaleDateString('ar-EG'),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 5 }, { wch: 26 }, { wch: 14 }, { wch: 24 }, { wch: 8 }, { wch: 10 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
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
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>الصف</label>
          <select className="premium-input" value={filters.gradeId} onChange={e => setFilters({ ...filters, gradeId: e.target.value })}>
            <option value="">كل الصفوف</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
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
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'right' }}>
                <th style={{ padding: '0.6rem' }}>الطالب</th>
                <th style={{ padding: '0.6rem' }}>الجلسة</th>
                <th style={{ padding: '0.6rem' }}>الحالة</th>
                <th style={{ padding: '0.6rem' }}>الطريقة</th>
                <th style={{ padding: '0.6rem' }}>التاريخ</th>
                <th style={{ padding: '0.6rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--surface-2)' }}>
                  <td style={{ padding: '0.6rem' }}>{r.studentName} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({r.studentCode})</span></td>
                  <td style={{ padding: '0.6rem' }}>{r.sessionTitle}</td>
                  <td style={{ padding: '0.6rem', color: STATUS_COLORS[r.status], fontWeight: 600 }}>{STATUS_LABELS[r.status]}</td>
                  <td style={{ padding: '0.6rem', color: 'var(--text-muted)' }}>{r.method === METHOD_PIN ? 'رمز دخول' : 'يدوي'}</td>
                  <td style={{ padding: '0.6rem', color: 'var(--text-muted)' }}>{new Date(r.recordedAt).toLocaleDateString('ar-EG')}</td>
                  <td style={{ padding: '0.6rem' }}>
                    <button onClick={() => openOverride(r)} style={{ background: 'none', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', borderRadius: '6px', padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}>تعديل</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          </div>
        </div>
      )}
    </>
  );
};

export default AttendanceDashboardScreen;
