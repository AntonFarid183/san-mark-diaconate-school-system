import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';

import { BACKEND_URL as BACKEND } from '../config';
const toAbsUrl = (url) => (!url ? null : url.startsWith('http') ? url : `${BACKEND}${url}`);

const getCroppedBlob = (imageSrc, croppedAreaPixels) =>
  new Promise((resolve) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 400;
      canvas.getContext('2d').drawImage(
        image,
        croppedAreaPixels.x, croppedAreaPixels.y,
        croppedAreaPixels.width, croppedAreaPixels.height,
        0, 0, 400, 400
      );
      canvas.toBlob(resolve, 'image/jpeg', 0.92);
    };
  });

// ── Crop Modal ────────────────────────────────────────────────────────────────
const CropModal = ({ imageSrc, onConfirm, onCancel, uploading }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const onCropComplete = useCallback((_, pixels) => setCroppedAreaPixels(pixels), []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <h3 style={{ color: 'var(--accent-gold)', textAlign: 'center', marginBottom: '1rem' }}>اضبط الصورة</h3>
        <div style={{ position: 'relative', width: '100%', height: '340px', borderRadius: '12px', overflow: 'hidden', background: '#111' }}>
          <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false}
            onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
        </div>
        <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', fontSize: '18px' }}>zoom_out</span>
          <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={e => setZoom(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--accent-gold)' }} />
          <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', fontSize: '18px' }}>zoom_in</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1rem' }}>اسحب لتحريك الصورة — استخدم الشريط للتكبير</p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={onCancel} style={{ flex: 1 }} disabled={uploading}>إلغاء</button>
          <button className="btn-primary" style={{ flex: 1 }} disabled={uploading} onClick={() => onConfirm(croppedAreaPixels)}>
            {uploading ? 'جاري الرفع...' : 'تأكيد'}
          </button>
        </div>
      </div>
    </div>
  );
};

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
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.7rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent-gold)', flexShrink: 0 }}>{icon}</span>
    <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', minWidth: '110px', opacity: 0.75 }}>{label}</span>
    <span style={{ fontSize: '0.88rem', fontWeight: 600, marginRight: 'auto' }}>{value || '—'}</span>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const StudentProfileScreen = () => {
  usePageTitle('الملف الشخصي');
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [rawImageSrc, setRawImageSrc] = useState(null);

  useEffect(() => {
    apiClient.get('/students/me').then(r => setProfile(r.data)).finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = () => setRawImageSrc(reader.result);
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async (croppedAreaPixels) => {
    setUploadError(null);
    setUploading(true);
    try {
      const blob = await getCroppedBlob(rawImageSrc, croppedAreaPixels);
      const form = new FormData();
      form.append('file', blob, 'profile.jpg');
      const uploadRes = await apiClient.post('/file/upload?category=profiles', form, { headers: { 'Content-Type': undefined } });
      const url = uploadRes.data.url || uploadRes.data.Url;
      const updated = await apiClient.patch('/students/me/picture', { url });
      setProfile(updated.data);
      setRawImageSrc(null);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.Message || err.message;
      setUploadError(`فشل رفع الصورة: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>;

  const hasPhoto = !!profile?.profilePictureUrl;
  const photoUrl = toAbsUrl(profile?.profilePictureUrl);
  const fullName = [profile?.firstName, profile?.secondName, profile?.thirdName, profile?.lastName].filter(Boolean).join(' ');
  const feesPaid = profile?.feesPaid;
  const isActive = profile?.status === 'Active';

  return (
    <>
      {rawImageSrc && <CropModal imageSrc={rawImageSrc} uploading={uploading} onConfirm={handleCropConfirm} onCancel={() => setRawImageSrc(null)} />}

      <div style={{ maxWidth: '580px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Hero Card ── */}
        <div style={{
          borderRadius: 'var(--radius-md)', overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(30,41,59,0.97) 0%, rgba(15,23,42,0.97) 100%)',
          border: '1px solid rgba(251,191,36,0.35)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.7)',
          backdropFilter: 'blur(20px)',
        }}>
          {/* Decorative top strip */}
          <div style={{ height: '6px', background: 'linear-gradient(90deg, var(--accent-gold), rgba(251,191,36,0.3), transparent)' }} />

          <div style={{ padding: '2rem 1.5rem 1.5rem', textAlign: 'center' }}>
            {/* Photo */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
              {hasPhoto ? (
                <img src={photoUrl} alt="" style={{ width: '110px', height: '110px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-gold)', boxShadow: '0 0 24px rgba(251,191,36,0.35)' }} />
              ) : (
                <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '3px dashed rgba(251,191,36,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '54px', color: 'rgba(251,191,36,0.4)' }}>account_circle</span>
                </div>
              )}

              {/* Camera button overlay */}
              <button
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
                style={{ position: 'absolute', bottom: '2px', left: '2px', width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-gold)', border: '2px solid var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#000' }}>photo_camera</span>
              </button>

              {/* Red dot if no photo */}
              {!hasPhoto && (
                <span style={{ position: 'absolute', top: '4px', right: '4px', width: '16px', height: '16px', background: 'var(--danger)', borderRadius: '50%', border: '2px solid var(--bg-primary)', animation: 'pulse 2s infinite' }} />
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

            {!hasPhoto && (
              <div style={{ fontSize: '0.78rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                يجب رفع صورة شخصية
              </div>
            )}

            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>{fullName}</h2>

            {/* Student code badge */}
            {profile?.studentCode && (
              <span style={{ display: 'inline-block', fontSize: '0.75rem', padding: '0.2rem 0.75rem', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '20px', color: 'var(--accent-gold)', fontWeight: 700, direction: 'ltr', marginBottom: '1.25rem' }}>
                {profile.studentCode}
              </span>
            )}

            {uploadError && <div className="error-box" style={{ margin: '0.75rem 0' }}>{uploadError}</div>}

            {/* Stat pills */}
            <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>
              <StatPill icon="school" label="السنة الدراسية" value={profile?.gradeName} />
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />
              <StatPill icon="check_circle" label="الحالة" value={isActive ? 'نشط' : 'موقوف'} color={isActive ? '#4ade80' : '#f87171'} />
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />
              <StatPill icon="payments" label="الاشتراك" value={feesPaid ? 'مسدد' : 'غير مسدد'} color={feesPaid ? '#4ade80' : '#fb923c'} />
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
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', width: '100%', padding: '0.8rem 1.5rem', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.7)', color: '#f87171', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.38)'; e.currentTarget.style.borderColor = '#ef4444'; }}
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </>
  );
};

export default StudentProfileScreen;
