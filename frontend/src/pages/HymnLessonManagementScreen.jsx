import { useState, useEffect, useRef } from 'react';
import apiClient from '../apiClient';
import Layout from '../Layout';
import { BACKEND_URL } from '../config';

const STAGES_WITH_GRADES = new Set([
  '00000000-0000-0000-0001-000000000001', // ابتدائي
  '00000000-0000-0000-0002-000000000001', // إعدادي
  '00000000-0000-0000-0003-000000000001', // ثانوي
]);

const STATUS_MAP = {
  0: { label: 'تحت الإنشاء', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.08)' },
  1: { label: 'منشور',  color: 'var(--success)',    bg: 'rgba(16,185,129,0.12)' },
  2: { label: 'مؤرشف', color: '#94a3b8',            bg: 'rgba(148,163,184,0.12)' },
};

export default function HymnLessonManagementScreen() {
  const [items, setItems]       = useState([]);
  const [stages, setStages]     = useState([]);
  const [allGrades, setAllGrades] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filterStage, setFilterStage] = useState('');
  const [search, setSearch]     = useState('');

  // create / edit modal
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState({ title: '', description: '', stageId: '', gradeId: '', youTubeUrl: '', videoMode: 'youtube' });

  // upload modal
  const [uploadTarget, setUploadTarget] = useState(null); // the lesson being managed
  const [uploading, setUploading]       = useState(null); // 'video' | 'pdf' | 'image'

  // preview modal
  const [previewLesson, setPreviewLesson] = useState(null);
  const [previewPdfFs, setPreviewPdfFs]   = useState(false);

  const [msg, setMsg] = useState(null);

  const videoInputRef = useRef();
  const pdfInputRef   = useRef();
  const imgInputRef   = useRef();

  useEffect(() => { fetchStages(); fetchAllGrades(); fetchAll(); }, []);
  useEffect(() => { fetchAll(); }, [filterStage]);

  const fetchStages = async () => {
    try { const r = await apiClient.get('/students/stages'); setStages(r.data); } catch (err) { console.error('Failed to load stages', err); }
  };

  const fetchAllGrades = async () => {
    try { const r = await apiClient.get('/students/grades'); setAllGrades(r.data); } catch (err) { console.error('Failed to load grades', err); }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = filterStage ? { stageId: filterStage } : {};
      const r = await apiClient.get('/hymn-lessons', { params });
      setItems(r.data);
    } catch { setItems([]); } finally { setLoading(false); }
  };

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  // ── form ──────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', stageId: stages[0]?.id || '', gradeId: '', youTubeUrl: '', videoMode: 'youtube' });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title, description: item.description || '',
      stageId: item.stageId, gradeId: item.gradeId || '',
      youTubeUrl: item.videoType === 2 ? item.videoUrl : '',
      videoMode: item.videoType === 1 ? 'upload' : 'youtube',
    });
    setShowForm(true);
  };

  const submit = async () => {
    if (!form.title.trim() || !form.stageId) { flash('error', 'العنوان والمرحلة مطلوبان.'); return; }
    const stageHasGrades = STAGES_WITH_GRADES.has(form.stageId);
    if (stageHasGrades && !form.gradeId) { flash('error', 'يرجى اختيار السنة الدراسية لهذه المرحلة.'); return; }
    const payload = {
      title: form.title, description: form.description, stageId: form.stageId,
      gradeId: stageHasGrades && form.gradeId ? form.gradeId : null,
      youTubeUrl: form.videoMode === 'youtube' ? form.youTubeUrl : null,
    };
    try {
      if (editing) await apiClient.put(`/hymn-lessons/${editing.id}`, payload);
      else         await apiClient.post('/hymn-lessons', payload);
      flash('success', editing ? 'تم التحديث.' : 'تم الإنشاء.');
      setShowForm(false);
      fetchAll();
    } catch (e) { flash('error', e.response?.data?.message || 'فشل الحفظ.'); }
  };

  // ── uploads ───────────────────────────────────────────────────────────────
  const doUpload = async (endpoint, file) => {
    if (!file || !uploadTarget) return;
    setUploading(endpoint);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await apiClient.post(`/hymn-lessons/${uploadTarget.id}/${endpoint}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      flash('success', 'تم رفع الملف بنجاح.');
      // refresh the target lesson inside the modal too
      const r = await apiClient.get(`/hymn-lessons/${uploadTarget.id}`);
      setUploadTarget(r.data);
      fetchAll();
    } catch (e) { flash('error', e.response?.data?.message || 'فشل الرفع.'); }
    finally { setUploading(null); }
  };

  // ── status actions ────────────────────────────────────────────────────────
  const publish = async (id) => {
    try { await apiClient.post(`/hymn-lessons/${id}/publish`); flash('success', 'تم النشر.'); fetchAll(); }
    catch (e) { flash('error', e.response?.data?.message || 'فشل النشر.'); }
  };
  const archive = async (id) => {
    try { await apiClient.post(`/hymn-lessons/${id}/archive`); flash('success', 'تم الأرشفة.'); fetchAll(); }
    catch { flash('error', 'فشل الأرشفة.'); }
  };
  const del = async (id) => {
    if (!window.confirm('حذف درس اللحن نهائياً؟')) return;
    try { await apiClient.delete(`/hymn-lessons/${id}`); flash('success', 'تم الحذف.'); fetchAll(); }
    catch { flash('error', 'فشل الحذف.'); }
  };

  const filtered = items.filter(i => !search || i.title.includes(search));

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <Layout title="إدارة دروس الألحان">

      {/* Hidden file inputs — each has its own clean handler */}
      <input ref={videoInputRef} type="file" accept="video/*"          style={{ display: 'none' }} onChange={e => { doUpload('upload-video',        e.target.files[0]); e.target.value = ''; }} />
      <input ref={pdfInputRef}   type="file" accept="application/pdf"  style={{ display: 'none' }} onChange={e => { doUpload('upload-lyrics-pdf',   e.target.files[0]); e.target.value = ''; }} />
      <input ref={imgInputRef}   type="file" accept="image/*"           style={{ display: 'none' }} onChange={e => { doUpload('upload-lyrics-image', e.target.files[0]); e.target.value = ''; }} />

      {/* Toast — floating, always on top */}
      {msg && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, minWidth: '260px', maxWidth: '420px',
          padding: '0.85rem 1.25rem', borderRadius: '10px',
          background: msg.type === 'success' ? 'rgba(16,185,129,0.92)' : 'rgba(239,68,68,0.92)',
          color: '#fff', fontWeight: 600, fontSize: '0.9rem',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
          animation: 'fadeInUp 0.25s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {msg.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {msg.text}
          </div>
          <span style={{ cursor: 'pointer', opacity: 0.8, fontSize: '1rem', flexShrink: 0 }} onClick={() => setMsg(null)}>✕</span>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="premium-input" placeholder="بحث باسم الدرس..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: '180px' }} />
        <select className="premium-input" value={filterStage} onChange={e => setFilterStage(e.target.value)} style={{ width: '170px' }}>
          <option value="">كل المراحل</option>
          {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button className="btn-primary" style={{ width: 'auto', padding: '0.55rem 1.25rem', whiteSpace: 'nowrap' }} onClick={openCreate}>
          + درس جديد
        </button>
      </div>

      {/* List */}
      {loading ? <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>
        : filtered.length === 0
          ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>music_note</span>
              <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>لا توجد دروس ألحان</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filtered.map(item => {
                const st = STATUS_MAP[item.status] || STATUS_MAP[0];
                return (
                  <div key={item.id} className="glass-card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

                      {/* Icon */}
                      <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--accent-gold)', flexShrink: 0 }}>
                        {item.videoType === 2 ? 'smart_display' : item.videoType === 1 ? 'videocam' : 'music_note'}
                      </span>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.97rem' }}>{item.title}</span>
                          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.55rem', borderRadius: '20px', background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{st.label}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          <span>{item.stageName}{item.gradeName ? ` — ${item.gradeName}` : ''}</span>
                          <span>فيديو: {item.videoType === 0 ? 'لا يوجد' : item.videoType === 1 ? 'ملف مرفوع' : 'يوتيوب'}</span>
                          <span>كلمات: {item.lyricsType === 0 ? 'لا يوجد' : item.lyricsType === 1 ? 'PDF' : item.lyricsType === 2 ? 'صورة' : 'PDF + صورة'}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                        <button onClick={() => { setPreviewLesson(item); setPreviewPdfFs(false); }} className="btn-icon purple" title="معاينة كالطالب">
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>preview</span>
                          <span className="btn-icon-label">معاينة</span>
                        </button>
                        <button onClick={() => setUploadTarget(item)} className="btn-icon" title="رفع الملفات">
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cloud_upload</span>
                          <span className="btn-icon-label">رفع</span>
                        </button>
                        <button onClick={() => openEdit(item)} className="btn-icon" title="تعديل البيانات">
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                          <span className="btn-icon-label">تعديل</span>
                        </button>
                        {item.status === 0 && (
                          <button onClick={() => publish(item.id)} className="btn-icon success" title="نشر">
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>publish</span>
                            <span className="btn-icon-label">نشر</span>
                          </button>
                        )}
                        {item.status === 1 && (
                          <button onClick={() => archive(item.id)} className="btn-icon" title="أرشفة">
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>archive</span>
                            <span className="btn-icon-label">أرشفة</span>
                          </button>
                        )}
                        <button onClick={() => del(item.id)} className="btn-icon danger" title="حذف">
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                          <span className="btn-icon-label">حذف</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

      {/* ── Upload Modal ───────────────────────────────────────────────────── */}
      {uploadTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '2rem', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--accent-gold)', fontSize: '1.1rem' }}>رفع ملفات — {uploadTarget.title}</h3>
              <button onClick={() => setUploadTarget(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Video */}
              <div style={uploadSection}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#60a5fa' }}>videocam</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>الفيديو التعليمي</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {uploadTarget.videoType === 0 ? 'لم يُرفع فيديو بعد' : uploadTarget.videoType === 1 ? `ملف مرفوع: ${uploadTarget.videoFileName || ''}` : `يوتيوب: ${uploadTarget.videoUrl}`}
                    </div>
                  </div>
                </div>
                <button onClick={() => videoInputRef.current.click()} disabled={uploading === 'upload-video'} style={uploadBtn('#60a5fa')}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload</span>
                  {uploading === 'upload-video' ? 'جاري الرفع...' : uploadTarget.videoType === 1 ? 'استبدال الفيديو' : 'رفع فيديو (MP4 / WebM)'}
                </button>
              </div>

              {/* Lyrics PDF */}
              <div style={uploadSection}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#f87171' }}>picture_as_pdf</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>كلمات اللحن — PDF</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {(uploadTarget.lyricsType === 1 || uploadTarget.lyricsType === 3) ? `مرفوع: ${uploadTarget.lyricsPdfFileName || ''}` : 'لم يُرفع ملف PDF بعد'}
                    </div>
                  </div>
                </div>
                <button onClick={() => pdfInputRef.current.click()} disabled={uploading === 'upload-lyrics-pdf'} style={uploadBtn('#f87171')}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload</span>
                  {uploading === 'upload-lyrics-pdf' ? 'جاري الرفع...' : 'رفع ملف PDF للكلمات'}
                </button>
              </div>

              {/* Lyrics Image */}
              <div style={uploadSection}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#34d399' }}>image</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>كلمات اللحن — صورة</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {(uploadTarget.lyricsType === 2 || uploadTarget.lyricsType === 3) ? 'صورة مرفوعة' : 'لم تُرفع صورة بعد'}
                    </div>
                  </div>
                </div>
                <button onClick={() => imgInputRef.current.click()} disabled={uploading === 'upload-lyrics-image'} style={uploadBtn('#34d399')}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload</span>
                  {uploading === 'upload-lyrics-image' ? 'جاري الرفع...' : 'رفع صورة الكلمات'}
                </button>
              </div>

            </div>

            <button className="btn-secondary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => setUploadTarget(null)}>
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* ── Student Preview Modal ─────────────────────────────────────────── */}
      {previewLesson && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300, display: 'flex', flexDirection: 'column' }}>

          {/* Preview top-bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', background: 'rgba(88,28,235,0.25)', borderBottom: '1px solid rgba(167,139,250,0.3)', flexShrink: 0, backdropFilter: 'blur(12px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#a78bfa' }}>preview</span>
              <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.95rem' }}>معاينة كالطالب</span>
              <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.6rem', borderRadius: '20px', background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
                {STATUS_MAP[previewLesson.status]?.label || 'تحت الإنشاء'}
              </span>
            </div>
            <button onClick={() => setPreviewLesson(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}>✕</button>
          </div>

          {/* Scrollable student-view content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', maxWidth: '860px', width: '100%', margin: '0 auto' }}>

            {/* Header card */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--accent-gold)', marginBottom: '0.35rem' }}>{previewLesson.title}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{previewLesson.stageName}</p>
              {previewLesson.description && <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '0.6rem' }}>{previewLesson.description}</p>}
            </div>

            {/* Video */}
            {previewLesson.videoType !== 0 && (
              <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent-gold)' }}>videocam</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>الفيديو التعليمي</span>
                </div>
                {previewLesson.videoType === 2 ? (
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '8px', overflow: 'hidden' }}>
                    <iframe src={previewLesson.videoUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={previewLesson.title} />
                  </div>
                ) : (
                  <video controls style={{ width: '100%', borderRadius: '8px', maxHeight: '420px', background: '#000' }}
                    src={`${BACKEND_URL}${previewLesson.videoUrl}`} />
                )}
              </div>
            )}

            {/* Lyrics image */}
            {(previewLesson.lyricsType === 2 || previewLesson.lyricsType === 3) && previewLesson.lyricsImageUrl && (
              <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent-gold)' }}>lyrics</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>كلمات اللحن</span>
                </div>
                <img src={`${BACKEND_URL}${previewLesson.lyricsImageUrl}`} alt="كلمات اللحن"
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
              </div>
            )}

            {/* Lyrics PDF */}
            {(previewLesson.lyricsType === 1 || previewLesson.lyricsType === 3) && previewLesson.lyricsPdfUrl && (
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent-gold)' }}>picture_as_pdf</span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ملف كلمات اللحن</span>
                  </div>
                  <button onClick={() => setPreviewPdfFs(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(96,165,250,0.35)', background: 'rgba(96,165,250,0.08)', color: '#60a5fa', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>fullscreen</span>
                    تكبير
                  </button>
                </div>
                <div style={{ height: '1px', background: 'var(--glass-border)', marginBottom: '1.25rem' }} />
                <iframe src={`${BACKEND_URL}${previewLesson.lyricsPdfUrl}`}
                  style={{ width: '100%', height: '620px', border: '1px solid var(--glass-border)', borderRadius: '8px', display: 'block' }}
                  title="ملف كلمات اللحن — معاينة" />
              </div>
            )}

            {previewLesson.videoType === 0 && previewLesson.lyricsType === 0 && (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', display: 'block', marginBottom: '1rem' }}>music_note</span>
                لم يُضف محتوى لهذا الدرس بعد.
              </div>
            )}
          </div>

          {/* PDF fullscreen inside preview */}
          {previewPdfFs && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem', background: 'rgba(15,23,42,0.98)', borderBottom: '1px solid var(--glass-border)', flexShrink: 0 }}>
                <span style={{ fontWeight: 600, color: 'var(--accent-gold)', fontSize: '0.95rem' }}>{previewLesson.lyricsPdfFileName || 'كلمات اللحن'}</span>
                <button onClick={() => setPreviewPdfFs(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>✕</button>
              </div>
              <iframe src={`${BACKEND_URL}${previewLesson.lyricsPdfUrl}`} style={{ flex: 1, border: 'none', width: '100%' }} title="معاينة PDF ملء الشاشة" />
            </div>
          )}
        </div>
      )}

      {/* ── Create / Edit Modal ────────────────────────────────────────────── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '2rem', direction: 'rtl', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              {editing ? 'تعديل بيانات الدرس' : 'إضافة درس لحن جديد'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={lbl}>عنوان الدرس *</label>
                <input className="premium-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثال: لحن إفلوجيمينوس" />
              </div>
              <div>
                <label style={lbl}>الوصف</label>
                <textarea className="premium-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} style={{ resize: 'vertical' }} />
              </div>
              <div>
                <label style={lbl}>المرحلة *</label>
                <select className="premium-input" value={form.stageId} onChange={e => setForm({ ...form, stageId: e.target.value, gradeId: '' })}>
                  <option value="">اختر المرحلة</option>
                  {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {STAGES_WITH_GRADES.has(form.stageId) && (
                <div>
                  <label style={lbl}>السنة الدراسية *</label>
                  <select
                    className="premium-input"
                    value={form.gradeId}
                    onChange={e => setForm({ ...form, gradeId: e.target.value })}
                    style={{ borderColor: !form.gradeId ? 'rgba(251,191,36,0.6)' : undefined }}
                  >
                    <option value="">— اختر السنة الدراسية —</option>
                    {allGrades.filter(g => g.stageId === form.stageId).map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={lbl}>رابط يوتيوب (اختياري)</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {['youtube', 'upload'].map(m => (
                    <button key={m} type="button" onClick={() => setForm({ ...form, videoMode: m })}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${form.videoMode === m ? 'var(--accent-gold)' : 'var(--glass-border)'}`, background: form.videoMode === m ? 'rgba(251,191,36,0.1)' : 'var(--input-bg)', color: form.videoMode === m ? 'var(--accent-gold)' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>
                      {m === 'youtube' ? '🔗 رابط يوتيوب' : '📁 رفع ملف فيديو'}
                    </button>
                  ))}
                </div>
                {form.videoMode === 'youtube'
                  ? <input className="premium-input" value={form.youTubeUrl} onChange={e => setForm({ ...form, youTubeUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
                  : <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', padding: '0.6rem', background: 'var(--input-bg)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--glass-border)' }}>بعد الحفظ، افتح نافذة "رفع الملفات" لرفع ملف الفيديو.</p>
                }
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={submit}>{editing ? 'حفظ التعديلات' : 'إنشاء الدرس'}</button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// ── shared styles ─────────────────────────────────────────────────────────────
const uploadSection = {
  padding: '1rem', borderRadius: 'var(--radius-sm)',
  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
};
const uploadBtn = (color) => ({
  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
  padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)',
  border: `1px solid ${color}22`, background: `${color}11`, color,
  cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 600,
  transition: 'background 0.2s',
});
const lbl = { fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' };
