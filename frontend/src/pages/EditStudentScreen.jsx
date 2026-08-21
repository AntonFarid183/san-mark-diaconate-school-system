import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import { toAbsoluteBackendUrl } from '../config';
import { usePageTitle } from '../context/PageTitleContext';
import PhotoCaptureField from '../components/PhotoCaptureField';

// Only the fields UpdateStudentDto actually accepts. Anything else typed here would be
// silently dropped by the API, so the form deliberately doesn't offer it — email in
// particular lives on the User and has no update path yet.
const PERSONAL_FIELDS = [
  ['الاسم الأول', 'firstName'],
  ['اسم الأب', 'secondName'],
  ['الاسم الثالث', 'thirdName'],
  ['الاسم الأخير', 'lastName'],
];

const CONTACT_FIELDS = [
  ['موبايل الطالب', 'studentMobile'],
  ['موبايل الأب', 'fatherMobile'],
  ['موبايل الأم', 'motherMobile'],
  ['واتساب', 'whatsAppNumber'],
  ['تليفون أرضي', 'landline'],
  ['العنوان', 'address'],
];

const EDITABLE_KEYS = [...PERSONAL_FIELDS, ...CONTACT_FIELDS].map(([, key]) => key);

// The four name parts build FullName everywhere else in the app, and the API only skips a
// field when it is null — an empty string is a real value and overwrites the stored name.
// Without this the admin can blank a student out of every roster and search result.
const REQUIRED_FIELDS = PERSONAL_FIELDS;

const emptyForm = () => Object.fromEntries(EDITABLE_KEYS.map(key => [key, '']));

const resetPasswordButtonStyle = {
  background: 'rgba(251,191,36,0.1)',
  border: '1px solid var(--accent-gold)',
  color: 'var(--accent-gold)',
  borderRadius: '8px',
  padding: '0.6rem 1rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
};

const EditStudentScreen = () => {
  usePageTitle('تعديل بيانات الطالب');
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const loadStudent = async () => {
      try {
        const { data } = await apiClient.get(`/students/${id}`);
        setStudent(data);
        setPhotoUrl(data.profilePictureUrl || null);
        setForm(Object.fromEntries(EDITABLE_KEYS.map(key => [key, data[key] || ''])));
      } catch (e) {
        setMsg({ type: 'error', text: e.response?.data?.message || 'تعذر تحميل بيانات الطالب.' });
      } finally {
        setLoading(false);
      }
    };
    loadStudent();
  }, [id]);

  const save = async () => {
    const missing = REQUIRED_FIELDS.filter(([, key]) => !form[key].trim());
    if (missing.length > 0) {
      setMsg({ type: 'error', text: `يجب إدخال: ${missing.map(([label]) => label).join('، ')}` });
      return;
    }

    setSaving(true);
    try {
      const trimmed = Object.fromEntries(EDITABLE_KEYS.map(key => [key, form[key].trim()]));
      await apiClient.put(`/students/${id}`, trimmed);
      setMsg({ type: 'success', text: 'تم حفظ التعديلات.' });
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل الحفظ.' });
    } finally { setSaving(false); }
  };

  // Same authenticated upload endpoint the other photo screens use; PhotoCaptureField owns
  // the camera and crop steps and hands back the cropped Blob.
  const uploadPhoto = async (blob) => {
    const body = new FormData();
    body.append('file', blob, 'profile.jpg');
    const res = await apiClient.post('/file/upload?category=profiles', body, { headers: { 'Content-Type': undefined } });
    return res.data.url || res.data.Url;
  };

  // Persisted on its own rather than waiting for the save button: the admin already confirmed
  // the crop, so the picture is a finished action. UpdateStudentDto ignores null fields, so
  // sending only this one leaves every other field untouched.
  // Handles its own errors rather than throwing: PhotoCaptureField calls onUploaded without
  // awaiting it, so a rejection here would escape its try/catch as an unhandled rejection.
  const persistPhoto = async (url) => {
    try {
      await apiClient.put(`/students/${id}`, { profilePictureUrl: url });
      setPhotoUrl(url);
      setMsg({ type: 'success', text: 'تم تحديث الصورة الشخصية.' });
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'تم رفع الصورة لكن فشل حفظها على الطالب.' });
    }
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

  if (loading) return <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>;

  const renderField = ([label, key]) => (
    <div key={key}>
      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>{label}</label>
      <input className="premium-input" type="text" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
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
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 'var(--radius-sm)', background: msg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          {msg.text}
          <span style={{ cursor: 'pointer' }} onClick={() => setMsg(null)}>✕</span>
        </div>
      )}

      <div className="edit-student-layout">
        <div className="glass-card" style={{ padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
            <PhotoCaptureField photoUrl={toAbsoluteBackendUrl(photoUrl)} uploadFn={uploadPhoto} onUploaded={persistPhoto} size={96} />
            <div style={{ flex: '1 1 200px' }}>
              <h3 style={{ color: 'var(--accent-gold)' }}>الصورة الشخصية</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                اضغط على أيقونة الكاميرا لالتقاط صورة أو اختيارها من الجهاز — تُحفظ فور تأكيد القص.
              </p>
            </div>
          </div>

          <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>البيانات الشخصية</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {PERSONAL_FIELDS.map(renderField)}
          </div>

          <h3 style={{ color: 'var(--accent-gold)', margin: '1.5rem 0 1rem' }}>معلومات التواصل</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {CONTACT_FIELDS.map(renderField)}
          </div>

          <button className="btn-primary" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            onClick={save} disabled={saving}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>save</span>
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>إجراءات الحساب</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={() => setShowReset(true)} style={resetPasswordButtonStyle}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock_reset</span>
                إعادة تعيين كلمة المرور
              </button>
            </div>
          </div>

          {student && (
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>كود الطالب</div>
              <div style={{ fontWeight: 600, direction: 'ltr', textAlign: 'right', marginTop: '0.25rem' }}>{student.studentCode}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>الحالة</div>
              <span style={{ display: 'inline-block', marginTop: '0.25rem', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', background: student.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: student.isActive ? 'var(--success)' : 'var(--danger)' }}>
                {student.isActive ? 'فعّال' : 'موقوف'}
              </span>
            </div>
          )}
        </div>
      </div>

      {showReset && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '400px', direction: 'rtl' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>إعادة تعيين كلمة المرور</h3>
            <input className="premium-input" type="password" placeholder="كلمة المرور الجديدة (8 أحرف على الأقل)" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
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
