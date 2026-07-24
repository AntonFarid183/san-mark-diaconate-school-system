import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';

const ChangePasswordScreen = () => {
  usePageTitle('تغيير كلمة المرور');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6)
      return setError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.');

    if (newPassword !== confirmPassword)
      return setError('كلمة المرور الجديدة غير متطابقة.');

    setIsLoading(true);
    try {
      await apiClient.post('/auth/change-password', {
        userName: user.userName,
        currentPassword,
        newPassword,
      });
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.Message;
      setError(msg || 'كلمة المرور الحالية غير صحيحة.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: '420px', margin: '3rem auto', textAlign: 'center' }} className="glass-card">
        <span className="material-symbols-outlined" style={{ fontSize: '56px', color: 'var(--success)', display: 'block', marginBottom: '1rem' }}>check_circle</span>
        <h2 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>تم التغيير بنجاح</h2>
        <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>كلمة مرورك الجديدة مفعّلة الآن.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ width: 'auto', padding: '0.6rem 2rem' }}>
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={{ maxWidth: '420px', margin: '0 auto' }}>
        <div className="glass-card">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--accent-gold)', display: 'block', marginBottom: '0.5rem' }}>lock_reset</span>
            <h2 style={{ color: 'var(--accent-gold)', fontSize: '1.1rem' }}>تغيير كلمة المرور</h2>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && <div className="error-box">{error}</div>}

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>كلمة المرور الحالية</label>
              <input type="password" className="premium-input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>كلمة المرور الجديدة</label>
              <input type="password" className="premium-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>6 أحرف أو أرقام على الأقل</p>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>تأكيد كلمة المرور</label>
              <input type="password" className="premium-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
            </button>

            <button type="button" onClick={() => navigate(-1)} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
              رجوع
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ChangePasswordScreen;
