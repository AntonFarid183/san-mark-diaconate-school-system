import { useState, useRef, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';

// Crops to a fixed 400x400 square, matching the circular avatar everywhere
// it's shown — the crop step is mandatory (not skippable) so a shot straight
// from the camera or an arbitrary phone photo always ends up framed the same.
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

// ── Step 1: choose a source ─────────────────────────────────────────────────
const SourceModal = ({ onPickFile, onPickCamera, onCancel }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--overlay-media)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
    <div className="glass-card" style={{ width: '100%', maxWidth: '340px', padding: '1.75rem', direction: 'rtl' }}>
      <h3 style={{ color: 'var(--accent-gold)', textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.05rem' }}>إضافة صورة شخصية</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={onPickCamera}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>photo_camera</span>
          تشغيل الكاميرا
        </button>
        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={onPickFile}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>upload_file</span>
          اختيار من الجهاز
        </button>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', padding: '0.5rem' }}>إلغاء</button>
      </div>
    </div>
  </div>
);

// ── Step 2a: live camera, capture a frame ───────────────────────────────────
// Starts on the back (environment) camera — admins are photographing the
// student standing in front of them, not taking a selfie — with a flip
// button to switch to the front camera when that's actually what's needed.
const CameraModal = ({ onCapture, onCancel }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');

  useEffect(() => {
    let cancelled = false;
    setError(null);
    navigator.mediaDevices?.getUserMedia({ video: { facingMode }, audio: false })
      .then(s => {
        if (cancelled) { s.getTracks().forEach(t => t.stop()); return; }
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setError('تعذّر الوصول إلى الكاميرا — تأكد من السماح للمتصفح باستخدامها.'));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (facingMode === 'user') {
      // Mirror back to a natural (non-selfie) orientation on capture.
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    stream?.getTracks().forEach(t => t.stop());
    onCapture(canvas.toDataURL('image/jpeg', 0.95));
  };

  const cancel = () => {
    stream?.getTracks().forEach(t => t.stop());
    onCancel();
  };

  const flip = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setFacingMode(m => (m === 'user' ? 'environment' : 'user'));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--overlay-media)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <h3 style={{ color: 'var(--accent-gold)', textAlign: 'center', marginBottom: '1rem' }}>التقاط صورة</h3>
        <div style={{ position: 'relative', width: '100%', height: '340px', borderRadius: '12px', overflow: 'hidden', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {error ? (
            <p style={{ color: 'var(--danger)', textAlign: 'center', padding: '1.5rem', fontSize: '0.88rem' }}>{error}</p>
          ) : (
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} />
          )}
          {!error && (
            <button
              type="button"
              onClick={flip}
              title="تبديل الكاميرا"
              style={{ position: 'absolute', top: '10px', left: '10px', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#fff' }}>cameraswitch</span>
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button className="btn-secondary" onClick={cancel} style={{ flex: 1 }}>إلغاء</button>
          <button className="btn-primary" onClick={capture} disabled={!!error || !stream} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>camera</span>
            التقاط
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Step 2b (or from camera): crop to a circle ──────────────────────────────
const CropModal = ({ imageSrc, onConfirm, onCancel, busy }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const onCropComplete = useCallback((_, pixels) => setCroppedAreaPixels(pixels), []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--overlay-media)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
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
          <button className="btn-secondary" onClick={onCancel} style={{ flex: 1 }} disabled={busy}>إلغاء</button>
          <button className="btn-primary" style={{ flex: 1 }} disabled={busy} onClick={() => onConfirm(croppedAreaPixels)}>
            {busy ? 'جاري الرفع...' : 'تأكيد'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Circular avatar with a camera badge that offers both a file picker and a
 * live camera capture, then a mandatory crop step so every photo across the
 * app (self-registration, admin creating a profile, a student's own profile)
 * ends up framed identically.
 *
 * Upload strategy is intentionally pluggable via `uploadFn`, since where the
 * photo can be uploaded TO differs by caller: a logged-in student/admin has
 * an authenticated endpoint, but self-registration happens before any
 * account exists, so it needs its own anonymous endpoint. This component
 * doesn't know or care which — it just hands the cropped Blob to whatever
 * `uploadFn` the caller wired up and reports the resulting URL back.
 */
export default function PhotoCaptureField({
  photoUrl,
  onUploaded,
  uploadFn,
  size = 110,
  required = false,
  disabled = false,
}) {
  const fileInputRef = useRef(null);
  const [step, setStep] = useState('idle'); // idle | source | camera | crop
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const openSource = () => { setError(null); setStep('source'); };

  const handleFileChosen = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) { setStep('idle'); return; }
    const reader = new FileReader();
    reader.onload = () => { setRawImageSrc(reader.result); setStep('crop'); };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = (dataUrl) => {
    setRawImageSrc(dataUrl);
    setStep('crop');
  };

  const handleCropConfirm = async (croppedAreaPixels) => {
    setUploading(true);
    setError(null);
    try {
      const blob = await getCroppedBlob(rawImageSrc, croppedAreaPixels);
      const url = await uploadFn(blob);
      onUploaded(url);
      setStep('idle');
      setRawImageSrc(null);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.Message || err.message;
      setError(`فشل رفع الصورة: ${msg}`);
      setStep('idle');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChosen} />

      <div style={{ position: 'relative', display: 'inline-block' }}>
        {photoUrl ? (
          <img src={photoUrl} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-gold)', boxShadow: '0 0 24px rgba(251,191,36,0.35)' }} />
        ) : (
          <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--surface-2)', border: '3px dashed rgba(251,191,36,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: Math.round(size * 0.5), color: 'rgba(251,191,36,0.4)' }}>account_circle</span>
          </div>
        )}

        <button
          type="button"
          onClick={openSource}
          disabled={disabled || uploading}
          style={{ position: 'absolute', bottom: '2px', left: '2px', width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-gold)', border: '2px solid var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--on-accent)' }}>photo_camera</span>
        </button>

        {required && !photoUrl && (
          <span style={{ position: 'absolute', top: '4px', right: '4px', width: '16px', height: '16px', background: 'var(--danger-solid)', borderRadius: '50%', border: '2px solid var(--bg-primary)' }} />
        )}
      </div>

      {required && !photoUrl && (
        <div style={{ fontSize: '0.78rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginTop: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
          يجب رفع صورة شخصية
        </div>
      )}
      {error && <div className="error-box" style={{ marginTop: '0.75rem' }}>{error}</div>}

      {step === 'source' && (
        <SourceModal
          onPickFile={() => { setStep('idle'); fileInputRef.current.click(); }}
          onPickCamera={() => setStep('camera')}
          onCancel={() => setStep('idle')}
        />
      )}
      {step === 'camera' && (
        <CameraModal onCapture={handleCameraCapture} onCancel={() => setStep('idle')} />
      )}
      {step === 'crop' && rawImageSrc && (
        <CropModal imageSrc={rawImageSrc} busy={uploading} onConfirm={handleCropConfirm} onCancel={() => { setStep('idle'); setRawImageSrc(null); }} />
      )}
    </>
  );
}
