import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../apiClient';

const LoginScreen = () => {
  const navigate = useNavigate();
  const { login, fetchCurrentUser } = useAuth();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { userName, password });
      login(response.data.token);
      await fetchCurrentUser();
      navigate('/dashboard');
    } catch (err) {
      if (err.response && err.response.data) {
        const errorMsg = err.response.data.message || err.response.data.Message;
        if (errorMsg === 'ACCOUNT_PENDING') {
          setError('ACCOUNT_PENDING');
        } else {
          setError(errorMsg || 'بيانات الدخول غير صحيحة.');
        }
      } else {
        setError('حدث خطأ في الاتصال بالخادم. تأكد من أن الـ Backend يعمل.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="glass-card" style={{ maxWidth: '420px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '56px', color: 'var(--accent-gold)', marginBottom: '1rem' }}>church</span>
          <h1 style={{ color: 'var(--accent-gold)', fontSize: '1.25rem', lineHeight: 1.4 }}>مدرسة بي ثيؤريموس للألحان والتسبحة</h1>
          <p style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>كنيسة مارمرقس النزهة 2</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {error && error === 'ACCOUNT_PENDING' ? (
            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 'var(--radius-sm)', padding: '1rem', lineHeight: 1.7 }}>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--accent-gold)', fontSize: '22px', flexShrink: 0, marginTop: '2px' }}>info</span>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '0.4rem', fontSize: '0.95rem' }}>الحساب قيد المراجعة</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    برجاء التوجه إلى سكرتارية المدرسة لتأكيد سداد مصاريف الالتحاق، أو إبلاغ الإدارة بوضعكم المادي لاتخاذ الإجراء المناسب.
                    <br /><br />
                    للتواصل مع إدارة المدرسة يُرجى الحضور شخصياً أو التواصل عبر المسؤولين في الكنيسة.
                  </div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="error-box">{error}</div>
          ) : null}

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              اسم المستخدم
            </label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: '20px', pointerEvents: 'none',
              }}>person</span>
              <input
                type="text"
                className="premium-input"
                placeholder="مثال: ST-1001"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                style={{ paddingRight: '40px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
              كلمة المرور
            </label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: '20px', pointerEvents: 'none',
              }}>lock</span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="premium-input"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '40px', paddingLeft: '40px' }}
              />
              <span
                className="material-symbols-outlined"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer',
                }}
              >{showPassword ? 'visibility_off' : 'visibility'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" style={{ accentColor: 'var(--accent-gold)' }} />
              تذكرني
            </label>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'default' }}>نسيت كلمة المرور؟</span>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
          <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>ليس لديك حساب؟</p>
          <button onClick={() => navigate('/self-register')} className="btn-secondary" style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
            تسجيل عضو جديد
          </button>
        </div>

        {/* Footer icons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1.5rem', opacity: 0.4 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>auto_stories</span>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>school</span>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>history_edu</span>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
