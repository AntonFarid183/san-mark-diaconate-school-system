import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';
import { BACKEND_URL as BASE } from '../config';

const OPTION_LABELS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي'];

export default function StudentHomeworkDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [homework, setHomework] = useState(null);
  usePageTitle(homework?.title || 'الواجب');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({}); // questionId -> selectedOption (choice questions)
  // questionId -> { text, fileUrl, fileName, uploading, error } (essay questions)
  const [essays, setEssays] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    apiClient.get(`/homework/my/${id}`)
      .then(r => setHomework(r.data))
      .catch(() => setError('تعذّر تحميل الواجب.'))
      .finally(() => setLoading(false));
  }, [id]);

  const selectOption = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const patchEssay = (questionId, patch) => setEssays(prev => ({ ...prev, [questionId]: { ...prev[questionId], ...patch } }));

  // An essay counts as answered once there is some text or an uploaded file.
  const isAnswered = (q) => {
    if (q.kind === 'essay') {
      const e = essays[q.id];
      return !!e && !e.uploading && (!!(e.text && e.text.trim()) || !!e.fileUrl);
    }
    return answers[q.id] !== undefined;
  };

  const uploadEssayFile = async (questionId, file) => {
    patchEssay(questionId, { uploading: true, error: null });
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await apiClient.post('/homework/my/upload-answer', form, { headers: { 'Content-Type': undefined } });
      patchEssay(questionId, { uploading: false, fileUrl: res.data.url, fileName: res.data.fileName || file.name });
    } catch (e) {
      patchEssay(questionId, { uploading: false, error: e.response?.data?.message || 'فشل رفع الملف.' });
    }
  };

  const allAnswered = homework && homework.questions.every(isAnswered);
  const answeredCount = homework ? homework.questions.filter(isAnswered).length : 0;
  const fileHref = (url) => `${BASE}${url}`;
  const isImageUrl = (url) => /\.(jpe?g|png|webp)$/i.test(url || '');

  const submit = async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    try {
      const res = await apiClient.post(`/homework/my/${id}/submit`, {
        answers: homework.questions.map(q => (q.kind === 'essay'
          ? { questionId: q.id, text: essays[q.id]?.text?.trim() || null, fileUrl: essays[q.id]?.fileUrl || null, fileName: essays[q.id]?.fileName || null }
          : { questionId: q.id, selectedOption: answers[q.id] })),
      });
      setResult(res.data);
      const refreshed = await apiClient.get(`/homework/my/${id}`);
      setHomework(refreshed.data);
    } catch (e) {
      setError(e.response?.data?.message || 'فشل تسليم الواجب.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>;
  if (error || !homework) return (
    <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>{error || 'الواجب غير موجود.'}</div>
  );

  return (
    <>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
        العودة
      </button>

      {/* Result banner */}
      {(result || homework.hasSubmitted) && (
        <div style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', textAlign: 'center' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)' }}>
            درجتك: {result?.score ?? homework.score} / {homework.totalMarks}
          </span>
          {homework.hasPendingReview && (
            <p style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--accent-gold)' }}>
              الدرجة مبدئية — تُضاف درجات الأسئلة المقالية بعد أن يصحّحها المدرّس.
            </p>
          )}
        </div>
      )}

      {homework.materialType === 'typed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h2 style={{ color: 'var(--accent-gold)', fontSize: '1.1rem' }}>{homework.title}</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{homework.subjectName}</p>
          </div>

          {homework.questions.map(q => {
            if (q.kind === 'essay') {
              const e = essays[q.id] || {};
              const submitted = homework.hasSubmitted;
              const text = submitted ? q.answerText : e.text;
              const fileUrl = submitted ? q.answerFileUrl : e.fileUrl;
              const fileName = submitted ? q.answerFileName : e.fileName;
              return (
                <div key={q.id} className="glass-card" style={{ padding: '1.25rem' }}>
                  <p style={{ fontWeight: 700, marginBottom: '0.3rem', lineHeight: 1.9 }}>{q.questionNumber}. {q.text}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
                    سؤال مقالي{q.maxMark ? ` — ${q.maxMark} درجة` : ''}
                  </p>

                  {submitted ? (
                    <>
                      {text && <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.9, background: 'var(--surface-2)', padding: '0.7rem 0.9rem', borderRadius: '8px', marginBottom: '0.6rem' }}>{text}</p>}
                      {fileUrl && (
                        <div style={{ marginBottom: '0.6rem' }}>
                          {isImageUrl(fileUrl) && <img src={fileHref(fileUrl)} alt="إجابتك" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'block', marginBottom: '0.4rem' }} />}
                          <a href={fileHref(fileUrl)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-gold)', fontSize: '0.85rem' }}>
                            {isImageUrl(fileUrl) ? 'فتح الصورة' : 'فتح ملف PDF'}{fileName ? ` — ${fileName}` : ''}
                          </a>
                        </div>
                      )}
                      <span style={{
                        display: 'inline-block', padding: '0.25rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700,
                        background: q.essayScore != null ? 'rgba(16,185,129,0.15)' : 'rgba(251,191,36,0.14)',
                        color: q.essayScore != null ? 'var(--success)' : 'var(--accent-gold)',
                      }}>
                        {q.essayScore != null ? `الدرجة: ${q.essayScore} / ${q.maxMark}` : 'بانتظار التصحيح'}
                      </span>
                    </>
                  ) : (
                    <>
                      <textarea
                        className="premium-input" rows={5} placeholder="اكتب إجابتك هنا..."
                        value={e.text || ''} maxLength={5000}
                        onChange={ev => patchEssay(q.id, { text: ev.target.value })}
                        style={{ resize: 'vertical', width: '100%', marginBottom: '0.7rem' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: e.uploading ? 'wait' : 'pointer', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--accent-gold)', color: 'var(--accent-gold)', fontSize: '0.88rem', fontWeight: 600 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{e.uploading ? 'hourglass_top' : 'add_photo_alternate'}</span>
                          {e.uploading ? 'جاري الرفع...' : fileUrl ? 'استبدال الملف' : 'ارفع صورة أو PDF'}
                          <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/*,application/pdf" disabled={e.uploading}
                            onChange={ev => { const f = ev.target.files?.[0]; ev.target.value = ''; if (f) uploadEssayFile(q.id, f); }}
                            style={{ display: 'none' }} />
                        </label>
                        {fileUrl && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--success)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                            {fileName}
                            <button type="button" onClick={() => patchEssay(q.id, { fileUrl: null, fileName: null })} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.95rem' }} aria-label="إزالة الملف">✕</button>
                          </span>
                        )}
                      </div>
                      {fileUrl && isImageUrl(fileUrl) && <img src={fileHref(fileUrl)} alt="معاينة" style={{ marginTop: '0.7rem', maxWidth: '100%', maxHeight: '260px', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />}
                      {e.error && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: '0.5rem' }}>{e.error}</p>}
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        يمكنك الكتابة، أو رفع صورة لإجابتك المكتوبة بخط اليد، أو ملف PDF، أو الجمع بينهما (الحد الأقصى 10 ميغابايت).
                      </p>
                    </>
                  )}
                </div>
              );
            }

            const selected = homework.hasSubmitted ? q.selectedOption : answers[q.id];
            return (
              <div key={q.id} className="glass-card" style={{ padding: '1.25rem' }}>
                <p style={{ fontWeight: 700, marginBottom: '0.9rem', lineHeight: 1.9 }}>{q.questionNumber}. {q.text}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(q.options || []).map((optionText, i) => {
                    const isSelected = selected === i;
                    const isCorrectOption = homework.hasSubmitted && q.correctOption === i;
                    const isWrongSelected = homework.hasSubmitted && isSelected && !isCorrectOption;
                    const color = isCorrectOption ? 'var(--success)' : isWrongSelected ? 'var(--danger)' : isSelected ? 'var(--accent-gold)' : 'var(--glass-border)';
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={homework.hasSubmitted}
                        onClick={() => selectOption(q.id, i)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.7rem', textAlign: 'start', width: '100%',
                          padding: '0.6rem 0.9rem', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: '0.95rem',
                          border: `1px solid ${color}`,
                          background: (isCorrectOption || isWrongSelected || isSelected) ? `color-mix(in srgb, ${color} 16%, transparent)` : 'transparent',
                          color: 'var(--text-primary)', cursor: homework.hasSubmitted ? 'default' : 'pointer',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: isCorrectOption || isWrongSelected || isSelected ? color : 'var(--text-muted)' }}>{OPTION_LABELS[i]}</span>
                        <span style={{ lineHeight: 1.8 }}>{optionText}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {!homework.hasSubmitted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={submit} disabled={!allAnswered || submitting} className="btn-primary" style={{ width: 'auto', padding: '0.6rem 2rem' }}>
                {submitting ? 'جاري التسليم...' : 'تسليم الواجب'}
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{answeredCount}/{homework.questions.length}</span>
            </div>
          )}
        </div>
      )}

      {/* Split panel: material left, bubble sheet right (sticky) */}
      {homework.materialType !== 'typed' && (
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Material viewer */}
        <div className="glass-card" style={{ padding: '1.5rem', flex: '2 1 480px', minWidth: '320px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ color: 'var(--accent-gold)', fontSize: '1.1rem' }}>{homework.title}</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{homework.subjectName}</p>
            </div>
            {homework.allowDownload && (
              <a href={`${BASE}${homework.materialUrl}`} download={homework.materialFileName} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-gold)', fontSize: '0.85rem', textDecoration: 'none' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                تنزيل
              </a>
            )}
          </div>
          {homework.materialType === 'image' ? (
            <img src={`${BASE}${homework.materialUrl}`} alt="مادة الواجب" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
          ) : (
            <iframe src={`${BASE}${homework.materialUrl}`} style={{ width: '100%', height: '80vh', border: '1px solid var(--glass-border)', borderRadius: '8px' }} title="مادة الواجب" />
          )}
        </div>

        {/* Bubble sheet — sticky */}
        <div className="glass-card" style={{ padding: '1.5rem', flex: '1 1 260px', minWidth: '240px', position: 'sticky', top: '1rem', maxHeight: '85vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ورقة الإجابة</h3>
            {!homework.hasSubmitted && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{answeredCount}/{homework.questions.length}</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {homework.questions.map(q => {
              const selected = homework.hasSubmitted ? q.selectedOption : answers[q.id];
              return (
                <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', minWidth: '22px' }}>{q.questionNumber}.</span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {OPTION_LABELS.slice(0, 4).map((label, i) => {
                      const isSelected = selected === i;
                      const isCorrectOption = homework.hasSubmitted && q.correctOption === i;
                      const isWrongSelected = homework.hasSubmitted && isSelected && !isCorrectOption;
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={homework.hasSubmitted}
                          onClick={() => selectOption(q.id, i)}
                          style={{
                            width: '30px', height: '30px', borderRadius: '50%', fontFamily: 'inherit',
                            border: `1px solid ${isCorrectOption ? 'var(--success)' : isWrongSelected ? 'var(--danger)' : isSelected ? 'var(--accent-gold)' : 'var(--glass-border)'}`,
                            background: isCorrectOption ? 'var(--success)' : isWrongSelected ? 'var(--danger)' : isSelected ? 'var(--accent-gold)' : 'transparent',
                            color: (isCorrectOption || isWrongSelected || isSelected) ? '#fff' : 'var(--text-secondary)',
                            cursor: homework.hasSubmitted ? 'default' : 'pointer',
                            fontSize: '0.78rem', fontWeight: 700, transition: 'all 0.15s',
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {!homework.hasSubmitted && (
            <button onClick={submit} disabled={!allAnswered || submitting} className="btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}>
              {submitting ? 'جاري التسليم...' : 'تسليم الواجب'}
            </button>
          )}
        </div>
      </div>
      )}
    </>
  );
}
