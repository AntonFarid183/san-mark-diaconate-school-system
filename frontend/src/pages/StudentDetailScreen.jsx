import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import Layout from '../Layout';

const genderLabels = { Male: 'ذكر', Female: 'أنثى' };
const deaconRankLabels = {
  Epsaltos: 'إبصالتس (مرتل)',
  Oghnostos: 'أغنسطس (قارئ)',
  Epediakon: 'إيبدياكون (مساعد شماس)',
  Diakon: 'دياكون (شماس كامل)'
};

const StudentDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activating, setActivating] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    const fetchStudent = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/students/${id}`);
        setStudent(response.data);
      } catch (err) {
        setError('فشل في تحميل بيانات الطالب');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  if (loading) return (
    <Layout title="ملف الطالب">
      <div style={{ textAlign: 'center', padding: '4rem' }}><p>جاري التحميل...</p></div>
    </Layout>
  );

  if (error) return (
    <Layout title="ملف الطالب">
      <div className="glass-card" style={{ textAlign: 'center', maxWidth: '500px', margin: '2rem auto' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--danger)', marginBottom: '1rem' }}>error</span>
        <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>
        <button onClick={() => navigate('/students')} className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.5rem' }}>
          العودة للقائمة
        </button>
      </div>
    </Layout>
  );

  const handleActivate = async (withFees, amount = null) => {
    setActivating(true);
    try {
      await apiClient.post(`/students/${id}/activate`, { withFees, paidAmount: amount });
      const response = await apiClient.get(`/students/${id}`);
      setStudent(response.data);
    } catch {
      alert('حدث خطأ أثناء تفعيل الحساب');
    } finally {
      setActivating(false);
    }
  };

  const confirmPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('يرجى إدخال مبلغ صحيح.');
      return;
    }
    setPaymentModal(false);
    handleActivate(true, amount);
  };

  if (!student) return null;

  const formatAmount = (val) => {
    if (val == null) return null;
    return `${Number(val).toLocaleString('ar-EG')} ج.م`;
  };

  const infoFields = [
    { label: 'النوع', value: genderLabels[student.gender] || student.gender },
    { label: 'تاريخ الميلاد', value: student.dateOfBirth },
    { label: 'المرحلة', value: student.stageName },
    { label: 'السنة الدراسية', value: student.gradeName },
    { label: 'أب الاعتراف', value: student.fatherOfConfession },
    ...(student.isDeacon ? [{ label: 'الرتبة الشماسية', value: deaconRankLabels[student.deaconRank] || student.deaconRank }] : []),
    { label: 'موبايل الأب', value: student.fatherMobile, ltr: true },
    { label: 'موبايل الأم', value: student.motherMobile, ltr: true },
    { label: 'واتساب', value: student.whatsAppNumber, ltr: true },
    ...(student.landline ? [{ label: 'تليفون أرضي', value: student.landline, ltr: true }] : []),
    { label: 'حالة الاشتراك', value: student.feesPaid ? 'تم الدفع' : 'غير مدفوع', highlight: student.feesPaid ? 'var(--success)' : 'var(--danger)' },
    ...(student.feesPaid && student.paidAmount != null ? [{ label: 'المبلغ المدفوع', value: formatAmount(student.paidAmount) }] : []),
    { label: 'تاريخ التسجيل', value: new Date(student.registeredDate).toLocaleDateString('ar-EG') },
  ];

  return (
    <Layout title="ملف الطالب">

      {/* Pending activation banner */}
      {!student.isActive && (
        <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--accent-gold)', fontSize: '28px', flexShrink: 0 }}>pending_actions</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '0.3rem' }}>الحساب قيد المراجعة — في انتظار تأكيد الإدارة</div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              سجّل هذا العضو بنفسه عبر نموذج التسجيل الذاتي. يرجى تأكيد وضعه قبل تفعيل الحساب.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
            <button disabled={activating} onClick={() => { setPaymentAmount(''); setPaymentModal(true); }}
              style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--success)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>payments</span>
              تم السداد — تفعيل
            </button>
            <button disabled={activating} onClick={() => handleActivate(false)}
              style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-gold)', background: 'transparent', color: 'var(--accent-gold)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>volunteer_activism</span>
              إعفاء — تفعيل
            </button>
          </div>
        </div>
      )}

      {/* Student name header */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--accent-gold)' }}>account_circle</span>
            <div>
              <h2 style={{ color: 'var(--accent-gold)', fontSize: '1.25rem' }}>{student.fullName}</h2>
              <p style={{ fontSize: '0.8rem' }}>رقم القيد: #{student.studentCode || '—'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => navigate(`/students/${id}/edit`)} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
              تعديل
            </button>
            <button onClick={() => navigate('/students')} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
              العودة للقائمة
            </button>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
      }}>
        {infoFields.map((field, i) => (
          <div key={i} className="glass-card" style={{ padding: '1rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{field.label}</p>
            <p style={{
              fontWeight: 600,
              color: field.highlight || 'var(--text-primary)',
              direction: field.ltr ? 'ltr' : undefined,
              textAlign: field.ltr ? 'right' : undefined,
            }}>
              {field.value}
            </p>
          </div>
        ))}

        {/* Address fields - full width */}
        <div className="glass-card" style={{ padding: '1rem' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>العنوان</p>
          <p style={{ fontWeight: 600 }}>{student.address}</p>
        </div>
        {student.landmark && (
          <div className="glass-card" style={{ padding: '1rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>أقرب علامة مميزة</p>
            <p style={{ fontWeight: 600 }}>{student.landmark}</p>
          </div>
        )}
      </div>

      {/* Payment amount modal */}
      {paymentModal && (
        <div className="payment-overlay" onClick={() => setPaymentModal(false)}>
          <div className="payment-modal" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--success)', marginBottom: '0.5rem', display: 'block' }}>payments</span>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>المبلغ المدفوع</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>أدخل المبلغ الذي دفعه الطالب</p>
            </div>
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <input
                autoFocus
                type="number"
                step="0.01"
                min="0"
                placeholder="مثال: 500"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') confirmPayment(); }}
                className="premium-input"
                style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, padding: '1rem' }}
              />
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>ج.م</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setPaymentModal(false)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 600 }}>
                إلغاء
              </button>
              <button
                onClick={confirmPayment}
                style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--success)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 700 }}>
                تأكيد الدفع
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default StudentDetailScreen;
