import { useState, useEffect } from 'react';
import apiClient from '../apiClient';
import Layout from '../Layout';

const StudentCheckInScreen = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pins, setPins] = useState({});
  const [msg, setMsg] = useState(null);
  const [submitting, setSubmitting] = useState(null);
  const [checkedIn, setCheckedIn] = useState({});

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
    if (!pin || pin.length !== 6) return;
    setSubmitting(sessionId);
    try {
      await apiClient.post(`/attendance/sessions/${sessionId}/checkin-pin`, { pin });
      setCheckedIn(prev => ({ ...prev, [sessionId]: true }));
      setMsg({ type: 'success', text: 'تم تسجيل حضورك بنجاح ✓' });
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ color: 'var(--accent-gold)', fontSize: '1rem', marginBottom: '0.25rem' }}>{s.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(s.startsAt).toLocaleDateString('ar-EG')} — {s.gradeName}
                  </p>
                </div>
                {checkedIn[s.id] && (
                  <span style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                    ✓ تم التسجيل
                  </span>
                )}
              </div>
              {!checkedIn[s.id] && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    className="premium-input"
                    placeholder="أدخل رمز الدخول"
                    value={pins[s.id] || ''}
                    onChange={e => setPins({ ...pins, [s.id]: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    onKeyDown={e => e.key === 'Enter' && checkIn(s.id)}
                    style={{ flex: 1, textAlign: 'center', letterSpacing: '0.3rem', fontSize: '1.2rem' }}
                    maxLength={6}
                    inputMode="numeric"
                  />
                  <button
                    className="btn-primary"
                    style={{ width: 'auto', padding: '0.6rem 1.5rem' }}
                    disabled={!pins[s.id] || pins[s.id].length !== 6 || submitting === s.id}
                    onClick={() => checkIn(s.id)}
                  >
                    {submitting === s.id ? '...' : 'تسجيل'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default StudentCheckInScreen;
