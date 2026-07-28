import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';
import ExportModal from '../components/ExportModal';

const PAYMENT_EXPORT_COLUMNS = [
  { key: 'studentCode', label: 'الكود' },
  { key: 'fullName', label: 'الاسم' },
  { key: 'stageName', label: 'المرحلة' },
  { key: 'gradeName', label: 'السنة' },
  { key: 'registeredDate', label: 'تاريخ التسجيل' },
  { key: 'paymentStatusLabel', label: 'حالة الدفع' },
  { key: 'paidAmount', label: 'المبلغ المدفوع' },
];

const ALL_STAGES = [
  { id: '00000000-0000-0000-0000-000000000001', label: 'طفولة' },
  { id: '00000000-0000-0000-0001-000000000001', label: 'ابتدائي' },
  { id: '00000000-0000-0000-0002-000000000001', label: 'إعدادي' },
  { id: '00000000-0000-0000-0003-000000000001', label: 'ثانوي' },
  { id: '00000000-0000-0000-0004-000000000001', label: 'جامعة' },
  { id: '00000000-0000-0000-0005-000000000001', label: 'خريجون' },
  { id: '00000000-0000-0000-0006-000000000001', label: 'كبار' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'الكل' },
  { value: 'paid', label: 'مدفوع' },
  { value: 'exempted', label: 'معفى' },
  { value: 'not_paid', label: 'غير مدفوع' },
];

const formatAmount = (val) => {
  if (val == null) return '—';
  return `${Number(val).toLocaleString('ar-EG')} ج.م`;
};

