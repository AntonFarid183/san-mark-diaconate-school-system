import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import Layout from '../Layout';

const PERIODS = [
  { value: 0, label: 'منتصف الفصل' },
  { value: 1, label: 'نهاية الفصل' },
  { value: 2, label: 'مكمل' },
];

const STATUS_LABEL = { 0: 'معلق', 1: 'مقبول', 2: 'مرفوض' };
const STATUS_COLOR = { 0: 'var(--warning)', 1: 'var(--success)', 2: 'var(--danger)' };

const ExamScoreEntryScreen = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [showEnterScore, setShowEnterScore] = useState(false);
  const [stages, setStages] = useState([]);
  const [grades, setGrades] = useState([]);
  const [msg, setMsg] = useState(null);

  const [examForm, setExamForm] = useState({ title: '', description: '', gradeId: '', stageId: '' });
  const [scoreForm, setScoreForm] = useState({ studentCode: '', score: '', totalScore: '100', period: 0, academicYear: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1), notes: '' });

  useEffect(() => {
    fetchExams();
    fetchStages();
  }, []);

  const fetchExams = async () => {
    setLoadingExams(true);
    try {
      const r = await apiClient.get('/exam');
      setExams(r.data);
    } catch { /* ignore */ } finally { setLoadingExams(false); }
  };

  const fetchStages = async () => {
    try {
      const r = await apiClient.get('/students/stages');
      setStages(r.data);
    } catch { /* ignore */ }
  };

  const fetchGrades = async (stageId) => {
    try {
      const r = await apiClient.get(`/students/grades/${stageId}`);
      setGrades(r.data);
    } catch { setGrades([]); }
  };

  const loadResults = async (exam) => {
    setSelectedExam(exam);
    setLoadingResults(true);
    try {
      const r = await apiClient.get(`/exam/${exam.id}/results`);
      setResults(r.data);
    } catch { setResults([]); } finally { setLoadingResults(false); }
  };

  const createExam = async () => {
    try {
      await apiClient.post('/exam', examForm);
      setMsg({ type: 'success', text: 'تم إنشاء الامتحان.' });
      setShowCreateExam(false);
      setExamForm({ title: '', description: '', gradeId: '', stageId: '' });
      fetchExams();
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل إنشاء الامتحان.' });
    }
  };

  const enterScore = async () => {
    if (!selectedExam) return;
    try {
      await apiClient.post(`/exam/${selectedExam.id}/results`, { ...scoreForm, score: parseFloat(scoreForm.score), totalScore: parseFloat(scoreForm.totalScore), period: parseInt(scoreForm.period) });
      setMsg({ type: 'success', text: 'تم تسجيل الدرجة.' });
      setShowEnterScore(false);
      setScoreForm({ studentCode: '', score: '', totalScore: '100', period: 0, academicYear: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1), notes: '' });
      loadResults(selectedExam);
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل تسجيل الدرجة.' });
    }
  };

  const approveResult = async (resultId, approved) => {
    try {
      await apiClient.put(`/exam/results/${resultId}/approve`, { isApproved: approved, notes: '' });
      setMsg({ type: 'success', text: approved ? 'تم الاعتماد.' : 'تم الرفض.' });
      if (selectedExam) loadResults(selectedExam);
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل العملية.' });
    }
  };

  const pct = (score, total) => total > 0 ? Math.round((score / total) * 100) : 0;
  const classify = (p) => {
    if (p >= 90) return 'امتياز';
    if (p >= 80) return 'جيد جداً';
    if (p >= 70) return 'جيد';
    if (p >= 60) return 'مقبول';
    return 'راسب';
  };

  return (
    <Layout title="إدارة الامتحانات">
      {msg && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 'var(--radius-sm)', background: msg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
          {msg.text}
          <span style={{ cursor: 'pointer' }} onClick={() => setMsg(null)}>✕</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
        {/* Exam list */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--accent-gold)' }}>الامتحانات</h3>
            <button className="btn-primary" style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} onClick={() => setShowCreateExam(true)}>+ إضافة</button>
          </div>

          {loadingExams ? <p>جاري التحميل...</p> : exams.length === 0 ? (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد امتحانات</div>
          ) : exams.map(e => (
            <div key={e.id} className="glass-card" onClick={() => loadResults(e)}
              style={{ padding: '1rem', marginBottom: '0.75rem', cursor: 'pointer', border: selectedExam?.id === e.id ? '1px solid var(--accent-gold)' : '1px solid var(--glass-border)' }}>
              <div style={{ fontWeight: 600 }}>{e.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{e.gradeName} — {e.stageName}</div>
            </div>
          ))}
        </div>

        {/* Results panel */}
        <div>
          {!selectedExam ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>assignment</span>
              <p style={{ marginTop: '1rem' }}>اختر امتحاناً من القائمة لعرض النتائج</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--accent-gold)' }}>نتائج: {selectedExam.title}</h3>
                <button className="btn-primary" style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} onClick={() => setShowEnterScore(true)}>+ تسجيل درجة</button>
              </div>

              {loadingResults ? <p>جاري التحميل...</p> : results.length === 0 ? (
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد نتائج مسجلة</div>
              ) : (
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)' }}>
                        {['الطالب', 'الدرجة', '%', 'التقدير', 'الحالة', 'إجراء'].map(h => (
                          <th key={h} style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map(r => {
                        const p = pct(r.score, r.totalScore);
                        return (
                          <tr key={r.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                            <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{r.studentName}</td>
                            <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{r.score}/{r.totalScore}</td>
                            <td style={{ padding: '0.75rem', fontSize: '0.9rem', color: p >= 60 ? 'var(--success)' : 'var(--danger)' }}>{p}%</td>
                            <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{classify(p)}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '20px', background: `${STATUS_COLOR[r.status]}22`, color: STATUS_COLOR[r.status] }}>{STATUS_LABEL[r.status]}</span>
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              {r.status === 0 && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button onClick={() => approveResult(r.id, true)} style={{ background: 'none', border: '1px solid var(--success)', color: 'var(--success)', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}>اعتماد</button>
                                  <button onClick={() => approveResult(r.id, false)} style={{ background: 'none', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}>رفض</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Exam Modal */}
      {showCreateExam && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-card" style={{ padding: '2rem', width: '480px', direction: 'rtl' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>إنشاء امتحان جديد</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input className="input-field" placeholder="عنوان الامتحان" value={examForm.title} onChange={e => setExamForm({ ...examForm, title: e.target.value })} />
              <textarea className="input-field" placeholder="وصف (اختياري)" value={examForm.description} onChange={e => setExamForm({ ...examForm, description: e.target.value })} rows={2} style={{ resize: 'vertical' }} />
              <select className="input-field" value={examForm.stageId} onChange={e => { setExamForm({ ...examForm, stageId: e.target.value, gradeId: '' }); fetchGrades(e.target.value); }}>
                <option value="">اختر المرحلة</option>
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select className="input-field" value={examForm.gradeId} onChange={e => setExamForm({ ...examForm, gradeId: e.target.value })}>
                <option value="">اختر السنة الدراسية</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={createExam} disabled={!examForm.title || !examForm.gradeId}>إنشاء</button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreateExam(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Enter Score Modal */}
      {showEnterScore && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-card" style={{ padding: '2rem', width: '480px', direction: 'rtl' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>تسجيل درجة</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input className="input-field" placeholder="كود الطالب" value={scoreForm.studentCode} onChange={e => setScoreForm({ ...scoreForm, studentCode: e.target.value })} />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input className="input-field" placeholder="الدرجة" type="number" min="0" value={scoreForm.score} onChange={e => setScoreForm({ ...scoreForm, score: e.target.value })} style={{ flex: 1 }} />
                <input className="input-field" placeholder="من" type="number" min="1" value={scoreForm.totalScore} onChange={e => setScoreForm({ ...scoreForm, totalScore: e.target.value })} style={{ flex: 1 }} />
              </div>
              <select className="input-field" value={scoreForm.period} onChange={e => setScoreForm({ ...scoreForm, period: parseInt(e.target.value) })}>
                {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <input className="input-field" placeholder="العام الدراسي (مثال: 2024/2025)" value={scoreForm.academicYear} onChange={e => setScoreForm({ ...scoreForm, academicYear: e.target.value })} />
              <textarea className="input-field" placeholder="ملاحظات (اختياري)" value={scoreForm.notes} onChange={e => setScoreForm({ ...scoreForm, notes: e.target.value })} rows={2} style={{ resize: 'vertical' }} />
            </div>
            {scoreForm.score && scoreForm.totalScore && (
              <div style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.9rem' }}>
                النسبة: <strong style={{ color: pct(scoreForm.score, scoreForm.totalScore) >= 60 ? 'var(--success)' : 'var(--danger)' }}>{pct(parseFloat(scoreForm.score), parseFloat(scoreForm.totalScore))}%</strong> — {classify(pct(parseFloat(scoreForm.score), parseFloat(scoreForm.totalScore)))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={enterScore} disabled={!scoreForm.studentCode || !scoreForm.score}>تسجيل</button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowEnterScore(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ExamScoreEntryScreen;
