import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';
import StudentPaymentModal from '../components/StudentPaymentModal';
import ExportModal from '../components/ExportModal';
import { STUDENT_EXPORT_COLUMNS, formatStudentForExport } from '../utils/studentExport';

const StudentListScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gradeId = searchParams.get('gradeId') || '';
  const stageId = searchParams.get('stageId') || '';
  const gradeName = searchParams.get('gradeName') || '';

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentModalStudent, setPaymentModalStudent] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [exportRows, setExportRows] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);

  // Class filter — classes are scoped to a grade + academic year, but a student's
  // class may belong to any year (not just the current one), so pull classes for
  // this grade across every academic year rather than assuming "current".
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');

  useEffect(() => {
    apiClient.get('/academic-years').then(r => setAcademicYears(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setClassId(''); setClasses([]);
    if (gradeId && academicYears.length > 0) {
      Promise.all(
        academicYears.map(y =>
          apiClient.get('/classes', { params: { gradeId, academicYearId: y.id } })
            .then(r => r.data.map(c => ({ ...c, yearLabel: y.name })))
            .catch(() => [])
        )
      ).then(results => setClasses(results.flat()));
    }
  }, [gradeId, academicYears]);

  const fetchStudents = async (pg = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: pg, pageSize: 20 };
      if (searchTerm.trim()) params.name = searchTerm.trim();
      if (classId) params.classId = classId;
      else if (gradeId) params.gradeId = gradeId;
      else if (stageId) params.stageId = stageId;
      const res = await apiClient.get('/students', { params });
      setStudents(res.data.students);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.totalCount);
    } catch {
      setError('فشل في تحميل قائمة الطلاب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); fetchStudents(1); }, [gradeId, stageId, classId]);
  useEffect(() => { fetchStudents(); }, [page]);

  // Live search — debounced so we don't hit the server on every keystroke
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const timer = setTimeout(() => { setPage(1); fetchStudents(1); }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // ── Export: fetch all matching rows, then let the user pick columns ───────
  const openExport = async () => {
    setExportLoading(true);
    try {
      const params = { page: 1, pageSize: 1000 };
      if (searchTerm.trim()) params.name = searchTerm.trim();
      if (classId) params.classId = classId;
      else if (gradeId) params.gradeId = gradeId;
      else if (stageId) params.stageId = stageId;

      const res = await apiClient.get('/students', { params });
      setExportRows(res.data.students.map(formatStudentForExport));
      setShowExport(true);
    } catch {
      alert('فشل تحميل بيانات التصدير');
    } finally {
      setExportLoading(false);
    }
  };

  const pageNumbers = () => {
    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const selectedClassName = classId ? classes.find(c => c.id === classId)?.name : '';
  const exportLabel = selectedClassName ? `${gradeName} — فصل ${selectedClassName}` : (gradeName || 'جميع الطلاب');
  const pageTitle = gradeName ? `طلاب — ${gradeName}` : 'قائمة الطلاب';
  usePageTitle(pageTitle);

  return (
    <>
      {/* Sub-header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {selectedClassName
            ? `عرض طلاب فصل ${selectedClassName} — إجمالي ${totalCount} طالب`
            : gradeName
            ? `عرض طلاب السنة الدراسية: ${gradeName} — إجمالي ${totalCount} طالب`
            : `جميع الطلاب المسجلين — إجمالي ${totalCount} طالب`}
        </p>

        <button
          onClick={openExport}
          disabled={exportLoading || totalCount === 0}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.55rem 1.25rem', borderRadius: 'var(--radius-sm)',
            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)',
            color: 'var(--c-green)', fontWeight: 700, fontSize: '0.88rem',
            cursor: exportLoading || totalCount === 0 ? 'not-allowed' : 'pointer',
            opacity: totalCount === 0 ? 0.5 : 1, transition: 'all 0.2s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => { if (totalCount > 0) e.currentTarget.style.background = 'rgba(34,197,94,0.22)'; }}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.12)'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {exportLoading ? 'hourglass_top' : 'download'}
          </span>
          {exportLoading ? 'جاري التحميل...' : 'تصدير Excel'}
        </button>
      </div>

      {/* Search & Add */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '20px', pointerEvents: 'none' }}>search</span>
            <input
              type="text" placeholder="بحث باسم الطالب أو الكود..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="premium-input" style={{ paddingRight: '40px' }}
            />
          </div>
          {gradeId && classes.length > 0 && (
            <select className="premium-input" value={classId} onChange={e => setClassId(e.target.value)} style={{ maxWidth: '180px' }}>
              <option value="">كل الفصول</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  فصل {c.name}{academicYears.length > 1 ? ` (${c.yearLabel})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
        <button onClick={() => navigate('/register-student')} className="btn-primary"
          style={{ width: 'auto', padding: '0.75rem 1.5rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
          إضافة طالب
        </button>
      </div>

      {loading && <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>}
      {error && <div className="error-box" style={{ textAlign: 'center' }}>{error}</div>}

      {!loading && !error && (
        <>
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--surface-1)' }}>
                    {['الاسم الكامل', 'المرحلة', 'السنة الدراسية', 'الفصل', 'تاريخ الميلاد', 'الإجراءات'].map((h, i) => (
                      <th key={i} style={{ padding: '1rem', textAlign: i === 5 ? 'center' : 'right', color: 'var(--accent-gold)', fontSize: '0.85rem', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا يوجد طلاب</td></tr>
                  ) : students.map(s => (
                    <tr key={s.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{s.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.studentCode}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>{s.stageName}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem' }}>
                          {s.gradeName}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {s.className
                          ? <span style={{ color: 'var(--text-secondary)' }}>{s.className}</span>
                          : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>بانتظار التوزيع</span>}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{s.dateOfBirth}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button onClick={() => navigate(`/students/${s.id}`)} className="btn-secondary" style={{ padding: '0.3rem 1rem', fontSize: '0.8rem' }}>
                            عرض الملف
                          </button>
                          <button onClick={() => setPaymentModalStudent(s)} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(251,191,36,0.4)', background: 'rgba(251,191,36,0.08)', color: 'var(--accent-gold)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>payments</span>
                            المدفوعات
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              صفحة {page} من {totalPages} — {totalCount} طالب
            </span>
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="btn-secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', opacity: page === totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
              </button>
              {pageNumbers().map(p => (
                <button key={p} onClick={() => setPage(p)} style={{
                  width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
                  border: p === page ? 'none' : '1px solid var(--glass-border)',
                  background: p === page ? 'var(--accent-gold)' : 'transparent',
                  color: p === page ? 'var(--on-accent)' : 'var(--text-secondary)',
                  fontWeight: p === page ? 700 : 400, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: '0.85rem', transition: 'all 0.2s',
                }}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', opacity: page === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
              </button>
            </div>
          </div>
        </>
      )}

      {paymentModalStudent && (
        <StudentPaymentModal
          studentId={paymentModalStudent.id}
          studentName={paymentModalStudent.fullName}
          onClose={() => setPaymentModalStudent(null)}
        />
      )}

      {showExport && (
        <ExportModal
          columns={STUDENT_EXPORT_COLUMNS}
          rows={exportRows}
          storageKey="students-list"
          fileName={(gradeName ? `طلاب_${exportLabel}` : 'جميع_الطلاب').replace(/\s+/g, '_')}
          sheetName={exportLabel}
          onClose={() => setShowExport(false)}
        />
      )}
    </>
  );
};

export default StudentListScreen;
