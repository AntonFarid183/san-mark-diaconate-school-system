import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import Layout from '../Layout';

const BASE = 'http://localhost:5016';
const PING_INTERVAL = 10; // seconds
const SEEK_TOLERANCE = 30; // seconds — matches server tolerance

export default function HymnLessonDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Progress state
  const [progress, setProgress]         = useState(null); // HymnProgressResponseDto
  const [showResume, setShowResume]     = useState(false);
  const [pdfFullscreen, setPdfFullscreen] = useState(false);

  // Video ref
  const videoRef    = useRef(null);
  const pingTimer   = useRef(null);
  const progressRef = useRef(null); // always-current mirror of progress state
  const localMaxPos = useRef(0);    // highest position reached during real playback this session
  const lastTimeRef = useRef(-1);   // previous timeupdate value — used to detect seek vs playback

  // ── Keep progressRef in sync + seed localMaxPos from server ─────────────────
  useEffect(() => {
    progressRef.current = progress;
    // Use the higher of maxReachedPosition or lastPosition as the seed —
    // guards against the backend returning maxReachedPosition=0 when lastPosition > 0
    const serverMax = Math.max(
      progress?.maxReachedPosition ?? 0,
      progress?.lastPosition ?? 0,
    );
    if (serverMax > localMaxPos.current) {
      localMaxPos.current = serverMax;
    }
  }, [progress]);

  // ── Load lesson + progress ─────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [lessonRes, progressRes] = await Promise.all([
          apiClient.get(`/hymn-lessons/${id}`),
          apiClient.get(`/hymn-lessons/${id}/progress`),
        ]);
        setLesson(lessonRes.data);
        setProgress(progressRes.data);
        if (progressRes.data.lastPosition > 5) setShowResume(true);
      } catch { setError('تعذّر تحميل درس اللحن.'); }
      finally { setLoading(false); }
    };
    load();
    return () => clearInterval(pingTimer.current);
  }, [id]);

  // ── Ping server every 10s while playing ───────────────────────────────────
  const sendPing = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.paused || !video.duration) return;
    try {
      const res = await apiClient.post(`/hymn-lessons/${id}/progress`, {
        position: Math.floor(video.currentTime),
        duration: Math.floor(video.duration),
      });
      setProgress(res.data);
    } catch { /* silent — don't interrupt playback */ }
  }, [id]);

  const startPinging = useCallback(() => {
    clearInterval(pingTimer.current);
    pingTimer.current = setInterval(sendPing, PING_INTERVAL * 1000);
  }, [sendPing]);

  const stopPinging = useCallback(() => {
    clearInterval(pingTimer.current);
    // Send one final ping on pause/end
    sendPing();
  }, [sendPing]);

  // ── Track local max — delta check distinguishes playback from seek jumps ────
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const cur = video.currentTime;
    const prev = lastTimeRef.current;
    lastTimeRef.current = cur;
    // Normal playback: small forward step (< 1.5s between ticks).
    // A seek produces a large delta or negative delta — ignore it.
    if (prev >= 0) {
      const delta = cur - prev;
      if (delta > 0 && delta < 1.5 && cur > localMaxPos.current) {
        localMaxPos.current = cur;
      }
    }
  }, []);

  // ── Anti-skip: block forward seeks beyond watermark ────────────────────────
  const handleSeeking = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (progressRef.current?.isCompleted) return;

    const maxAllowed = localMaxPos.current + SEEK_TOLERANCE;
    if (video.currentTime > maxAllowed) {
      video.currentTime = maxAllowed;
      // Reset lastTimeRef so the next timeupdate doesn't treat the clamp as playback
      lastTimeRef.current = -1;
    }
  }, []);

  // ── Resume prompt ──────────────────────────────────────────────────────────
  const resumeFromLast = () => {
    if (videoRef.current && progress?.lastPosition) {
      lastTimeRef.current = -1; // reset so resume jump isn't treated as playback
      videoRef.current.currentTime = progress.lastPosition;
    }
    setShowResume(false);
  };

  // ── Download PDF ───────────────────────────────────────────────────────────
  const downloadFile = async (url, fileName) => {
    try {
      const res = await fetch(`${BASE}${url}`);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName || 'lyrics.pdf';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { alert('تعذّر تنزيل الملف.'); }
  };

  if (loading) return <Layout title="درس لحن"><p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p></Layout>;
  if (error || !lesson) return (
    <Layout title="درس لحن">
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>{error || 'الدرس غير موجود.'}</div>
    </Layout>
  );

  const hasPdf   = (lesson.lyricsType === 1 || lesson.lyricsType === 3) && lesson.lyricsPdfUrl;
  const hasImage = (lesson.lyricsType === 2 || lesson.lyricsType === 3) && lesson.lyricsImageUrl;
  const hasVideo = lesson.videoType !== 0;
  const pct      = progress?.watchedPercent ?? 0;

  return (
    <Layout title={lesson.title}>

      {/* Back */}
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
        العودة
      </button>

      {/* Header + progress */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ color: 'var(--accent-gold)', marginBottom: '0.35rem' }}>{lesson.title}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{lesson.stageName}</p>
            {lesson.description && <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '0.6rem' }}>{lesson.description}</p>}
          </div>

          {/* Progress ring — only show once the student has started */}
          {hasVideo && (pct > 0 || progress?.isCompleted) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                <circle cx="36" cy="36" r="30" fill="none"
                  stroke={progress?.isCompleted ? 'var(--success)' : 'var(--accent-gold)'}
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - pct / 100)}`}
                  strokeLinecap="round" transform="rotate(-90 36 36)"
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                <text x="36" y="40" textAnchor="middle" fill="var(--text-primary)" fontSize="13" fontWeight="700">{Math.round(pct)}%</text>
              </svg>
              <span style={{ fontSize: '0.72rem', color: progress?.isCompleted ? 'var(--success)' : 'var(--text-muted)' }}>
                {progress?.isCompleted ? 'مكتمل ✓' : pct > 0 ? 'جاري' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {hasVideo && pct > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: progress?.isCompleted ? 'var(--success)' : 'var(--accent-gold)', borderRadius: '2px', transition: 'width 0.6s ease' }} />
            </div>
            {progress && !progress.isCompleted && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>{fmtTime(progress.lastPosition)}</span>
                <span>{fmtTime(progress.totalDuration)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resume prompt */}
      {showResume && progress && (
        <div style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem', borderRadius: '10px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--accent-gold)' }}>play_circle</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              آخر موضع وصلت إليه: <strong style={{ color: 'var(--accent-gold)' }}>{fmtTime(progress.lastPosition)}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={resumeFromLast} style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--accent-gold)', color: '#1e293b', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700 }}>
              استكمال من {fmtTime(progress.lastPosition)}
            </button>
            <button onClick={() => setShowResume(false)} style={{ padding: '0.4rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600 }}>
              من البداية
            </button>
          </div>
        </div>
      )}

      {/* Video */}
      {hasVideo && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent-gold)' }}>videocam</span>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>الفيديو التعليمي</span>
            {!progress?.isCompleted && (
              <span style={{ marginRight: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.15rem 0.5rem', borderRadius: '20px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)' }}>
                لا يمكن التخطي إلى أجزاء لم تُشاهد بعد
              </span>
            )}
          </div>
          {lesson.videoType === 2 ? (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '8px', overflow: 'hidden' }}>
              <iframe src={lesson.videoUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={lesson.title} />
            </div>
          ) : (
            <video
              ref={videoRef}
              controls
              style={{ width: '100%', borderRadius: '8px', maxHeight: '480px', background: '#000' }}
              src={`${BASE}${lesson.videoUrl}`}
              onPlay={startPinging}
              onPause={stopPinging}
              onEnded={stopPinging}
              onTimeUpdate={handleTimeUpdate}
              onSeeking={handleSeeking}
            />
          )}
        </div>
      )}

      {/* Lyrics image */}
      {hasImage && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent-gold)' }}>lyrics</span>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>كلمات اللحن</span>
          </div>
          <img src={`${BASE}${lesson.lyricsImageUrl}`} alt="كلمات اللحن"
            style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
        </div>
      )}

      {/* Lyrics PDF viewer */}
      {hasPdf && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent-gold)' }}>picture_as_pdf</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ملف كلمات اللحن</span>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button onClick={() => setPdfFullscreen(true)} style={pdfBtn('#60a5fa')}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>fullscreen</span>
                تكبير
              </button>
              <button onClick={() => downloadFile(lesson.lyricsPdfUrl, lesson.lyricsPdfFileName)} style={pdfBtn('#f87171')}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                تنزيل
              </button>
            </div>
          </div>
          <div style={{ height: '1px', background: 'var(--glass-border)', marginBottom: '1.25rem' }} />
          <iframe src={`${BASE}${lesson.lyricsPdfUrl}`}
            style={{ width: '100%', height: '680px', border: '1px solid var(--glass-border)', borderRadius: '8px', display: 'block' }}
            title="ملف كلمات اللحن" />
        </div>
      )}

      {!hasVideo && !hasPdf && !hasImage && (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', display: 'block', marginBottom: '1rem' }}>music_note</span>
          لم يُضف محتوى لهذا الدرس بعد.
        </div>
      )}

      {/* PDF Fullscreen */}
      {pdfFullscreen && hasPdf && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 500, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem', background: 'rgba(15,23,42,0.98)', borderBottom: '1px solid var(--glass-border)', flexShrink: 0 }}>
            <span style={{ fontWeight: 600, color: 'var(--accent-gold)', fontSize: '0.95rem' }}>{lesson.lyricsPdfFileName || 'كلمات اللحن'}</span>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button onClick={() => downloadFile(lesson.lyricsPdfUrl, lesson.lyricsPdfFileName)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', fontFamily: 'inherit' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                تنزيل
              </button>
              <button onClick={() => setPdfFullscreen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>✕</button>
            </div>
          </div>
          <iframe src={`${BASE}${lesson.lyricsPdfUrl}`} style={{ flex: 1, border: 'none', width: '100%' }} title="معاينة PDF" />
        </div>
      )}
    </Layout>
  );
}

const fmtTime = (secs) => {
  if (!secs) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const pdfBtn = (color) => ({
  display: 'flex', alignItems: 'center', gap: '0.35rem',
  padding: '0.35rem 0.85rem', borderRadius: '8px',
  border: `1px solid ${color}40`, background: `${color}14`,
  color, cursor: 'pointer', fontFamily: 'inherit',
  fontSize: '0.82rem', fontWeight: 600,
});
