import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';

const stageLabel = (s) => s || '—';

export default function PendingApprovalsScreen() {
  usePageTitle('طلبات التسجيل الذاتي');
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/students/pending');
      setStudents(res.data);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // withFees=true charges the current academic year's term fee automatically —
  // no amount to type, it's just whatever the year's subscription fee already is.
  const activate = async (id, withFees) => {
    setActivating(id);
    try {
      await apiClient.post(`/students/${id}/activate`, { withFees });
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch {
      alert('حدث خطأ أثناء تفعيل الحساب، حاول مرة أخرى.');
    } finally {
      setActivating(null);
    }
  };

  return (
    <>
      <p style={{ marginBottom: '1.5rem', fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
        الأعضاء الذين سجّلوا أنفسهم عبر نموذج التسجيل — في انتظار موافقة الإدارة على قبولهم وتفعيل حساباتهم.
      </p>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>جاري التحميل...</p>
      ) : students.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '56px', color: 'var(--success)', marginBottom: '1rem', display: 'block' }}>check_circle</span>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>لا توجد طلبات معلّقة</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>جميع الطلبات تمت مراجعتها</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {students.map(s => (
            <div key={s.id} className="glass-card" style={{ padding: '1.25rem', border: '1px solid rgba(251,191,36,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>

                {/* Avatar */}
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(251,191,36,0.12)', border: '2px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '26px', color: 'var(--accent-gold)' }}>person</span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                    {s.fullName}
                    <span style={{ marginRight: '0.6rem', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '20px', background: 'rgba(251,191,36,0.12)', color: 'var(--accent-gold)', fontWeight: 600 }}>
                      {s.studentCode}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <span><span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginLeft: '3px' }}>school</span>{stageLabel(s.stageName)} — {s.gradeName}</span>
                    <span><span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginLeft: '3px' }}>phone</span>{s.fatherMobile}</span>
                    <span><span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginLeft: '3px' }}>church</span>{s.fatherOfConfession}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginLeft: '3px' }}>calendar_today</span>
                      {new Date(s.registeredDate).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginLeft: '3px' }}>location_on</span>{s.address}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => navigate(`/students/${s.id}`)}
                    style={{ padding: '0.45rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                    الملف الكامل
                  </button>
                  <button
                    disabled={activating === s.id}
                    onClick={() => activate(s.id, true)}
                    style={{ padding: '0.45rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', background: activating === s.id ? 'rgba(16,185,129,0.4)' : 'var(--success)', color: '#fff', cursor: activating === s.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      {activating === s.id ? 'hourglass_empty' : 'payments'}
                    </span>
                    {activating === s.id ? 'جاري التفعيل...' : 'تم السداد — تفعيل'}
                  </button>
                  <button
                    disabled={activating === s.id}
                    onClick={() => activate(s.id, false)}
                    style={{ padding: '0.45rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(251,191,36,0.5)', background: 'rgba(251,191,36,0.08)', color: 'var(--accent-gold)', cursor: activating === s.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>volunteer_activism</span>
                    إعفاء — تفعيل
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </>
  );
}
