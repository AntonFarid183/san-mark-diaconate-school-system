import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';
import PhotoCaptureField from '../components/PhotoCaptureField';

import { BACKEND_URL as BACKEND } from '../config';
const toAbsUrl = (url) => (!url ? null : url.startsWith('http') ? url : `${BACKEND}${url}`);

// ── Stat Pill ─────────────────────────────────────────────────────────────────
const StatPill = ({ icon, label, value, color = 'var(--accent-gold)' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', flex: 1 }}>
    <span className="material-symbols-outlined" style={{ fontSize: '22px', color }}>{icon}</span>
    <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', opacity: 0.75 }}>{label}</span>
    <span style={{ fontSize: '0.85rem', fontWeight: 700, color }}>{value}</span>
  </div>
);

// ── Info Row ──────────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.7rem 0', borderBottom: '1px solid var(--surface-3)' }}>
    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent-gold)', flexShrink: 0 }}>{icon}</span>
    <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', minWidth: '110px', opacity: 0.75 }}>{label}</span>
    <span style={{ fontSize: '0.88rem', fontWeight: 600, marginRight: 'auto' }}>{value || '—'}</span>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const StudentProfileScreen = () => {
  usePageTitle('الملف الشخصي');
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [balance, setBalance] = useState(null); // { remainingBalance, hasBalance } -- never the total fee or a discount, see /students/me/balance
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/students/me').then(r => setProfile(r.data)).finally(() => setLoading(false));
    apiClient.get('/students/me/balance').then(r => setBalance(r.data)).catch(() => {});
  }, []);

  // The cropped Blob is handed to us by PhotoCaptureField — we just own where
  // it gets uploaded to (the authenticated "it's my own profile" endpoint)
  // and what happens with the resulting URL.
  const uploadOwnPhoto = async (blob) => {
    const form = new FormData();
    form.append('file', blob, 'profile.jpg');
    const uploadRes = await apiClient.post('/file/upload?category=profiles', form, { headers: { 'Content-Type': undefined } });
    return uploadRes.data.url || uploadRes.data.Url;
  };

  const handlePhotoUploaded = async (url) => {
    const updated = await apiClient.patch('/students/me/picture', { url });
    setProfile(updated.data);
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>;

  const photoUrl = toAbsUrl(profile?.profilePictureUrl);
  const fullName = [profile?.firstName, profile?.secondName, profile?.thirdName, profile?.lastName].filter(Boolean).join(' ');
  const isActive = profile?.status === 'Active';

  // What the student is allowed to know: nothing when no fee is configured,
  // "مسدد" when settled, or the amount still owed -- never the total, never
  // whether any of it was a discount or exemption.
  const balanceLabel = !balance?.hasBalance ? null : balance.remainingBalance > 0
    ? `${Number(balance.remainingBalance).toLocaleString('ar-EG')} ج.م`
    : 'مسدد';
  const balanceColor = !balance?.hasBalance ? 'var(--accent-gold)'
    : balance.remainingBalance > 0 ? 'var(--c-orange)' : 'var(--c-green)';

  return (
    <>
      <div style={{ maxWidth: '580px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Hero Card ── */}
        <div style={{
          borderRadius: 'var(--radius-md)', overflow: 'hidden',
          background: 'var(--panel-gradient)',
          border: '1px solid var(--gold-tint-strong)',
          boxShadow: '0 12px 48px var(--overlay)',
          backdropFilter: 'blur(20px)',
        }}>
          {/* Decorative top strip */}
          <div style={{ height: '6px', background: 'linear-gradient(90deg, var(--accent-gold-fill), var(--gold-tint-strong), transparent)' }} />

          <div style={{ padding: '2rem 1.5rem 1.5rem', textAlign: 'center' }}>
            {/* Photo */}
            <div style={{ marginBottom: '1rem' }}>
              <PhotoCaptureField photoUrl={photoUrl} required uploadFn={uploadOwnPhoto} onUploaded={handlePhotoUploaded} />
            </div>

            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>{fullName}</h2>

            {/* Student code badge */}
            {profile?.studentCode && (
              <span style={{ display: 'inline-block', fontSize: '0.75rem', padding: '0.2rem 0.75rem', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '20px', color: 'var(--accent-gold)', fontWeight: 700, direction: 'ltr', marginBottom: '1.25rem' }}>
                {profile.studentCode}
              </span>
            )}

            {/* Stat pills */}
            <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem', background: 'var(--surface-1)', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>
              <StatPill icon="school" label="السنة الدراسية" value={profile?.gradeName} />
              <div style={{ width: '1px', background: 'var(--surface-3)' }} />
              <StatPill icon="check_circle" label="الحالة" value={isActive ? 'نشط' : 'موقوف'} color={isActive ? 'var(--c-green)' : 'var(--c-red)'} />
              {balanceLabel && (
                <>
                  <div style={{ width: '1px', background: 'var(--surface-3)' }} />
                  <StatPill icon="payments" label="المستحق" value={balanceLabel} color={balanceColor} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Info Card ── */}
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent-gold)' }}>badge</span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-gold)' }}>البيانات الشخصية</span>
          </div>
          <InfoRow icon="person" label="اسم المستخدم" value={profile?.userName} />
          <InfoRow icon="layers" label="المرحلة" value={profile?.stageName} />
          <InfoRow icon="event" label="تاريخ التسجيل" value={profile?.registeredDate ? new Date(profile.registeredDate).toLocaleDateString('ar-EG') : null} />
          <InfoRow icon="church" label="أب الاعتراف" value={profile?.fatherOfConfession} />
        </div>

        {/* ── Contact Card ── */}
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent-gold)' }}>contact_phone</span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-gold)' }}>بيانات التواصل</span>
          </div>
          <InfoRow icon="smartphone" label="موبايل الطالب" value={profile?.studentMobile} />
          <InfoRow icon="man" label="موبايل الأب" value={profile?.fatherMobile} />
          <InfoRow icon="woman" label="موبايل الأم" value={profile?.motherMobile} />
        </div>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Change password — danger style */}
          <button
            onClick={() => navigate('/change-password')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', width: '100%', padding: '0.8rem 1.5rem', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.7)', color: 'var(--c-red)', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.38)'; e.currentTarget.style.borderColor = 'var(--danger)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.7)'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>lock_reset</span>
            تغيير كلمة المرور
          </button>

          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => navigate('/dashboard')}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
            العودة للرئيسية
          </button>
        </div>

      </div>
    </>
  );
};

export default StudentProfileScreen;
