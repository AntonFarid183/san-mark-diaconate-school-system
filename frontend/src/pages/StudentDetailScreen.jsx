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

  if (!student) return null;

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
    { label: 'تاريخ التسجيل', value: new Date(student.registeredDate).toLocaleDateString('ar-EG') },
  ];

  return (
    <Layout title="ملف الطالب">
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
          <button onClick={() => navigate('/students')} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
            العودة للقائمة
          </button>
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
    </Layout>
  );
};

export default StudentDetailScreen;
