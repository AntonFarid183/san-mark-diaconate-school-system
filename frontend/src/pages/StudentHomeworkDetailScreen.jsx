import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';
import { BACKEND_URL as BASE } from '../config';

const OPTION_LABELS = ['أ', 'ب', 'ج', 'د'];

export default function StudentHomeworkDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [homework, setHomework] = useState(null);
  usePageTitle(homework?.title || 'الواجب');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({}); // questionId -> selectedOption
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

  const allAnswered = homework && homework.questions.every(q => answers[q.id] !== undefined);
  const answeredCount = homework ? homework.questions.filter(q => answers[q.id] !== undefined).length : 0;

  const submit = async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    try {
      const res = await apiClient.post(`/homework/my/${id}/submit`, {
        answers: homework.questions.map(q => ({ questionId: q.id, selectedOption: answers[q.id] })),
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
        </div>
      )}

      {/* Split panel: material left, bubble sheet right (sticky) */}
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
                    {OPTION_LABELS.map((label, i) => {
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
    </>
  );
}
