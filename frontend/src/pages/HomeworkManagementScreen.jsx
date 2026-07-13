import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../apiClient';
import Layout from '../Layout';

const STATUS_LABELS = {
  draft: { label: 'مسودة', color: 'var(--text-muted)' },
  published: { label: 'منشور', color: 'var(--success)' },
  archived: { label: 'مؤرشف', color: 'var(--text-muted)' },
};

const OPTION_LABELS = ['أ', 'ب', 'ج', 'د'];

const emptyForm = {
  title: '', subjectId: '', stageId: '', gradeId: '',
  materialType: 'pdf', materialUrl: '', materialFileName: '',
  allowDownload: false, totalMarks: 10,
  questionCount: 5,
  answerKey: Array(5).fill(0),
};

export default function HomeworkManagementScreen() {
  const [searchParams] = useSearchParams();

  const [homeworks, setHomeworks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const [filterStageId, setFilterStageId] = useState(searchParams.get('stageId') || '');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formGrades, setFormGrades] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Manual grade entry
  const [gradingHomework, setGradingHomework] = useState(null);
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [scoreInputs, setScoreInputs] = useState({});
  const [savingGrades, setSavingGrades] = useState(false);

  useEffect(() => {
    apiClient.get('/homework/subjects').then(r => setSubjects(r.data)).catch(() => {});
    apiClient.get('/students/stages').then(r => setStages(r.data)).catch(() => {});
    load();
  }, []);

  useEffect(() => { load(); }, [filterStageId]);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStageId) params.stageId = filterStageId;
      const r = await apiClient.get('/homework', { params });
      setHomeworks(r.data);
    } catch {
      setMsg({ type: 'error', text: 'فشل تحميل الواجبات.' });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm(emptyForm);
    setFormGrades([]);
    setShowForm(true);
  };

  const onFormStageChange = (stageId) => {
    setForm(f => ({ ...f, stageId, gradeId: '' }));
    if (stageId) apiClient.get(`/students/grades/${stageId}`).then(r => setFormGrades(r.data)).catch(() => setFormGrades([]));
    else setFormGrades([]);
  };

  const uploadMaterial = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.post('/file/upload?category=homework', fd, { headers: { 'Content-Type': undefined } });
      setForm(f => ({ ...f, materialUrl: res.data.url, materialFileName: file.name }));
    } catch {
      setMsg({ type: 'error', text: 'فشل رفع الملف.' });
    } finally {
      setUploading(false);
    }
  };

  const setQuestionCount = (count) => {
    const n = Math.max(1, Math.min(100, Number(count) || 1));
    setForm(f => {
      const key = [...f.answerKey];
      if (n > key.length) while (key.length < n) key.push(0);
      else key.length = n;
      return { ...f, questionCount: n, answerKey: key };
    });
  };

  const setAnswer = (idx, option) => {
    setForm(f => ({ ...f, answerKey: f.answerKey.map((v, i) => i === idx ? option : v) }));
  };

  const isFormValid = () => {
    if (!form.title.trim() || !form.subjectId || !form.stageId || !form.gradeId || !form.materialUrl) return false;
    if (form.totalMarks <= 0) return false;
    return form.answerKey.length > 0;
  };

  const submitCreate = async () => {
    if (!isFormValid()) return;
    setSaving(true);
    try {
      await apiClient.post('/homework', {
        title: form.title.trim(),
        subjectId: form.subjectId,
        stageId: form.stageId,
        gradeId: form.gradeId,
        materialType: form.materialType,
        materialUrl: form.materialUrl,
        materialFileName: form.materialFileName,
        allowDownload: form.allowDownload,
        totalMarks: Number(form.totalMarks),
        answerKey: form.answerKey,
      });
      setMsg({ type: 'success', text: 'تم إنشاء الواجب.' });
      setShowForm(false);
      load();
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل إنشاء الواجب.' });
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (hw) => {
    try {
      await apiClient.post(`/homework/${hw.id}/${hw.status === 'published' ? 'unpublish' : 'publish'}`);
      load();
    } catch {
      setMsg({ type: 'error', text: 'فشل تغيير حالة النشر.' });
    }
  };

  const deleteHomework = async (hw) => {
    if (!window.confirm(`حذف الواجب "${hw.title}"؟`)) return;
    try {
      await apiClient.delete(`/homework/${hw.id}`);
      load();
    } catch {
      setMsg({ type: 'error', text: 'فشل الحذف.' });
    }
  };

  const openGrading = async (hw) => {
    setGradingHomework(hw);
    setRosterLoading(true);
    setScoreInputs({});
    try {
      const r = await apiClient.get(`/homework/${hw.id}/roster`);
      setRoster(r.data);
    } catch {
      setMsg({ type: 'error', text: 'فشل تحميل كشف الطلاب.' });
    } finally {
      setRosterLoading(false);
    }
  };

  const saveManualGrades = async () => {
    const grades = Object.entries(scoreInputs)
      .filter(([, v]) => v !== '' && v != null)
      .map(([studentId, score]) => ({ studentId, score: Number(score) }));
    if (grades.length === 0) return;

    setSavingGrades(true);
    try {
      await apiClient.post(`/homework/${gradingHomework.id}/manual-grades`, { grades });
      setMsg({ type: 'success', text: 'تم حفظ الدرجات.' });
      openGrading(gradingHomework);
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل حفظ الدرجات.' });
    } finally {
      setSavingGrades(false);
    }
  };

  return (
    <Layout title="إدارة الواجبات">
      <p style={{ marginBottom: '1.5rem', fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
        ارفع ملف المذاكرة (يحتوي على الأسئلة والاختيارات) وحدد الإجابة الصحيحة لكل سؤال فقط.
      </p>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', borderRadius: 'var(--radius-sm)', background: msg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
          {msg.text}
          <span style={{ cursor: 'pointer' }} onClick={() => setMsg(null)}>✕</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <select className="premium-input" value={filterStageId} onChange={e => setFilterStageId(e.target.value)} style={{ maxWidth: '260px' }}>
          <option value="">كل المراحل</option>
          {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.5rem' }} onClick={openCreate}>+ واجب جديد</button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>جاري التحميل...</p>
      ) : homeworks.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)', display: 'block', marginBottom: '1rem' }}>assignment</span>
          <p style={{ color: 'var(--text-muted)' }}>لا توجد واجبات بعد</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {homeworks.map(hw => {
            const status = STATUS_LABELS[hw.status];
            return (
              <div key={hw.id} className="glass-card" style={{ padding: '1.1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700 }}>{hw.title}</span>
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.6rem', borderRadius: '20px', background: `${status.color}22`, color: status.color, fontWeight: 700 }}>
                      {status.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    {hw.subjectName} — {hw.stageName} / {hw.gradeName} — {hw.questionCount} أسئلة — {hw.totalMarks} درجة
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {hw.status === 'published' && (
                    <button onClick={() => openGrading(hw)} style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid var(--accent-gold)', background: 'rgba(251,191,36,0.08)', color: 'var(--accent-gold)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit' }}>
                      إدخال درجات يدوي
                    </button>
                  )}
                  <button onClick={() => togglePublish(hw)} style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', border: `1px solid ${hw.status === 'published' ? 'var(--text-muted)' : 'var(--success)'}`, background: 'transparent', color: hw.status === 'published' ? 'var(--text-muted)' : 'var(--success)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit' }}>
                    {hw.status === 'published' ? 'إلغاء النشر' : 'نشر'}
                  </button>
                  <button onClick={() => deleteHomework(hw)} style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.4)', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit' }}>
                    حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '2rem' }}>
          <div className="glass-card" style={{ padding: '2rem', width: '640px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', direction: 'rtl' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>واجب جديد</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <input className="premium-input" placeholder="عنوان الواجب" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <select className="premium-input" value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })} style={{ flex: 1, minWidth: '160px' }}>
                  <option value="">اختر المادة</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select className="premium-input" value={form.stageId} onChange={e => onFormStageChange(e.target.value)} style={{ flex: 1, minWidth: '160px' }}>
                  <option value="">اختر المرحلة</option>
                  {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select className="premium-input" value={form.gradeId} onChange={e => setForm({ ...form, gradeId: e.target.value })} style={{ flex: 1, minWidth: '160px' }} disabled={!form.stageId}>
                  <option value="">اختر الصف</option>
                  {formGrades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <select className="premium-input" value={form.materialType} onChange={e => setForm({ ...form, materialType: e.target.value })} style={{ maxWidth: '140px' }}>
                  <option value="pdf">PDF</option>
                  <option value="image">صورة</option>
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{uploading ? 'hourglass_top' : 'upload_file'}</span>
                  {uploading ? 'جاري الرفع...' : form.materialFileName || (form.materialType === 'image' ? 'رفع صورة الواجب' : 'رفع ملف الواجب كـ PDF')}
                  <input type="file" accept={form.materialType === 'pdf' ? '.pdf' : 'image/*'} onChange={e => e.target.files?.[0] && uploadMaterial(e.target.files[0])} style={{ display: 'none' }} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.allowDownload} onChange={e => setForm({ ...form, allowDownload: e.target.checked })} />
                  السماح بالتنزيل
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>الدرجة الكلية</label>
                  <input className="premium-input" type="number" min="1" value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: e.target.value })} style={{ width: '80px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>عدد الأسئلة</label>
                <input className="premium-input" type="number" min="1" max="100" value={form.questionCount} onChange={e => setQuestionCount(e.target.value)} style={{ width: '90px' }} />
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>مفتاح الإجابات</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>حدد الإجابة الصحيحة لكل سؤال كما تظهر في الملف المرفوع.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {form.answerKey.map((correct, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, minWidth: '20px' }}>{idx + 1}.</span>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {OPTION_LABELS.map((label, i) => (
                      <button key={i} type="button" onClick={() => setAnswer(idx, i)} style={{
                        width: '26px', height: '26px', borderRadius: '50%', border: `1px solid ${correct === i ? 'var(--accent-gold)' : 'var(--glass-border)'}`,
                        background: correct === i ? 'var(--accent-gold)' : 'transparent', color: correct === i ? '#1e293b' : 'var(--text-secondary)',
                        cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit',
                      }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-primary" style={{ flex: 1 }} disabled={!isFormValid() || saving} onClick={submitCreate}>
                {saving ? 'جاري الحفظ...' : 'حفظ كمسودة'}
              </button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Manual grade entry modal */}
      {gradingHomework && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '2rem' }} onClick={() => setGradingHomework(null)}>
          <div className="glass-card" style={{ padding: '2rem', width: '560px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto', direction: 'rtl' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ color: 'var(--accent-gold)' }}>إدخال درجات — {gradingHomework.title}</h3>
              <span onClick={() => setGradingHomework(null)} style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}>✕</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              للطلاب الذين لم يسلّموا عبر الموقع (تقييم حضوري). الدرجة الكلية: {gradingHomework.totalMarks}
            </p>

            {rosterLoading ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>جاري التحميل...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {roster.map(item => (
                  <div key={item.studentId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.studentName}</div>
                      {item.hasSubmitted && (
                        <div style={{ fontSize: '0.72rem', color: item.isManualEntry ? 'var(--accent-gold)' : 'var(--success)' }}>
                          {item.isManualEntry ? 'تم إدخالها يدوياً' : 'تم التسليم أونلاين'} — {item.score}/{gradingHomework.totalMarks}
                        </div>
                      )}
                    </div>
                    <input
                      className="premium-input" type="number" min="0" max={gradingHomework.totalMarks} step="0.5"
                      placeholder={item.hasSubmitted ? String(item.score) : '—'}
                      value={scoreInputs[item.studentId] ?? ''}
                      onChange={e => setScoreInputs(s => ({ ...s, [item.studentId]: e.target.value }))}
                      style={{ width: '90px', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                    />
                  </div>
                ))}
                {roster.length === 0 && (
                  <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>لا يوجد طلاب في هذا الصف</p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-primary" style={{ flex: 1 }} disabled={savingGrades} onClick={saveManualGrades}>
                {savingGrades ? 'جاري الحفظ...' : 'حفظ الدرجات'}
              </button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setGradingHomework(null)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
