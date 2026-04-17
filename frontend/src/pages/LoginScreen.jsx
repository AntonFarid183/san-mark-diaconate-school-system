import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';

const LoginScreen = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Trigger the C# Backend /api/auth/login endpoint
            const response = await apiClient.post('/auth/login', { userName, password });

            // If success (HTTP 200), globally save the JWT token
            localStorage.setItem('token', response.data.token);
            alert('تم تسجيل الدخول بنجاح!'); // Will be replaced by dashboard redirect later
            
        } catch (err) {
            // Did the server respond?
            if (err.response && err.response.data) {
                const { requiresPasswordChange, message, RequiresPasswordChange, Message } = err.response.data;
                const isPasswordChangeRequired = requiresPasswordChange || RequiresPasswordChange;
                const errorMsg = message || Message;

                // Enforcing Business Rule #4:
                if (isPasswordChangeRequired) {
                    // Automatically route them, and silently pass their username via memory!
                    navigate('/change-password', { state: { userName } });
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
        <div className="glass-card" style={{ maxWidth: '400px', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ color: 'var(--accent-gold)' }}>نظام مدرسة الشمامسة</h1>
                <p>تسجيل الدخول للنظام</p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {error && <div style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid var(--danger)' }}>{error}</div>}
                
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>اسم المستخدم</label>
                    <input 
                        type="text" 
                        className="premium-input" 
                        placeholder="مثال: ST-1001"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>كلمة المرور</label>
                    <input 
                        type="password" 
                        className="premium-input" 
                        placeholder="أدخل كلمة المرور"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="btn-primary" disabled={isLoading}>
                    {isLoading ? 'جاري التحقق...' : 'دخول'}
                </button>
            </form>
        </div>
    );
};

export default LoginScreen;
