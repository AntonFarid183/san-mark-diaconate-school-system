import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';

const ChangePasswordScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = location.state?.userName;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!userName) {
    navigate('/login');
    return null;
  }

  const passwordStrength = (pw) => {
    const checks = [];
    if (pw.length >= 8) checks.push(true);
    if (/[@#$%!^&*]/.test(pw)) checks.push(true);
    return checks;
  };

  const strength = passwordStrength(newPassword);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      return setError('كلمة المرور الجديدة غير متطابقة.');
    }

    setIsLoading(true);
    try {
      await apiClient.post('/auth/change-password', {
        userName,
        currentPassword,
        newPassword
      });
      alert('تم تغيير كلمة المرور بنجاح! يرجى تسجيل الدخول مجدداً.');
      navigate('/login');
    } catch (err) {
      if (err.response && err.response.data) {
        const errorMsg = err.response.data.message || err.response.data.Message;
        setError(errorMsg || 'كلمة المرور الحالية غير صحيحة.');
      } else {
        setError('حدث خطأ في الاتصال بالخادم. تأكد من أن الـ Backend يعمل.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-card" style={{ maxWidth: '450px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>lock_reset</span>
          <h2 style={{ color: 'var(--accent-gold)' }}>تغيير كلمة المرور</h2>
          <p style={{ fontSize: '0.85rem' }}>قم بتأمين حسابك في مدرسة سان مارك</p>
        </div>

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {error && <div className="error-box">{error}</div>}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>اسم المستخدم</label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: '20px', pointerEvents: 'none',
              }}>person</span>
              <input type="text" className="premium-input" value={userName} disabled style={{ paddingRight: '40px', opacity: 0.7 }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>كلمة المرور المؤقتة</label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: '20px', pointerEvents: 'none',
              }}>key</span>
              <input
                type={showCurrent ? 'text' : 'password'}
                className="premium-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{ paddingRight: '40px', paddingLeft: '40px' }}
              />
              <span
                className="material-symbols-outlined"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer',
                }}
              >{showCurrent ? 'visibility_off' : 'visibility'}</span>
            </div>
          </div>

          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(251, 191, 36, 0.05)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(251, 191, 36, 0.15)',
            fontSize: '0.85rem',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', verticalAlign: 'middle', marginLeft: '0.5rem', color: 'var(--accent-gold)' }}>update</span>
            تحديث الأمان
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>كلمة المرور الجديدة</label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: '20px', pointerEvents: 'none',
              }}>lock_open</span>
              <input
                type={showNew ? 'text' : 'password'}
                className="premium-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                style={{ paddingRight: '40px', paddingLeft: '40px' }}
              />
              <span
                className="material-symbols-outlined"
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer',
                }}
              >{showNew ? 'visibility_off' : 'visibility'}</span>
            </div>
            {newPassword && (
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: strength[0] ? 'var(--success)' : 'var(--text-muted)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{strength[0] ? 'check_circle' : 'circle'}</span>
                  على الأقل 8 أحرف
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: strength[1] ? 'var(--success)' : 'var(--text-muted)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{strength[1] ? 'check_circle' : 'circle'}</span>
                  يجب أن تحتوي على رمز خاص (@#$%)
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>تأكيد كلمة المرور الجديدة</label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: '20px', pointerEvents: 'none',
              }}>verified_user</span>
              <input
                type={showConfirm ? 'text' : 'password'}
                className="premium-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                style={{ paddingRight: '40px', paddingLeft: '40px' }}
              />
              <span
                className="material-symbols-outlined"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer',
                }}
              >{showConfirm ? 'visibility_off' : 'visibility'}</span>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            onClick={() => navigate('/login')}
            className="btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
            العودة إلى صفحة الدخول
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordScreen;
