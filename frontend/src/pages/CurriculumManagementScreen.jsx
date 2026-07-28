import { useState, useEffect, useRef } from 'react';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';
import { BACKEND_URL } from '../config';

const STATUS_MAP = {
  0: { label: 'تحت الإنشاء', color: 'var(--text-muted)', bg: 'var(--surface-3)' },
  1: { label: 'منشور',  color: 'var(--success)',    bg: 'rgba(16,185,129,0.12)' },
  2: { label: 'مؤرشف', color: 'var(--text-muted)',            bg: 'rgba(148,163,184,0.12)' },
};

const CURRENT_YEAR = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

const SUBJECT_OPTIONS = [
  { value: 1, label: 'الطقس' },
  { value: 2, label: 'الألحان' },
  { value: 3, label: 'القبطي' },
];
const subjectLabel = (v) => SUBJECT_OPTIONS.find(s => s.value === Number(v))?.label || '';

// Stages that have sub-grades in the DB
const STAGES_WITH_GRADES = new Set([
  '00000000-0000-0000-0001-000000000001', // ابتدائي
  '00000000-0000-0000-0002-000000000001', // إعدادي
  '00000000-0000-0000-0003-000000000001', // ثانوي
]);

export default function CurriculumManagementScreen() {
  usePageTitle('إدارة المناهج');
  const [items, setItems]             = useState([]);
  const [stages, setStages]           = useState([]);
  const [allGrades, setAllGrades]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filterStage, setFilterStage] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterYear, setFilterYear]   = useState('');
  const [search, setSearch]           = useState('');

  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState(null);
  const [filterSubject, setFilterSubject] = useState('');
  const [form, setForm]               = useState({ title: '', description: '', academicYear: CURRENT_YEAR, subject: 1, stageId: '', gradeId: '' });
  const [pendingFile, setPendingFile] = useState(null);

  const [uploadTarget, setUploadTarget] = useState(null);
  const [uploading, setUploading]       = useState(false);

  const [msg, setMsg] = useState(null);

  const modalFileRef  = useRef();
  const replaceRef    = useRef();

  useEffect(() => { fetchStages(); fetchAllGrades(); fetchAll(); }, []);
  useEffect(() => { fetchAll(); }, [filterStage, filterStatus, filterYear]);

  const fetchStages = async () => {
    try { const r = await apiClient.get('/students/stages'); setStages(r.data); } catch (err) { console.error('Failed to load stages', err); }
  };

  const fetchAllGrades = async () => {
    try { const r = await apiClient.get('/students/grades'); setAllGrades(r.data); } catch (err) { console.error('Failed to load grades', err); }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStage)    params.stageId      = filterStage;
      if (filterStatus !== '') params.status  = filterStatus;
      if (filterYear)     params.academicYear = filterYear;
      const r = await apiClient.get('/curriculum', { params });
      setItems(r.data);
    } catch { setItems([]); } finally { setLoading(false); }
  };

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  // Grades filtered by the currently selected stage in the form
  const gradesForSelectedStage = allGrades.filter(g => g.stageId === form.stageId);
  const selectedStageHasGrades = STAGES_WITH_GRADES.has(form.stageId);

  // ── form ──────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null); setPendingFile(null);
    setForm({ title: '', description: '', academicYear: CURRENT_YEAR, subject: 1, stageId: stages[0]?.id || '', gradeId: '' });
    setShowForm(true);
  };
  const openEdit = (item) => {
    setEditing(item); setPendingFile(null);
    setForm({ title: item.title, description: item.description || '', academicYear: item.academicYear, subject: item.subject, stageId: item.stageId, gradeId: item.gradeId || '' });
    setShowForm(true);
  };

  const handleStageChange = (e) => {
    const newStageId = e.target.value;
    setForm(f => ({ ...f, stageId: newStageId, gradeId: '' }));
  };

  const submit = async () => {
    if (!form.title.trim() || !form.stageId || !form.academicYear.trim()) {
      flash('error', 'العنوان والمرحلة والعام الدراسي مطلوبة.'); return;
    }
    if (selectedStageHasGrades && !form.gradeId) {
      flash('error', 'يرجى اختيار السنة الدراسية لهذه المرحلة.'); return;
    }
    try {
      const payload = {
        title: form.title,
        description: form.description,
        academicYear: form.academicYear,
        subject: Number(form.subject),
        stageId: form.stageId,
        gradeId: selectedStageHasGrades && form.gradeId ? form.gradeId : null,
      };
      let savedId = editing?.id;
      if (editing) { await apiClient.put(`/curriculum/${editing.id}`, payload); }
      else { const r = await apiClient.post('/curriculum', payload); savedId = r.data.id; }
      if (pendingFile && savedId) {
        const fd = new FormData(); fd.append('file', pendingFile);
        await apiClient.post(`/curriculum/${savedId}/upload-pdf`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      flash('success', editing ? 'تم التحديث.' : 'تم الإنشاء.');
      setShowForm(false); setPendingFile(null); fetchAll();
    } catch (e) { flash('error', e.response?.data?.message || 'فشل الحفظ.'); }
  };

  // ── replace PDF ────────────────────────────────────────────────────────────
  const doReplacePdf = async (file) => {
    if (!file || !uploadTarget) return;
    if (file.type !== 'application/pdf') { flash('error', 'يجب أن يكون الملف PDF.'); return; }
    setUploading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      await apiClient.post(`/curriculum/${uploadTarget.id}/upload-pdf`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      flash('success', 'تم رفع الملف بنجاح.');
      const r = await apiClient.get(`/curriculum/${uploadTarget.id}`);
      setUploadTarget(r.data);
      fetchAll();
    } catch (e) { flash('error', e.response?.data?.message || 'فشل الرفع.'); }
    finally { setUploading(false); replaceRef.current.value = ''; }
  };

  // ── status ─────────────────────────────────────────────────────────────────
  const publish = async (id) => {
    try { await apiClient.post(`/curriculum/${id}/publish`); flash('success', 'تم النشر.'); fetchAll(); }
    catch (e) { flash('error', e.response?.data?.message || 'فشل النشر.'); }
  };
  const archive = async (id) => {
    try { await apiClient.post(`/curriculum/${id}/archive`); flash('success', 'تم الأرشفة.'); fetchAll(); }
    catch { flash('error', 'فشل الأرشفة.'); }
  };
  const del = async (id) => {
    if (!window.confirm('حذف هذا المنهج نهائياً؟')) return;
    try { await apiClient.delete(`/curriculum/${id}`); flash('success', 'تم الحذف.'); fetchAll(); }
    catch { flash('error', 'فشل الحذف.'); }
  };

  const filtered = items.filter(i =>
    (!search || i.title.toLowerCase().includes(search.toLowerCase())) &&
    (!filterSubject || i.subject === Number(filterSubject))
  );
  const fmt = (b) => b ? (b > 1e6 ? `${(b/1e6).toFixed(1)} MB` : `${Math.round(b/1024)} KB`) : null;

  return (
    <>

      {/* Hidden inputs */}
      <input ref={modalFileRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => { setPendingFile(e.target.files[0] || null); e.target.value = ''; }} />
      <input ref={replaceRef}   type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => { doReplacePdf(e.target.files[0]); }} />

      {/* Floating toast */}
      {msg && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, minWidth: '260px', maxWidth: '420px',
          padding: '0.85rem 1.25rem', borderRadius: '10px',
          background: msg.type === 'success' ? 'rgba(16,185,129,0.92)' : 'rgba(239,68,68,0.92)',
          color: '#fff', fontWeight: 600, fontSize: '0.9rem',
          backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px var(--shadow-tint)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
          animation: 'fadeInUp 0.25s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {msg.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {msg.text}
          </div>
          <span style={{ cursor: 'pointer', opacity: 0.8 }} onClick={() => setMsg(null)}>✕</span>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="premium-input" placeholder="بحث في العنوان..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: '180px' }} />
        <select className="premium-input" value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={{ width: '130px' }}>
          <option value="">كل المواد</option>
          {SUBJECT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className="premium-input" value={filterStage} onChange={e => setFilterStage(e.target.value)} style={{ width: '160px' }}>
          <option value="">كل المراحل</option>
          {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="premium-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '130px' }}>
          <option value="">كل الحالات</option>
          <option value="0">تحت الإنشاء</option>
          <option value="1">منشور</option>
          <option value="2">مؤرشف</option>
        </select>
        <input className="premium-input" placeholder="العام (2024/2025)" value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ width: '145px' }} />
        <button className="btn-primary" style={{ width: 'auto', padding: '0.55rem 1.25rem', whiteSpace: 'nowrap' }} onClick={openCreate}>
          + منهج جديد
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>menu_book</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>لا توجد مناهج</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(item => {
            const st = STATUS_MAP[item.status] || STATUS_MAP[0];
            return (
              <div key={item.id} className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>

                  {/* Icon */}
                  <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--accent-gold)', flexShrink: 0 }}>import_contacts</span>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.97rem' }}>{item.title}</span>
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.55rem', borderRadius: '20px', background: 'rgba(251,191,36,0.1)', color: 'var(--accent-gold)', whiteSpace: 'nowrap' }}>{subjectLabel(item.subject)}</span>
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.55rem', borderRadius: '20px', background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{st.label}</span>
                      {item.pdfUrl && (
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.55rem', borderRadius: '20px', background: 'rgba(239,68,68,0.12)', color: 'var(--c-red)', whiteSpace: 'nowrap' }}>PDF ✓</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <span>{item.stageName}{item.gradeName ? ` — ${item.gradeName}` : ''}</span>
                      <span>{item.academicYear}</span>
                      {fmt(item.pdfSizeBytes) && <span>{fmt(item.pdfSizeBytes)}</span>}
                    </div>
                  </div>

                  {/* Icon action buttons */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                    <button onClick={() => setUploadTarget(item)} className="btn-icon" title="رفع / استبدال PDF">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload_file</span>
                      <span className="btn-icon-label">رفع</span>
                    </button>
                    {item.pdfUrl && (
                      <a href={`${BACKEND_URL}${item.pdfUrl}`} target="_blank" rel="noopener noreferrer"
                        className="btn-icon info" style={{ textDecoration: 'none' }} title="معاينة PDF">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                        <span className="btn-icon-label">معاينة</span>
                      </a>
                    )}
                    <button onClick={() => openEdit(item)} className="btn-icon" title="تعديل">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                      <span className="btn-icon-label">تعديل</span>
                    </button>
                    {item.status === 0 && item.pdfUrl && (
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

      {/* ── PDF Upload Modal ───────────────────────────────────────────────── */}
      {uploadTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '460px', padding: '2rem', direction: 'rtl' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--accent-gold)', fontSize: '1.1rem' }}>ملف PDF — {uploadTarget.title}</h3>
              <button onClick={() => setUploadTarget(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ padding: '1.25rem', borderRadius: 'var(--radius-sm)', background: 'var(--surface-1)', border: '1px solid var(--glass-border)', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--c-red)' }}>picture_as_pdf</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>ملف المنهج</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {uploadTarget.pdfUrl
                      ? `${uploadTarget.pdfFileName}  ·  ${fmt(uploadTarget.pdfSizeBytes) || ''}`
                      : 'لم يُرفع ملف PDF بعد'}
                  </div>
                </div>
                {uploadTarget.pdfUrl && (
                  <a href={`${BACKEND_URL}${uploadTarget.pdfUrl}`} target="_blank" rel="noopener noreferrer"
                    style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--c-blue)', textDecoration: 'none' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                    معاينة
                  </a>
                )}
              </div>
              <button onClick={() => replaceRef.current.click()} disabled={uploading}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(248,113,113,0.35)', background: 'rgba(248,113,113,0.1)', color: 'var(--c-red)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload</span>
                {uploading ? 'جاري الرفع...' : uploadTarget.pdfUrl ? 'استبدال الملف' : 'رفع ملف PDF'}
              </button>
            </div>

            <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setUploadTarget(null)}>إغلاق</button>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ────────────────────────────────────────────── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '2rem', direction: 'rtl' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              {editing ? 'تعديل بيانات المنهج' : 'إضافة منهج جديد'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={lbl}>عنوان المنهج *</label>
                <input className="premium-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثال: منهج مادة الألحان القبطية" />
              </div>
              <div>
                <label style={lbl}>الوصف</label>
                <textarea className="premium-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} style={{ resize: 'vertical' }} placeholder="وصف اختياري..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={lbl}>المادة *</label>
                  <select className="premium-input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
                    {SUBJECT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>المرحلة الدراسية *</label>
                  <select className="premium-input" value={form.stageId} onChange={handleStageChange}>
                    <option value="">اختر المرحلة</option>
                    {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={lbl}>العام الدراسي *</label>
                <input className="premium-input" value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })} placeholder="2024/2025" />
              </div>

              {/* Grade picker — only appears when stage has sub-grades */}
              {selectedStageHasGrades && (
                <div>
                  <label style={lbl}>السنة الدراسية *</label>
                  <select
                    className="premium-input"
                    value={form.gradeId}
                    onChange={e => setForm({ ...form, gradeId: e.target.value })}
                    style={{ borderColor: !form.gradeId ? 'rgba(251,191,36,0.6)' : undefined }}
                  >
                    <option value="">— اختر السنة الدراسية —</option>
                    {gradesForSelectedStage.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={lbl}>ملف PDF {editing?.pdfUrl ? '(استبدال الحالي)' : '(اختياري)'}</label>
                <button type="button" onClick={() => modalFileRef.current.click()}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', borderRadius: 'var(--radius-sm)', border: `1px dashed ${pendingFile ? 'var(--success)' : 'var(--glass-border)'}`, background: 'var(--input-bg)', color: pendingFile ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: pendingFile ? 'var(--success)' : 'var(--c-red)' }}>upload_file</span>
                  <span style={{ flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pendingFile ? pendingFile.name : (editing?.pdfFileName || 'انقر لاختيار ملف PDF...')}
                  </span>
                  {pendingFile && (
                    <span onClick={e => { e.stopPropagation(); setPendingFile(null); modalFileRef.current.value = ''; }}
                      style={{ color: 'var(--danger)', fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}>✕</span>
                  )}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={submit}>{editing ? 'حفظ التعديلات' : 'إنشاء المنهج'}</button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const lbl = { fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' };
