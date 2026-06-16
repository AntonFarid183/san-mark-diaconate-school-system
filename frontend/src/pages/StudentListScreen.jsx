import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import Layout from '../Layout';

const StudentListScreen = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, pageSize: 10 };
      if (searchTerm.trim()) params.name = searchTerm.trim();
      const response = await apiClient.get('/students', { params });
      setStudents(response.data.students);
      setTotalPages(response.data.totalPages);
      setTotalCount(response.data.totalCount);
    } catch (err) {
      setError('فشل في تحميل قائمة الطلاب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const statsCards = [
    { icon: 'group', label: 'إجمالي الطلاب', value: totalCount.toLocaleString('ar-EG'), trend: '' },
    { icon: 'check_circle', label: 'النشطون حالياً', value: '982' },
    { icon: 'pending_actions', label: 'طلبات الانتظار', value: '45', sub: 'تحتاج لمراجعة إدارية', color: 'var(--warning)' },
    { icon: 'trending_up', label: 'نسبة الحضور', value: '94%', sub: 'المتوسط العام للمرحلة' },
  ];

  const pageNumbers = () => {
    const pages = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <Layout title="قائمة الطلاب">
      <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>إدارة ومراجعة بيانات الطلاب المسجلين في البرامج المختلفة.</p>

      {/* Stats cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {statsCards.map((card, i) => (
          <div key={i} className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px', color: card.color || 'var(--accent-gold)' }}>{card.icon}</span>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{card.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{card.sub || card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Add */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '500px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span className="material-symbols-outlined" style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', fontSize: '20px', pointerEvents: 'none',
            }}>search</span>
            <input
              type="text"
              placeholder="بحث باسم الطالب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="premium-input"
              style={{ paddingRight: '40px' }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}>
            بحث
          </button>
        </form>
        <button
          onClick={() => navigate('/register-student')}
          className="btn-primary"
          style={{ width: 'auto', padding: '0.75rem 1.5rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
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
                    <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--accent-gold)', fontSize: '0.85rem', fontWeight: 700 }}>الاسم الكامل</th>
                    <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--accent-gold)', fontSize: '0.85rem', fontWeight: 700 }}>المرحلة الدراسية</th>
                    <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--accent-gold)', fontSize: '0.85rem', fontWeight: 700 }}>السنة الدراسية</th>
                    <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--accent-gold)', fontSize: '0.85rem', fontWeight: 700 }}>تاريخ الميلاد</th>
                    <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--accent-gold)', fontSize: '0.85rem', fontWeight: 700 }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا يوجد طلاب</td></tr>
                  ) : (
                    students.map((s, idx) => (
                      <tr
                        key={s.id}
                        style={{
                          borderBottom: '1px solid var(--glass-border)',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 600 }}>{s.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>رقم القيد: #{s.studentCode || '—'}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>{s.stageName}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: 'var(--success)',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                          }}>
                            {s.gradeName}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{s.dateOfBirth}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button
                            onClick={() => navigate(`/students/${s.id}`)}
                            className="btn-secondary"
                            style={{ padding: '0.3rem 1rem', fontSize: '0.8rem' }}
                          >
                            عرض الملف
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.5rem',
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              عرض ١ - ١٠ من أصل {totalCount.toLocaleString('ar-EG')} طالباً
            </span>
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary"
                style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', opacity: page === totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
              </button>
              {pageNumbers().map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: '32px', height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    border: p === page ? 'none' : '1px solid var(--glass-border)',
                    background: p === page ? 'var(--accent-gold)' : 'transparent',
                    color: p === page ? '#1e293b' : 'var(--text-secondary)',
                    fontWeight: p === page ? 700 : 400,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                  }}
                >{p.toLocaleString('ar-EG')}</button>
              ))}
              {totalPages > pageNumbers().slice(-1)[0] && (
                <span style={{ color: 'var(--text-muted)', padding: '0 0.25rem' }}>...</span>
              )}
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary"
                style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', opacity: page === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center' }}
              >
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
