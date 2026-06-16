import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import Layout from '../Layout';
import apiClient from '../apiClient';

const ExamResultsScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const printRef = useRef();
  const [result, setResult] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!result);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!result) {
      const fetch = async () => {
        try {
          const res = await apiClient.get(`/exam/${id}/results`);
          setResult(res.data);
        } catch {
          setError('لا توجد نتيجة متاحة');
        } finally {
          setLoading(false);
        }
      };
      fetch();
    }
  }, [id, result]);

  const handlePrint = () => {
    const w = window.open('', '_blank');
    const answersList = result.answers || [];
    w.document.write(`
      <html dir="rtl"><head><meta charset="utf-8"><title>نتيجة الامتحان</title>
      <style>body{font-family:system-ui;padding:2rem;line-height:1.6;color:#1e293b}
      h1{color:#b8860b;margin-bottom:0.5rem}
      .score{text-align:center;padding:2rem;background:#f8f9fa;border-radius:12px}
      .score-num{font-size:3rem;font-weight:700;color:#b8860b}
      .q{padding:1rem 0;border-bottom:1px solid #eee}</style></head><body>
      <div style="text-align:center;margin-bottom:2rem"><h1>${result.title}</h1><p>تاريخ التقديم: ${new Date().toLocaleDateString('ar-EG')}</p></div>
      <div class="score"><div>النتيجة النهائية</div><div class="score-num">${result.score}/${result.totalPoints}</div><div>(${result.percentage}%) - ${result.passed ? 'ناجح' : 'راسب'}</div></div>
      <div style="margin-top:2rem">${answersList.map((q, i) => `<div class="q"><div style="font-weight:600">${i+1}. ${q.questionText} <span style="float:left;color:#999;font-weight:400">${q.pointsPossible} نقطة</span></div>
        ${q.type === 'MultipleChoice' ? `<div style="margin-top:0.3rem">إجابتك: ${q.options[q.userAnswer] || '—'}</div><div style="color:${q.isCorrect ? '#10b981' : '#ef4444'}">${q.isCorrect ? '✓ صحيح' : '✗ خطأ'}</div>` : `<div style="margin-top:0.3rem">إجابتك: ${q.userAnswer || '—'}</div>`}</div>`).join('')}</div>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  if (loading) return <Layout title="نتيجة الامتحان"><p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p></Layout>;

  if (error || !result) {
    return (
      <Layout title="نتيجة الامتحان">
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>error</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>{error || 'لا توجد بيانات للعرض'}</p>
          <button onClick={() => navigate(`/exams/${id}`)} className="btn-primary" style={{ marginTop: '1rem' }}>العودة للامتحان</button>
        </div>
      </Layout>
    );
  }

  const answers = result.answers || [];
  const mcCount = answers.filter(q => q.type === 'MultipleChoice').length;
  const correctCount = answers.filter(q => q.isCorrect).length;

  return (
    <Layout title="نتيجة الامتحان">
      <div ref={printRef} style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>النتيجة النهائية</div>
          <div style={{ fontSize: '3.5rem', fontWeight: 700, color: result.passed ? '#10b981' : '#ef4444' }}>{result.score}<span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/{result.totalPoints}</span></div>
          <div style={{ fontSize: '0.9rem', marginTop: '0.3rem', color: result.passed ? '#10b981' : '#ef4444', fontWeight: 600 }}>{result.percentage}% — {result.passed ? 'ناجح' : 'راسب'}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{correctCount}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجابات صحيحة</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{mcCount - correctCount}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجابات خاطئة</div>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--accent-gold)', fontSize: '0.95rem', marginBottom: '1rem' }}>مراجعة الإجابات</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {answers.map((q, i) => (
              <div key={q.questionId} style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>{i + 1}.</span>
                    {q.questionText}
                  </div>
                  <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>{q.pointsPossible} نقطة</span>
                </div>
                {q.type === 'MultipleChoice' ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجابتك:</span>
                    <span style={{ fontWeight: 600 }}>{q.options[q.userAnswer] || 'لم يجب'}</span>
                    {q.isCorrect ? (
                      <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: '20px' }}>check_circle</span>
                    ) : (
                      <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '20px' }}>cancel</span>
                    )}
                  </div>
                ) : (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجابتك:</div>
                    <div style={{ padding: '0.5rem', background: 'rgba(251,191,36,0.08)', borderRadius: 'var(--radius-sm)', marginTop: '0.3rem', fontSize: '0.85rem' }}>{q.userAnswer || 'لم يجب'}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
          <button onClick={() => navigate(`/exams/${id}`)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 1.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
            إعادة الامتحان
          </button>
          <button onClick={handlePrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 1.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
            طباعة
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default ExamResultsScreen;
