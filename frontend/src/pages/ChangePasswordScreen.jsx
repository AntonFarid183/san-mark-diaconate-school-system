import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';

const ChangePasswordScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Safety check: Grab the stealthy userName passed from the LoginScreen.
    const userName = location.state?.userName;

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // If navigated incorrectly, kick to login immediately.
    // Placed after Hooks to follow React rules.
    if (!userName) {
        navigate('/login');
        return null;
    }

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
        <div className="glass-card" style={{ maxWidth: '400px', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ color: 'var(--accent-gold)' }}>تغيير كلمة المرور</h2>
                <p>مرحباً <strong>{userName}</strong>، يجب تغيير كلمة المرور المؤقتة</p>
            </div>

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {error && <div style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid var(--danger)' }}>{error}</div>}
                
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>كلمة المرور المؤقتة</label>
                    <input 
                        type="password" 
                        className="premium-input" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>كلمة المرور الجديدة</label>
                    <input 
                        type="password" 
                        className="premium-input" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>تأكيد كلمة المرور الجديدة</label>
                    <input 
                        type="password" 
                        className="premium-input" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                </div>

                <button type="submit" className="btn-primary" disabled={isLoading}>
                    {isLoading ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
                </button>
            </form>
        </div>
    );
};

export default ChangePasswordScreen;
