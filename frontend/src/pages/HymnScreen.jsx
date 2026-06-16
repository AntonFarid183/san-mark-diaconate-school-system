import { useState, useEffect } from 'react';
import Layout from '../Layout';
import apiClient from '../apiClient';

const statusBadge = (status) => {
  const map = {
    Pending: { bg: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)', label: 'قيد الانتظار' },
    Submitted: { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', label: 'تم التقديم' },
    Approved: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', label: 'مقبول' },
    Rejected: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', label: 'مرفوض' },
  };
  const s = map[status] || map.Pending;
  return <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.7rem', borderRadius: '20px', background: s.bg, color: s.color, fontWeight: 600 }}>{s.label}</span>;
};

const HymnScreen = () => {
  const [hymns, setHymns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recordingModal, setRecordingModal] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get('/hymn');
        setHymns(res.data || []);
      } catch {
        setHymns([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
      };
      mr.start();
      setMediaRecorder(mr);
      setRecording(true);
    } catch {}
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
      setRecording(false);
    }
  };

  const submitRecording = async () => {
    if (!recordingModal || !audioBlob) return;
    const fd = new FormData();
    fd.append('audio', audioBlob, 'recording.webm');
    try {
      await apiClient.post(`/hymn/${recordingModal.id}/submit`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const res = await apiClient.get('/hymn');
      setHymns(res.data || []);
    } catch {}
    setAudioBlob(null);
    setRecordingModal(null);
  };

  const canRecord = (status) => status === 'Pending' || status === 'Rejected';

  if (loading) return <Layout title="تقديم الألحان"><p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p></Layout>;

  return (
    <Layout title="تقديم الألحان">
      <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>سجل وأرسل تسجيلات الألحان والمزامير المطلوبة للمراجعة</p>

      {hymns.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>music_note</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>لا توجد ألحان مطلوبة حالياً</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {hymns.map(hymn => (
            <div key={hymn.id} className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{hymn.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{hymn.description}</div>
                </div>
                {statusBadge(hymn.status)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>آخر موعد: {new Date(hymn.dueDate).toLocaleDateString('ar-EG')}</span>
                {canRecord(hymn.status) && (
                  <button onClick={() => setRecordingModal(hymn)} className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>mic</span>
                    تسجيل
                  </button>
                )}
              </div>
              {hymn.feedback && (
                <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 600, color: '#fff' }}>الملاحظات: </span>{hymn.feedback}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {recordingModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setRecordingModal(null); setAudioBlob(null); } }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--accent-gold)', marginBottom: '1rem' }}>mic</span>
            <h3 style={{ color: '#fff', marginBottom: '1rem' }}>تسجيل: {recordingModal.title}</h3>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginBottom: '1.5rem', overflow: 'hidden' }}>
              {recording && <div style={{ width: '100%', height: '100%', background: 'var(--accent-gold)', animation: 'pulse 0.5s infinite' }} />}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
              {!recording ? (
                <button onClick={startRecording} className="btn-primary" style={{ width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>mic</span>
                </button>
              ) : (
                <button onClick={stopRecording} style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>stop</span>
                </button>
              )}
            </div>
            {audioBlob && (
              <>
                <audio controls src={URL.createObjectURL(audioBlob)} style={{ width: '100%', marginBottom: '1rem' }} />
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button onClick={() => { setAudioBlob(null); }} className="btn-secondary" style={{ fontSize: '0.85rem' }}>إعادة</button>
                  <button onClick={submitRecording} className="btn-primary" style={{ fontSize: '0.85rem' }}>تقديم</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default HymnScreen;
