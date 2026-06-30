import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import apiClient from '../apiClient';
import Layout from '../Layout';

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
  const [exporting, setExporting] = useState(false);

  const fetchStudents = async (pg = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: pg, pageSize: 20 };
      if (searchTerm.trim()) params.name = searchTerm.trim();
      if (gradeId) params.gradeId = gradeId;
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

  useEffect(() => { setPage(1); fetchStudents(1); }, [gradeId, stageId]);
  useEffect(() => { fetchStudents(); }, [page]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchStudents(1); };

  // ── Export all pages as Excel ─────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = { page: 1, pageSize: 200 };
      if (searchTerm.trim()) params.name = searchTerm.trim();
      if (gradeId) params.gradeId = gradeId;
      else if (stageId) params.stageId = stageId;

      // Fetch up to 200 — adjust pageSize if school grows large
      const res = await apiClient.get('/students', { params });
      const all = res.data.students;

      const rows = all.map((s, i) => ({
        '#': i + 1,
        'الكود': s.studentCode || '',
        'الاسم الكامل': s.fullName,
        'المرحلة': s.stageName,
        'السنة الدراسية': s.gradeName,
        'تاريخ الميلاد': s.dateOfBirth || '',
      }));

      const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });

      // Column widths
      ws['!cols'] = [
        { wch: 5 }, { wch: 14 }, { wch: 28 }, { wch: 14 }, { wch: 18 }, { wch: 14 },
      ];

      const wb = XLSX.utils.book_new();
      const sheetName = gradeName || 'جميع الطلاب';
      XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));

      const fileName = gradeName
        ? `طلاب_${gradeName}.xlsx`
        : 'جميع_الطلاب.xlsx';

      XLSX.writeFile(wb, fileName);
    } catch {
      alert('فشل تصدير البيانات');
    } finally {
      setExporting(false);
    }
  };

  const pageNumbers = () => {
    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const pageTitle = gradeName ? `طلاب — ${gradeName}` : 'قائمة الطلاب';

  return (
    <Layout title={pageTitle}>
      {/* Sub-header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {gradeName
            ? `عرض طلاب السنة الدراسية: ${gradeName} — إجمالي ${totalCount} طالب`
            : `جميع الطلاب المسجلين — إجمالي ${totalCount} طالب`}
        </p>

        <button
          onClick={handleExport}
          disabled={exporting || totalCount === 0}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.55rem 1.25rem', borderRadius: 'var(--radius-sm)',
            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)',
            color: '#4ade80', fontWeight: 700, fontSize: '0.88rem',
            cursor: exporting || totalCount === 0 ? 'not-allowed' : 'pointer',
            opacity: totalCount === 0 ? 0.5 : 1, transition: 'all 0.2s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => { if (totalCount > 0) e.currentTarget.style.background = 'rgba(34,197,94,0.22)'; }}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.12)'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {exporting ? 'hourglass_top' : 'download'}
          </span>
          {exporting ? 'جاري التصدير...' : 'تصدير Excel'}
        </button>
      </div>

      {/* Search & Add */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '500px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '20px', pointerEvents: 'none' }}>search</span>
            <input
              type="text" placeholder="بحث باسم الطالب أو الكود..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="premium-input" style={{ paddingRight: '40px' }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}>بحث</button>
        </form>
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
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                    {['الاسم الكامل', 'المرحلة', 'السنة الدراسية', 'تاريخ الميلاد', 'الإجراءات'].map((h, i) => (
                      <th key={i} style={{ padding: '1rem', textAlign: i === 4 ? 'center' : 'right', color: 'var(--accent-gold)', fontSize: '0.85rem', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا يوجد طلاب</td></tr>
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
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{s.dateOfBirth}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button onClick={() => navigate(`/students/${s.id}`)} className="btn-secondary" style={{ padding: '0.3rem 1rem', fontSize: '0.8rem' }}>
                          عرض الملف
                        </button>
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
                  color: p === page ? '#1e293b' : 'var(--text-secondary)',
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
    </Layout>
  );
};

export default StudentListScreen;
