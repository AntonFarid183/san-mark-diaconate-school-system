import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

// ── QrScanner ────────────────────────────────────────────────────────────
// Opens the camera, decodes QR codes from the live video frame-by-frame via
// jsQR, and reports each decode to `onScan(token)`. Stays open and scanning
// after a hit — the caller decides what to do with each token (mark
// present, show a toast, ignore a duplicate) — this component never closes
// itself or reloads anything. A short cooldown after each decode avoids
// firing the same still-visible code dozens of times a second.
const RESCAN_COOLDOWN_MS = 2000;

export default function QrScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(document.createElement('canvas'));
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const lastScanRef = useRef({ token: null, at: 0 });
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch {
        setError('تعذر الوصول إلى الكاميرا. تأكد من إعطاء الإذن للمتصفح.');
      }
    }

    function tick() {
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code?.data) {
          const now = Date.now();
          const last = lastScanRef.current;
          if (code.data !== last.token || now - last.at > RESCAN_COOLDOWN_MS) {
            lastScanRef.current = { token: code.data, at: now };
            onScan(code.data);
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: 'min(92vw, 480px)' }}>
        <span style={{ color: '#fff', fontWeight: 700 }}>مسح كارنيه الطالب</span>
        <button onClick={onClose} className="btn-secondary" style={{ width: 'auto', padding: '0.4rem 1rem' }}>إغلاق</button>
      </div>

      {error ? (
        <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.15)', padding: '1rem', borderRadius: '8px', maxWidth: '90vw', textAlign: 'center' }}>
          {error}
        </div>
      ) : (
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ width: 'min(92vw, 480px)', borderRadius: '12px', border: '2px solid var(--accent-gold)' }}
        />
      )}
    </div>
  );
}
