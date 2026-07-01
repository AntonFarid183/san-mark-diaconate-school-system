import { useState, useEffect } from 'react';
import apiClient from '../apiClient';
import Layout from '../Layout';

const StudentCheckInScreen = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pins, setPins] = useState({});
  const [msg, setMsg] = useState(null);
  const [submitting, setSubmitting] = useState(null);

  useEffect(() => { fetchOpenSessions(); }, []);

  const fetchOpenSessions = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get('/attendance/sessions/open-for-me');
      setSessions(r.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const checkIn = async (sessionId) => {
    const pin = pins[sessionId];
    if (!pin) return;
    setSubmitting(sessionId);
    try {
      const r = await apiClient.post(`/attendance/sessions/${sessionId}/checkin-pin`, { pin });
      setMsg({ type: 'success', text: `تم تسجيل حضورك: ${r.data.status === 1 ? 'متأخر' : 'حاضر'}` });
      fetchOpenSessions();
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل تسجيل الحضور.' });
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <Layout title="تسجيل الحضور">
      {msg && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)', background: msg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
          {msg.text}
          <span style={{ cursor: 'pointer' }} onClick={() => setMsg(null)}>✕</span>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>
      ) : sessions.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>event_available</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>لا توجد جلسات مفتوحة لتسجيل الحضور حالياً</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sessions.map(s => (
            <div key={s.id} className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ color: 'var(--accent-gold)', fontSize: '1rem', marginBottom: '0.4rem' }}>{s.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                {new Date(s.startsAt).toLocaleString('ar-EG')}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  className="premium-input"
                  placeholder="أدخل رمز الدخول"
                  value={pins[s.id] || ''}
                  onChange={e => setPins({ ...pins, [s.id]: e.target.value })}
                  style={{ flex: 1, textAlign: 'center', letterSpacing: '0.2rem', fontSize: '1.1rem' }}
                  maxLength={6}
                />
                <button
                  className="btn-primary"
                  style={{ width: 'auto', padding: '0.6rem 1.5rem' }}
                  disabled={!pins[s.id] || submitting === s.id}
                  onClick={() => checkIn(s.id)}
                >
                  تسجيل الحضور
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default StudentCheckInScreen;
