import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';

const EditStudentScreen = () => {
  usePageTitle('تعديل بيانات الطالب');
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [form, setForm] = useState({
    firstName: '', middleName: '', thirdName: '', lastName: '',
    phone: '', studentMobile: '', whatsAppNumber: '', motherMobile: '',
    email: '', address: '',
  });
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const r = await apiClient.get(`/students/${id}`);
        setStudent(r.data);
        const s = r.data;
        setForm({
          firstName: s.firstName || '',
          middleName: s.middleName || '',
          thirdName: s.thirdName || '',
          lastName: s.lastName || '',
          phone: s.phone || '',
          studentMobile: s.studentMobile || '',
          whatsAppNumber: s.whatsAppNumber || '',
          motherMobile: s.motherMobile || '',
          email: s.email || '',
          address: s.address || '',
        });
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/students/${id}`, form);
      setMsg({ type: 'success', text: 'تم حفظ التعديلات.' });
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل الحفظ.' });
    } finally { setSaving(false); }
  };

  const resetPassword = async () => {
    if (newPassword.length < 8) { setMsg({ type: 'error', text: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' }); return; }
    try {
      await apiClient.post(`/students/${id}/reset-password`, { newPassword });
      setMsg({ type: 'success', text: 'تم إعادة تعيين كلمة المرور.' });
      setShowReset(false);
      setNewPassword('');
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل إعادة التعيين.' });
    }
  };

  const toggleActive = async () => {
    const endpoint = student.isActive ? 'deactivate' : 'activate';
    try {
      await apiClient.post(`/students/${id}/${endpoint}`);
      setStudent({ ...student, isActive: !student.isActive });
      setMsg({ type: 'success', text: student.isActive ? 'تم إيقاف الحساب.' : 'تم تفعيل الحساب.' });
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل العملية.' });
    }
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>;

  const field = (label, key, type = 'text') => (
    <div>
      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>{label}</label>
      <input className="input-field" type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  return (
    <>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="btn-secondary" style={{ width: 'auto', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={() => navigate(`/students/${id}`)}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          رجوع
        </button>
      </div>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 'var(--radius-sm)', background: msg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
          {msg.text}
          <span style={{ cursor: 'pointer' }} onClick={() => setMsg(null)}>✕</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>البيانات الشخصية</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {field('الاسم الأول', 'firstName')}
            {field('اسم الأب', 'middleName')}
            {field('الاسم الثالث', 'thirdName')}
            {field('الاسم الأخير', 'lastName')}
          </div>
          <h3 style={{ color: 'var(--accent-gold)', margin: '1.5rem 0 1rem' }}>معلومات التواصل</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {field('هاتف الطالب', 'studentMobile')}
            {field('هاتف الأسرة', 'phone')}
            {field('واتساب', 'whatsAppNumber')}
            {field('هاتف الأم', 'motherMobile')}
            {field('البريد الإلكتروني', 'email', 'email')}
            {field('العنوان', 'address')}
          </div>
          <button className="btn-primary" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            onClick={save} disabled={saving}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>save</span>
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>

        {/* Admin Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>إجراءات الحساب</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={() => setShowReset(true)} style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)', borderRadius: '8px', padding: '0.6rem 1rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock_reset</span>
                إعادة تعيين كلمة المرور
              </button>
              <button onClick={() => navigate(`/students/${id}/promote`)} style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid #60a5fa', color: '#60a5fa', borderRadius: '8px', padding: '0.6rem 1rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upgrade</span>
                ترقية الطالب
              </button>
              {student && (
                <button onClick={toggleActive} style={{ background: student.isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${student.isActive ? 'var(--danger)' : 'var(--success)'}`, color: student.isActive ? 'var(--danger)' : 'var(--success)', borderRadius: '8px', padding: '0.6rem 1rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{student.isActive ? 'block' : 'check_circle'}</span>
                  {student.isActive ? 'إيقاف الحساب' : 'تفعيل الحساب'}
                </button>
              )}
            </div>
          </div>

          {student && (
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>كود الطالب</div>
              <div style={{ fontWeight: 600, direction: 'ltr', marginTop: '0.25rem' }}>{student.studentCode}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>الحالة</div>
              <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', background: student.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: student.isActive ? 'var(--success)' : 'var(--danger)' }}>
                {student.isActive ? 'فعّال' : 'موقوف'}
              </span>
            </div>
          )}
        </div>
      </div>

      {showReset && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-card" style={{ padding: '2rem', width: '400px', direction: 'rtl' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>إعادة تعيين كلمة المرور</h3>
            <input className="input-field" type="password" placeholder="كلمة المرور الجديدة (8 أحرف على الأقل)" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={resetPassword} disabled={newPassword.length < 8}>تعيين</button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowReset(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditStudentScreen;
