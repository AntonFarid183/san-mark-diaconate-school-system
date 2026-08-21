import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';

const ExamTakingScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get(`/exam/${id}`);
        setExam(res.data);
        setTimeLeft(res.data.durationMinutes * 60);
      } catch {
        setError('فشل تحميل الامتحان');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  useEffect(() => {
    if (!exam || submitted || loading) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(t);
  }, [exam, submitted, loading, timeLeft]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const handleAnswer = (qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = useCallback(async () => {
    if (submitted || !exam) return;
    setSubmitted(true);
    try {
      const res = await apiClient.post(`/exam/${id}/submit`, { answers });
      navigate(`/exams/${id}/results`, { state: { result: res.data } });
    } catch {
      navigate(`/exams/${id}/results`, { state: { exam, answers } });
    }
  }, [submitted, exam, id, navigate, answers]);

  const handleFlagQuestion = (qId) => {
    setAnswers(prev => ({ ...prev, [qId]: prev[qId] === undefined ? 'FLAGGED' : undefined }));
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--surface)' }}><p>جاري التحميل...</p></div>;
  if (error) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--surface)', color: 'var(--danger)' }}><p>{error}</p></div>;
  if (!exam) return null;

  const questions = exam.questions || [];
  const q = questions[currentQuestion];
  const answeredCount = questions.filter(q => answers[q.id] && answers[q.id] !== 'FLAGGED').length;
  const flaggedCount = questions.filter(q => answers[q.id] === 'FLAGGED').length;
  const timerColor = timeLeft < 300 ? 'var(--danger)' : timeLeft < 600 ? 'var(--accent-gold)' : '#fff';

  if (submitted) return null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.5rem', background: 'var(--glass-card-bg)', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--accent-gold)' }}>assignment</span>
          <span style={{ fontWeight: 600 }}>{exam.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>تمت الإجابة: {answeredCount}/{questions.length}</span>
          {flaggedCount > 0 && <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>{flaggedCount} معلّم</span>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: timerColor }}>timer</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: timerColor }}>{formatTime(timeLeft)}</span>
          </div>
          <button onClick={handleSubmit} className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 1.2rem' }}>تسليم</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: '180px', padding: '1rem', borderLeft: '1px solid var(--glass-border)', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>لوحة الأسئلة</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
            {questions.map((question, i) => {
              const ans = answers[question.id];
              let bg = 'var(--surface-3)';
              let color = 'var(--text-secondary)';
              if (ans === 'FLAGGED') { bg = 'rgba(251,191,36,0.2)'; color = 'var(--accent-gold)'; }
              else if (ans !== undefined) { bg = 'rgba(16,185,129,0.2)'; color = 'var(--success)'; }
              return (
                <button key={question.id} onClick={() => setCurrentQuestion(i)} style={{
                  width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                  background: currentQuestion === i ? 'var(--accent-gold)' : bg,
                  color: currentQuestion === i ? 'var(--on-accent)' : color,
                  fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
                }}>{i + 1}</button>
              );
            })}
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(16,185,129,0.3)' }} /> تمت الإجابة
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(251,191,36,0.3)' }} /> معلَّم
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--surface-3)' }} /> لم تجب
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>السؤال {currentQuestion + 1} من {questions.length}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => handleFlagQuestion(q.id)} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: answers[q.id] === 'FLAGGED' ? 'var(--accent-gold)' : '#fff' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>flag</span>
                {answers[q.id] === 'FLAGGED' ? 'إزالة العلم' : 'علم للسؤال'}
              </button>
              <span className="badge" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--c-blue)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem' }}>
                {q.points} نقطة
              </span>
            </div>
          </div>

          <h3 style={{ fontSize: '1.05rem', marginBottom: '1.5rem' }}>{q.text}</h3>

          {q.type === 'MultipleChoice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {q.options.map((opt, i) => (
                <label key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  background: answers[q.id] === i ? 'rgba(251,191,36,0.1)' : 'var(--surface-1)',
                  border: answers[q.id] === i ? '1px solid rgba(251,191,36,0.3)' : '1px solid var(--glass-border)',
                }}>
                  <input type="radio" name={`q_${q.id}`} checked={answers[q.id] === i} onChange={() => handleAnswer(q.id, i)}
                    style={{ accentColor: 'var(--accent-gold)' }} />
                  <span style={{ fontSize: '0.95rem' }}>{opt}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === 'Essay' && (
            <textarea value={answers[q.id] || ''} onChange={e => handleAnswer(q.id, e.target.value)}
              className="premium-input" style={{ minHeight: '200px', width: '100%' }} placeholder="اكتب إجابتك هنا..." />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))} disabled={currentQuestion === 0}
              className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 1.2rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
              السابق
            </button>
            {currentQuestion < questions.length - 1 ? (
              <button onClick={() => setCurrentQuestion(prev => prev + 1)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 1.2rem' }}>
                التالي
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
              </button>
            ) : (
              <button onClick={handleSubmit} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 1.2rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span>
                تسليم الإجابات
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamTakingScreen;
