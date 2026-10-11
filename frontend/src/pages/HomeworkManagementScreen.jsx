import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';
import { toAbsoluteBackendUrl } from '../config';

const STATUS_LABELS = {
  draft: { label: 'مسودة', color: 'var(--text-muted)' },
  published: { label: 'منشور', color: 'var(--success)' },
  archived: { label: 'مؤرشف', color: 'var(--text-muted)' },
};

const OPTION_LABELS = ['أ', 'ب', 'ج', 'د'];
// Typed questions can have up to 10 choices.
const TYPED_OPTION_LABELS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي'];
const MIN_TYPED_OPTIONS = 2;
const MAX_TYPED_OPTIONS = TYPED_OPTION_LABELS.length;

const emptyTypedQuestion = (kind = 'choice') => ({ kind, text: '', options: Array(MIN_TYPED_OPTIONS).fill(''), correct: 0 });

const emptyForm = {
  title: '', subjectId: '', stageId: '', gradeId: '',
  materialType: 'pdf', materialUrl: '', materialFileName: '',
  allowDownload: false, totalMarks: 10,
  questionCount: 5,
  answerKey: Array(5).fill(0),
  typedQuestions: [emptyTypedQuestion()],
};

export default function HomeworkManagementScreen() {
  usePageTitle('إدارة الواجبات');
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

  // Essay review: the admin reads each student's written/uploaded answer and marks it.
  const [reviewHomework, setReviewHomework] = useState(null);
  const [reviewItems, setReviewItems] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [markInputs, setMarkInputs] = useState({});   // answerId -> typed mark
  const [markingId, setMarkingId] = useState(null);

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
    setForm({ ...emptyForm, answerKey: Array(5).fill(0), typedQuestions: [emptyTypedQuestion()] });
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

  const isTyped = form.materialType === 'typed';

  const updateTypedQuestion = (idx, patch) => {
    setForm(f => ({ ...f, typedQuestions: f.typedQuestions.map((q, i) => i === idx ? { ...q, ...patch } : q) }));
  };

  const updateTypedOption = (idx, optionIdx, value) => {
    setForm(f => ({
      ...f,
      typedQuestions: f.typedQuestions.map((q, i) => i === idx
        ? { ...q, options: q.options.map((o, j) => j === optionIdx ? value : o) }
        : q),
    }));
  };

  const addTypedOption = (idx) => {
    setForm(f => ({
      ...f,
      typedQuestions: f.typedQuestions.map((q, i) => i === idx && q.options.length < MAX_TYPED_OPTIONS
        ? { ...q, options: [...q.options, ''] }
        : q),
    }));
  };

  const removeTypedOption = (idx, optionIdx) => {
    setForm(f => ({
      ...f,
      typedQuestions: f.typedQuestions.map((q, i) => {
        if (i !== idx || q.options.length <= MIN_TYPED_OPTIONS) return q;
        const options = q.options.filter((_, j) => j !== optionIdx);
        // Keep the marked answer pointing at the same text, or fall back to the first choice.
        const correct = q.correct === optionIdx ? 0 : q.correct > optionIdx ? q.correct - 1 : q.correct;
        return { ...q, options, correct };
      }),
    }));
  };

  const addTypedQuestion = (kind = 'choice') => {
    setForm(f => ({ ...f, typedQuestions: [...f.typedQuestions, emptyTypedQuestion(kind)] }));
  };

  const removeTypedQuestion = (idx) => {
    setForm(f => ({ ...f, typedQuestions: f.typedQuestions.filter((_, i) => i !== idx) }));
  };

  // A choice question needs every option filled in; an essay only needs its text.
  const isTypedQuestionComplete = (q) => q.text.trim() && (q.kind === 'essay' || q.options.every(o => o.trim()));

  const isFormValid = () => {
    if (!form.title.trim() || !form.subjectId || !form.stageId || !form.gradeId) return false;
    if (form.totalMarks <= 0) return false;
    if (isTyped) return form.typedQuestions.length > 0 && form.typedQuestions.every(isTypedQuestionComplete);
    return !!form.materialUrl && form.answerKey.length > 0;
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
        totalMarks: Number(form.totalMarks),
        ...(isTyped
          ? {
              questions: form.typedQuestions.map(q => (q.kind === 'essay'
                ? { kind: 'essay', text: q.text.trim(), options: [], correctOption: 0 }
                : { kind: 'choice', text: q.text.trim(), options: q.options.map(o => o.trim()), correctOption: q.correct })),
            }
          : {
              materialUrl: form.materialUrl,
              materialFileName: form.materialFileName,
              allowDownload: form.allowDownload,
              answerKey: form.answerKey,
            }),
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
    if (!window.confirm(`حذف الواجب "${hw.title}"؟\n\nتنبيه: سيتم حذف جميع إجابات الطلاب ودرجاتهم على هذا الواجب نهائيًا ولا يمكن التراجع.`)) return;
    try {
      await apiClient.delete(`/homework/${hw.id}`);
      load();
    } catch {
      setMsg({ type: 'error', text: 'فشل الحذف.' });
    }
  };

  const openEssayReview = async (hw) => {
    setReviewHomework(hw);
    setReviewLoading(true);
    setMarkInputs({});
    try {
      const r = await apiClient.get(`/homework/${hw.id}/essay-review`);
      setReviewItems(r.data);
    } catch {
      setMsg({ type: 'error', text: 'فشل تحميل الإجابات المقالية.' });
    } finally {
      setReviewLoading(false);
    }
  };

  const saveEssayMark = async (answer) => {
    const raw = markInputs[answer.answerId];
    const value = raw === undefined || raw === '' ? null : Number(raw);
    if (value === null || Number.isNaN(value)) return;
    setMarkingId(answer.answerId);
    try {
      const r = await apiClient.post(`/homework/answers/${answer.answerId}/grade`, { score: value });
      setReviewItems(items => items.map(s => ({
        ...s,
        score: s.answers.some(a => a.answerId === answer.answerId) ? r.data.submissionScore : s.score,
        answers: s.answers.map(a => a.answerId === answer.answerId ? { ...a, score: r.data.answerScore } : a),
      })));
      setMarkInputs(m => { const next = { ...m }; delete next[answer.answerId]; return next; });
      load(); // refresh the "waiting" badge on the list
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل حفظ الدرجة.' });
    } finally {
      setMarkingId(null);
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
    <>
      <p style={{ marginBottom: '1.5rem', fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
        ارفع ملف المذاكرة (يحتوي على الأسئلة والاختيارات) وحدد الإجابة الصحيحة لكل سؤال، أو اكتب الأسئلة واختياراتها هنا مباشرة.
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
                    {hw.subjectName} — {hw.stageName} / {hw.gradeName} — {hw.questionCount} أسئلة{hw.essayCount > 0 ? ` (منها ${hw.essayCount} مقالي)` : ''} — {hw.totalMarks} درجة
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {hw.essayCount > 0 && (
                    <button onClick={() => openEssayReview(hw)} style={{ position: 'relative', padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid var(--accent-blue, #3b82f6)', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue, #3b82f6)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit' }}>
                      تصحيح المقالي
                      {hw.pendingEssayCount > 0 && (
                        <span style={{ position: 'absolute', top: '-8px', left: '-8px', minWidth: '20px', height: '20px', padding: '0 5px', borderRadius: '10px', background: 'var(--danger)', color: '#fff', fontSize: '0.7rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          {hw.pendingEssayCount}
                        </span>
                      )}
                    </button>
                  )}
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
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '2rem' }}>
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
                  <option value="typed">كتابة الأسئلة</option>
                </select>
                {!isTyped && (
                  <>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{uploading ? 'hourglass_top' : 'upload_file'}</span>
                      {uploading ? 'جاري الرفع...' : form.materialFileName || (form.materialType === 'image' ? 'رفع صورة الواجب' : 'رفع ملف الواجب كـ PDF')}
                      <input type="file" accept={form.materialType === 'pdf' ? '.pdf' : 'image/*'} onChange={e => e.target.files?.[0] && uploadMaterial(e.target.files[0])} style={{ display: 'none' }} />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.allowDownload} onChange={e => setForm({ ...form, allowDownload: e.target.checked })} />
                      السماح بالتنزيل
                    </label>
                  </>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>الدرجة الكلية</label>
                  <input className="premium-input" type="number" min="1" value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: e.target.value })} style={{ width: '80px' }} />
                </div>
              </div>

              {!isTyped && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>عدد الأسئلة</label>
                  <input className="premium-input" type="number" min="1" max="100" value={form.questionCount} onChange={e => setQuestionCount(e.target.value)} style={{ width: '90px' }} />
                </div>
              )}
            </div>

            {isTyped ? (
              <>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>الأسئلة</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>اكتب كل سؤال مع اختياراته (اختياران على الأقل، ويمكنك إضافة المزيد)، ثم اضغط على الحرف الذي يمثل الإجابة الصحيحة.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                  {form.typedQuestions.map((q, idx) => (
                    <div key={idx} style={{ padding: '0.9rem', borderRadius: 'var(--radius-sm)', background: 'var(--surface-1)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', fontWeight: 700 }}>سؤال {idx + 1}</span>
                        {form.typedQuestions.length > 1 && (
                          <button type="button" onClick={() => removeTypedQuestion(idx)} style={{ marginInlineStart: 'auto', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>
                            حذف السؤال
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[['choice', 'اختيار من متعدد', 'checklist'], ['essay', 'مقالي', 'edit_note']].map(([kind, label, icon]) => (
                          <button key={kind} type="button" onClick={() => updateTypedQuestion(idx, { kind })} aria-pressed={q.kind === kind} style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.45rem',
                            borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600,
                            border: `1px solid ${q.kind === kind ? 'var(--accent-gold)' : 'var(--glass-border)'}`,
                            background: q.kind === kind ? 'rgba(251,191,36,0.14)' : 'transparent',
                            color: q.kind === kind ? 'var(--accent-gold)' : 'var(--text-secondary)',
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
                            {label}
                          </button>
                        ))}
                      </div>
                      <textarea className="premium-input" rows={2} placeholder="نص السؤال" value={q.text} onChange={e => updateTypedQuestion(idx, { text: e.target.value })} style={{ resize: 'vertical' }} />
                      {q.kind === 'essay' && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.8, margin: 0 }}>
                          سؤال مقالي: لا توجد اختيارات. يجيب الطالب بالكتابة أو برفع صورة مكتوبة بخط اليد أو ملف PDF (أو بأكثر من طريقة)، وتصحّحه أنت وتضع له الدرجة.
                        </p>
                      )}
                      {q.kind !== 'essay' && q.options.map((_, i) => {
                        const label = TYPED_OPTION_LABELS[i];
                        return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button type="button" aria-label={`الإجابة الصحيحة ${label}`} onClick={() => updateTypedQuestion(idx, { correct: i })} style={{
                            width: '28px', height: '28px', flexShrink: 0, borderRadius: '50%', border: `1px solid ${q.correct === i ? 'var(--accent-gold)' : 'var(--glass-border)'}`,
                            background: q.correct === i ? 'var(--accent-gold)' : 'transparent', color: q.correct === i ? 'var(--on-accent)' : 'var(--text-secondary)',
                            cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, fontFamily: 'inherit',
                          }}>
                            {label}
                          </button>
                          <input className="premium-input" placeholder={`الاختيار ${label}`} value={q.options[i]} onChange={e => updateTypedOption(idx, i, e.target.value)} />
                          {q.options.length > MIN_TYPED_OPTIONS && (
                            <button type="button" aria-label={`حذف الاختيار ${label}`} onClick={() => removeTypedOption(idx, i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem', padding: '0 0.3rem' }}>✕</button>
                          )}
                        </div>
                        );
                      })}
                      {q.kind !== 'essay' && q.options.length < MAX_TYPED_OPTIONS && (
                        <button type="button" onClick={() => addTypedOption(idx)} style={{ alignSelf: 'flex-start', background: 'none', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.3rem 0.9rem', fontSize: '0.82rem', fontFamily: 'inherit' }}>
                          + إضافة اختيار
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem' }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => addTypedQuestion('choice')}>
                    + سؤال اختيارات
                  </button>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => addTypedQuestion('essay')}>
                    + سؤال مقالي
                  </button>
                </div>
              </>
            ) : (
              <>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>مفتاح الإجابات</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>حدد الإجابة الصحيحة لكل سؤال كما تظهر في الملف المرفوع.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {form.answerKey.map((correct, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--surface-1)', border: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, minWidth: '20px' }}>{idx + 1}.</span>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    {OPTION_LABELS.map((label, i) => (
                      <button key={i} type="button" onClick={() => setAnswer(idx, i)} style={{
                        width: '26px', height: '26px', borderRadius: '50%', border: `1px solid ${correct === i ? 'var(--accent-gold)' : 'var(--glass-border)'}`,
                        background: correct === i ? 'var(--accent-gold)' : 'transparent', color: correct === i ? 'var(--on-accent)' : 'var(--text-secondary)',
                        cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit',
                      }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-primary" style={{ flex: 1 }} disabled={!isFormValid() || saving} onClick={submitCreate}>
                {saving ? 'جاري الحفظ...' : 'حفظ كمسودة'}
              </button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Essay review modal */}
      {reviewHomework && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '2rem' }} onClick={() => setReviewHomework(null)}>
          <div className="glass-card" style={{ padding: '1.75rem', width: '760px', maxWidth: '96vw', maxHeight: '88vh', overflowY: 'auto', direction: 'rtl' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <h3 style={{ color: 'var(--accent-gold)' }}>تصحيح المقالي — {reviewHomework.title}</h3>
              <span onClick={() => setReviewHomework(null)} style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}>✕</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              ضع درجة لكل إجابة (من 0 إلى قيمة السؤال). تُضاف إلى درجة الطالب تلقائيًا.
            </p>

            {reviewLoading ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>جاري التحميل...</p>
            ) : reviewItems.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>لم يسلّم أي طالب إجابات مقالية بعد.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviewItems.map(sub => (
                  <div key={sub.submissionId} style={{ border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '1rem', background: 'var(--surface-1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      <strong>{sub.studentName} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.78rem' }}>({sub.studentCode})</span></strong>
                      <span style={{ fontSize: '0.82rem', color: 'var(--accent-gold)', fontWeight: 700 }}>الدرجة الحالية: {sub.score} / {reviewHomework.totalMarks}</span>
                    </div>
                    {sub.answers.map(a => {
                      const isImage = /\.(jpe?g|png|webp)$/i.test(a.fileUrl || '');
                      const typed = markInputs[a.answerId];
                      return (
                        <div key={a.answerId} style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                          <p style={{ fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.8 }}>سؤال {a.questionNumber}: {a.questionText}</p>
                          {a.text && <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9, background: 'var(--surface-2)', padding: '0.6rem 0.8rem', borderRadius: '8px', marginBottom: '0.5rem' }}>{a.text}</p>}
                          {a.fileUrl && (
                            <div style={{ marginBottom: '0.5rem' }}>
                              {isImage && (
                                <a href={toAbsoluteBackendUrl(a.fileUrl)} target="_blank" rel="noopener noreferrer">
                                  <img src={toAbsoluteBackendUrl(a.fileUrl)} alt="إجابة الطالب" style={{ maxWidth: '100%', maxHeight: '320px', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'block', marginBottom: '0.4rem' }} />
                                </a>
                              )}
                              <a href={toAbsoluteBackendUrl(a.fileUrl)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-gold)', fontSize: '0.85rem' }}>
                                {isImage ? 'فتح الصورة' : 'فتح ملف PDF'}{a.fileName ? ` — ${a.fileName}` : ''}
                              </a>
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>الدرجة (من {a.maxMark})</label>
                            <input
                              className="premium-input" type="number" min="0" max={a.maxMark} step="0.25"
                              placeholder={a.score != null ? String(a.score) : '—'}
                              value={typed ?? ''}
                              onChange={e => setMarkInputs(m => ({ ...m, [a.answerId]: e.target.value }))}
                              style={{ width: '100px', padding: '0.35rem 0.5rem' }}
                            />
                            <button className="btn-primary" style={{ width: 'auto', padding: '0.4rem 1.1rem', fontSize: '0.82rem' }} disabled={typed === undefined || typed === '' || markingId === a.answerId} onClick={() => saveEssayMark(a)}>
                              {markingId === a.answerId ? 'جاري الحفظ...' : 'حفظ الدرجة'}
                            </button>
                            {a.score != null && typed === undefined && (
                              <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>✓ تم التصحيح: {a.score}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual grade entry modal */}
      {gradingHomework && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '2rem' }} onClick={() => setGradingHomework(null)}>
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
                  <div key={item.studentId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'var(--surface-1)' }}>
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
    </>
  );
}