const paymentBadge = (status) => {
  switch (status) {
    case 'paid':
      return { label: 'مدفوع', color: 'var(--success)', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' };
    case 'exempted':
      return { label: 'معفى', color: 'var(--accent-gold)', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)' };
    case 'not_paid':
      return { label: 'غير مدفوع', color: 'var(--danger)', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' };
    default:
      return { label: '—', color: 'var(--text-muted)', bg: 'transparent', border: 'transparent' };
  }
};

export default function PaymentReportsScreen() {
  usePageTitle('تقرير المدفوعات');
  const [searchParams] = useSearchParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState([]);
  const [grades, setGrades] = useState([]);

  const [showExport, setShowExport] = useState(false);

  const [filters, setFilters] = useState({
    name: searchParams.get('name') || '',
    stageId: searchParams.get('stageId') || '',
    gradeId: searchParams.get('gradeId') || '',
    paymentStatus: searchParams.get('paymentStatus') || '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    apiClient.get('/students/stages').then(r => setStages(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (filters.stageId) {
      apiClient.get(`/students/grades/${filters.stageId}`).then(r => setGrades(r.data)).catch(() => setGrades([]));
    } else {
      setGrades([]);
    }
  }, [filters.stageId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.name.trim()) params.name = filters.name.trim();
      if (filters.stageId) params.stageId = filters.stageId;
      if (filters.gradeId) params.gradeId = filters.gradeId;
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const res = await apiClient.get('/students/payment-report', { params });
      setData(res.data);
    } catch {
      alert('فشل تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  // Live search — debounced so typing doesn't hit the server on every keystroke
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const timer = setTimeout(() => { fetchReport(); }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.name]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'stageId' ? { gradeId: '' } : {}),
    }));
  };

  const statCard = (icon, label, value, color) => (
    <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center', flex: 1, minWidth: '160px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '32px', color, marginBottom: '0.5rem', display: 'block' }}>{icon}</span>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color }}>{value}</div>
    </div>
  );

  return (
    <>
      <p style={{ marginBottom: '1.5rem', fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>تقرير شامل بمدفوعات الطلاب والمبالغ المحصلة.</p>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {statCard('groups', 'إجمالي الطلاب', data?.totalCount ?? '—', 'var(--text-primary)')}
        {statCard('payments', 'مدفوع', data?.paidCount ?? '—', 'var(--success)')}
        {statCard('volunteer_activism', 'معفى', data?.items?.filter(i => i.paymentStatus === 'exempted').length ?? '—', 'var(--accent-gold)')}
        {statCard('account_balance', 'الإجمالي المحصل', data ? formatAmount(data.totalCollected) : '—', 'var(--success)')}
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>بحث</label>
            <input type="text" name="name" className="premium-input" placeholder="اسم الطالب أو الكود..." value={filters.name} onChange={handleFilterChange} style={{ padding: '0.55rem 0.75rem', fontSize: '0.88rem' }} />
          </div>
          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>المرحلة</label>
            <select name="stageId" className="premium-input" value={filters.stageId} onChange={handleFilterChange} style={{ padding: '0.55rem 0.75rem', fontSize: '0.88rem' }}>
              <option value="">الكل</option>
              {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>السنة الدراسية</label>
            <select name="gradeId" className="premium-input" value={filters.gradeId} onChange={handleFilterChange} style={{ padding: '0.55rem 0.75rem', fontSize: '0.88rem' }} disabled={!filters.stageId}>
              <option value="">الكل</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div style={{ minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>حالة الدفع</label>
            <select name="paymentStatus" className="premium-input" value={filters.paymentStatus} onChange={handleFilterChange} style={{ padding: '0.55rem 0.75rem', fontSize: '0.88rem' }}>
              {PAYMENT_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={{ minWidth: '140px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>من تاريخ</label>
            <input type="date" name="dateFrom" className="premium-input" value={filters.dateFrom} onChange={handleFilterChange} style={{ padding: '0.55rem 0.75rem', fontSize: '0.88rem' }} />
          </div>
          <div style={{ minWidth: '140px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>إلى تاريخ</label>
            <input type="date" name="dateTo" className="premium-input" value={filters.dateTo} onChange={handleFilterChange} style={{ padding: '0.55rem 0.75rem', fontSize: '0.88rem' }} />
          </div>
          <div>
            <button onClick={fetchReport} disabled={loading} style={{
              padding: '0.55rem 1.5rem', borderRadius: 'var(--radius-sm)', border: 'none',
              background: 'var(--accent-gold)', color: 'var(--on-accent)', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{loading ? 'hourglass_top' : 'search'}</span>
              {loading ? 'جاري التحميل...' : 'بحث'}
            </button>
          </div>
          <div>
            <button onClick={() => setShowExport(true)} disabled={!data || data.items.length === 0} style={{
              padding: '0.55rem 1.5rem', borderRadius: 'var(--radius-sm)',
              background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)',
              color: 'var(--c-green)', cursor: (!data || data.items.length === 0) ? 'not-allowed' : 'pointer',
              opacity: (!data || data.items.length === 0) ? 0.5 : 1,
              fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
              تصدير Excel
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>جاري التحميل...</p>
      ) : !data || data.items.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '1rem', display: 'block' }}>receipt_long</span>
          <p style={{ fontWeight: 600 }}>لا توجد بيانات</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>لم يتم العثور على نتائج للفلاتر المحددة</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--track-inset)' }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>الكود</th>
                  <th style={thStyle}>الاسم</th>
                  <th style={thStyle}>المرحلة</th>
                  <th style={thStyle}>السنة</th>
                  <th style={thStyle}>تاريخ التسجيل</th>
                  <th style={thStyle}>الحالة</th>
                  <th style={thStyle}>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, i) => {
                  const badge = paymentBadge(item.paymentStatus);
                  return (
                    <tr key={item.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--surface-2)' }}>
                      <td style={tdStyle}>{i + 1}</td>
                      <td style={{ ...tdStyle, direction: 'ltr', textAlign: 'right', fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{item.studentCode}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{item.fullName}</td>
                      <td style={tdStyle}>{item.stageName}</td>
                      <td style={tdStyle}>{item.gradeName}</td>
                      <td style={{ ...tdStyle, fontSize: '0.82rem', color: 'var(--text-muted)' }}>{new Date(item.registeredDate).toLocaleDateString('ar-EG')}</td>
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-block', padding: '0.15rem 0.65rem', borderRadius: '20px',
                          background: badge.bg, border: `1px solid ${badge.border}`,
                          color: badge.color, fontWeight: 600, fontSize: '0.82rem',
                        }}>{badge.label}</span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: item.paidAmount ? 'var(--success)' : 'var(--text-muted)' }}>
                        {item.paymentStatus === 'paid' ? formatAmount(item.paidAmount) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
            إجمالي {data.totalCount} طالب — {data.paidCount} مدفوع — {data.items.filter(i => i.paymentStatus === 'exempted').length} معفى — إجمالي محصل {formatAmount(data.totalCollected)}
          </div>
        </div>
      )}

      {showExport && data && (
        <ExportModal
          columns={PAYMENT_EXPORT_COLUMNS}
          rows={data.items.map(i => ({
            ...i,
            paymentStatusLabel: paymentBadge(i.paymentStatus).label,
            registeredDate: new Date(i.registeredDate).toLocaleDateString('ar-EG'),
          }))}
          storageKey="payment-reports"
          fileName="تقرير_المدفوعات"
          sheetName="تقرير المدفوعات"
          onClose={() => setShowExport(false)}
        />
      )}
    </>
  );
}

const thStyle = {
  padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, fontSize: '0.8rem',
  color: 'var(--text-muted)', whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '0.65rem 1rem', whiteSpace: 'nowrap',
};