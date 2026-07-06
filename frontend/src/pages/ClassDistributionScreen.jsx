import { useState, useEffect } from 'react';
import apiClient from '../apiClient';
import Layout from '../Layout';

const TAB_DISTRIBUTE = 'distribute';
const TAB_MANAGE = 'manage';

export default function ClassDistributionScreen() {
  const [tab, setTab] = useState(TAB_DISTRIBUTE);
  const [grades, setGrades] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [msg, setMsg] = useState(null);

  // Distribution tab state
  const [distGradeId, setDistGradeId] = useState('');
  const [distYearId, setDistYearId] = useState('');
  const [preferredSize, setPreferredSize] = useState(20);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [applying, setApplying] = useState(false);

  // Manual tab state
  const [manGradeId, setManGradeId] = useState('');
  const [manYearId, setManYearId] = useState('');
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [movingTo, setMovingTo] = useState(null); // classId being moved to

  useEffect(() => {
    apiClient.get('/students/grades').then(r => setGrades(r.data)).catch(() => {});
    apiClient.get('/academic-years').then(r => {
      setAcademicYears(r.data);
      const current = r.data.find(y => y.isCurrent);
      if (current) { setDistYearId(current.id); setManYearId(current.id); }
    }).catch(() => {});
  }, []);

  // Distribution tab
  const fetchOptions = async () => {
    if (!distGradeId || !distYearId || preferredSize < 1) return;
    setLoadingOptions(true);
    setOptions([]);
    setSelectedOption(null);
    try {
      const r = await apiClient.get('/classes/distribution-options', {
        params: { gradeId: distGradeId, academicYearId: distYearId, preferredSize }
      });
      setOptions(r.data);
      if (r.data.length > 0) {
        // Default: select middle option (the suggested one)
        setSelectedOption(r.data[Math.floor(r.data.length / 2)] ?? r.data[0]);
      }
    } catch {
      setMsg({ type: 'error', text: 'فشل تحميل خيارات التوزيع.' });
    } finally {
      setLoadingOptions(false);
    }
  };

  const applyDistribution = async () => {
    if (!selectedOption) return;
    if (!window.confirm(`تطبيق توزيع ${selectedOption.classCount} فصول على ${selectedOption.totalStudents} طالب؟ سيتم حذف الفصول غير المقفلة الحالية.`)) return;
    setApplying(true);
    try {
      await apiClient.post('/classes/distribution/apply', {
        gradeId: distGradeId,
        academicYearId: distYearId,
        classes: selectedOption.classes.map(c => ({
          name: c.name,
          studentIds: c.students.map(s => s.id)
        }))
      });
      setMsg({ type: 'success', text: 'تم تطبيق التوزيع بنجاح.' });
      setOptions([]);
      setSelectedOption(null);
      // Switch to manage tab to see result
      setManGradeId(distGradeId);
      setManYearId(distYearId);
      setTab(TAB_MANAGE);
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل تطبيق التوزيع.' });
    } finally {
      setApplying(false);
    }
  };

  // Manual tab
  const fetchClasses = async (gradeId, yearId) => {
    if (!gradeId || !yearId) return;
    setLoadingClasses(true);
    setSelectedStudents(new Set());
    try {
      const r = await apiClient.get('/classes', { params: { gradeId, academicYearId: yearId } });
      setClasses(r.data);
    } catch {
      setMsg({ type: 'error', text: 'فشل تحميل الفصول.' });
    } finally {
      setLoadingClasses(false);
    }
  };

  useEffect(() => { if (tab === TAB_MANAGE) fetchClasses(manGradeId, manYearId); }, [manGradeId, manYearId, tab]);

  const toggleStudent = (studentId) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      next.has(studentId) ? next.delete(studentId) : next.add(studentId);
      return next;
    });
  };

  const moveStudents = async (targetClassId) => {
    if (selectedStudents.size === 0) return;
    setMovingTo(targetClassId);
    try {
      await apiClient.post('/classes/move-students', {
        studentIds: [...selectedStudents],
        targetClassId: targetClassId || null
      });
      setSelectedStudents(new Set());
      fetchClasses(manGradeId, manYearId);
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل نقل الطلاب.' });
    } finally {
      setMovingTo(null);
    }
  };

  const toggleLock = async (classId) => {
    try {
      await apiClient.post(`/classes/${classId}/toggle-lock`);
      fetchClasses(manGradeId, manYearId);
    } catch {
      setMsg({ type: 'error', text: 'فشل تغيير حالة القفل.' });
    }
  };

  const deleteClass = async (cls) => {
    if (!window.confirm(`حذف الفصل "${cls.name}"؟ سيتم إلغاء تعيين طلابه.`)) return;
    try {
      await apiClient.delete(`/classes/${cls.id}`);
      fetchClasses(manGradeId, manYearId);
    } catch {
      setMsg({ type: 'error', text: 'فشل الحذف.' });
    }
  };

  const gradeName = (id) => grades.find(g => g.id === id)?.name ?? '';

  return (
    <Layout title="توزيع الفصول">
      <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        توزيع الطلاب على الفصول الدراسية وإدارة التعيينات يدوياً.
      </p>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', borderRadius: 'var(--radius-sm)', background: msg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
          {msg.text}
          <span style={{ cursor: 'pointer' }} onClick={() => setMsg(null)}>✕</span>
        </div>
      )}

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(15,23,42,0.5)', borderRadius: 'var(--radius-sm)', padding: '0.25rem', width: 'fit-content' }}>
        {[{ id: TAB_DISTRIBUTE, label: 'توزيع ذكي', icon: 'auto_awesome' }, { id: TAB_MANAGE, label: 'إدارة يدوية', icon: 'manage_accounts' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', background: tab === t.id ? 'var(--accent-gold)' : 'transparent', color: tab === t.id ? '#1e293b' : 'var(--text-secondary)', fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: tab === t.id ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── SMART DISTRIBUTION TAB ── */}
      {tab === TAB_DISTRIBUTE && (
        <div>
          {/* Filters */}
          <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ minWidth: '200px' }}>
                <label style={labelStyle}>السنة الدراسية</label>
                <select className="premium-input" value={distYearId} onChange={e => { setDistYearId(e.target.value); setOptions([]); setSelectedOption(null); }}>
                  <option value="">اختر السنة</option>
                  {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                </select>
              </div>
              <div style={{ minWidth: '220px' }}>
                <label style={labelStyle}>الصف الدراسي</label>
                <select className="premium-input" value={distGradeId} onChange={e => { setDistGradeId(e.target.value); setOptions([]); setSelectedOption(null); }}>
                  <option value="">اختر الصف</option>
                  {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div style={{ minWidth: '160px' }}>
                <label style={labelStyle}>الحجم المفضل للفصل</label>
                <input className="premium-input" type="number" min={5} max={60} value={preferredSize} onChange={e => setPreferredSize(Number(e.target.value))} />
              </div>
              <button
                onClick={fetchOptions}
                disabled={!distGradeId || !distYearId || loadingOptions}
                className="btn-primary"
                style={{ width: 'auto', padding: '0.55rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {loadingOptions ? 'hourglass_top' : 'auto_awesome'}
                </span>
                {loadingOptions ? 'جاري الحساب...' : 'احسب الخيارات'}
              </button>
            </div>
          </div>

          {/* Distribution options */}
          {options.length > 0 && (
            <div>
              <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem', fontSize: '0.95rem' }}>
                اختر توزيع الفصول — {options[0]?.totalStudents} طالب في {gradeName(distGradeId)}
              </h3>

              {/* Option selector cards */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {options.map(opt => {
                  const isSelected = selectedOption?.classCount === opt.classCount;
                  const sizes = opt.classes.map(c => c.students.length);
                  const min = Math.min(...sizes), max = Math.max(...sizes);
                  return (
                    <button key={opt.classCount} onClick={() => setSelectedOption(opt)} style={{ flex: 1, minWidth: '140px', padding: '1rem', borderRadius: 'var(--radius-sm)', border: `2px solid ${isSelected ? 'var(--accent-gold)' : 'var(--glass-border)'}`, background: isSelected ? 'rgba(251,191,36,0.1)' : 'rgba(15,23,42,0.4)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', fontFamily: 'inherit' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: isSelected ? 'var(--accent-gold)' : 'var(--text-primary)', lineHeight: 1 }}>{opt.classCount}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>فصول</div>
                      <div style={{ fontSize: '0.82rem', color: isSelected ? 'var(--accent-gold)' : 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 600 }}>
                        {min === max ? `${min} طالب/فصل` : `${min}–${max} طالب/فصل`}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Preview of selected option */}
              {selectedOption && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      معاينة التوزيع — {selectedOption.classCount} فصول
                    </h4>
                    <button
                      onClick={applyDistribution}
                      disabled={applying}
                      className="btn-primary"
                      style={{ width: 'auto', padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        {applying ? 'hourglass_top' : 'check_circle'}
                      </span>
                      {applying ? 'جاري التطبيق...' : 'تطبيق هذا التوزيع'}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                    {selectedOption.classes.map(cls => (
                      <div key={cls.name} className="glass-card" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-gold)' }}>فصل {cls.name}</span>
                          <span style={{ fontSize: '0.75rem', background: 'rgba(251,191,36,0.12)', color: 'var(--accent-gold)', padding: '0.1rem 0.5rem', borderRadius: '12px' }}>
                            {cls.students.length} طالب
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '200px', overflowY: 'auto' }}>
                          {cls.students.map((s, i) => (
                            <div key={s.id} style={{ fontSize: '0.8rem', padding: '0.2rem 0', borderBottom: i < cls.students.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', display: 'flex', gap: '0.5rem' }}>
                              <span style={{ color: 'var(--text-muted)', minWidth: '20px' }}>{i + 1}</span>
                              <span>{s.fullName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {options.length === 0 && !loadingOptions && distGradeId && distYearId && (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)', display: 'block', marginBottom: '1rem' }}>auto_awesome</span>
              <p style={{ color: 'var(--text-muted)' }}>اضغط "احسب الخيارات" للحصول على اقتراحات التوزيع</p>
            </div>
          )}
        </div>
      )}

      {/* ── MANUAL MANAGEMENT TAB ── */}
      {tab === TAB_MANAGE && (
        <div>
          {/* Filters */}
          <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ minWidth: '200px' }}>
                <label style={labelStyle}>السنة الدراسية</label>
                <select className="premium-input" value={manYearId} onChange={e => setManYearId(e.target.value)}>
                  <option value="">اختر السنة</option>
                  {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                </select>
              </div>
              <div style={{ minWidth: '220px' }}>
                <label style={labelStyle}>الصف الدراسي</label>
                <select className="premium-input" value={manGradeId} onChange={e => setManGradeId(e.target.value)}>
                  <option value="">اختر الصف</option>
                  {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Move bar — shows when students are selected */}
          {selectedStudents.size > 0 && (
            <div style={{ position: 'sticky', top: '1rem', zIndex: 50, marginBottom: '1rem', padding: '0.75rem 1.25rem', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.88rem' }}>
                {selectedStudents.size} طالب محدد — نقل إلى:
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {classes.map(cls => (
                  <button key={cls.id} onClick={() => moveStudents(cls.id)} disabled={movingTo === cls.id} style={{ padding: '0.3rem 0.75rem', borderRadius: '6px', border: '1px solid var(--accent-gold)', background: 'rgba(251,191,36,0.1)', color: 'var(--accent-gold)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit' }}>
                    فصل {cls.name}
                  </button>
                ))}
                <button onClick={() => moveStudents(null)} style={{ padding: '0.3rem 0.75rem', borderRadius: '6px', border: '1px solid var(--danger)', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit' }}>
                  إزالة من الفصل
                </button>
                <button onClick={() => setSelectedStudents(new Set())} style={{ padding: '0.3rem 0.75rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit' }}>
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {loadingClasses ? (
            <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>جاري التحميل...</p>
          ) : !manGradeId || !manYearId ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)', display: 'block', marginBottom: '1rem' }}>manage_accounts</span>
              <p style={{ color: 'var(--text-muted)' }}>اختر السنة الدراسية والصف لعرض الفصول</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)', display: 'block', marginBottom: '1rem' }}>groups</span>
              <p style={{ color: 'var(--text-muted)' }}>لا توجد فصول لهذا الصف في هذه السنة</p>
              <p style={{ fontSize: '0.82rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>استخدم تبويب "توزيع ذكي" لإنشاء الفصول</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {classes.map(cls => (
                <div key={cls.id} className="glass-card" style={{ padding: '1.25rem', border: cls.isLocked ? '1px solid rgba(251,191,36,0.3)' : undefined }}>
                  {/* Class header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-gold)' }}>فصل {cls.name}</span>
                      {cls.isLocked && (
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--accent-gold)' }}>lock</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button onClick={() => toggleLock(cls.id)} title={cls.isLocked ? 'فك القفل' : 'قفل الفصل'} style={iconBtnStyle}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{cls.isLocked ? 'lock_open' : 'lock'}</span>
                      </button>
                      <button onClick={() => deleteClass(cls)} title="حذف الفصل" style={{ ...iconBtnStyle, color: 'var(--danger)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    {cls.studentCount} طالب
                    {cls.isLocked && <span style={{ marginRight: '0.5rem', color: 'var(--accent-gold)' }}>• مقفل</span>}
                  </div>

                  {/* Student list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '280px', overflowY: 'auto' }}>
                    {cls.students.map((s, i) => {
                      const checked = selectedStudents.has(s.id);
                      return (
                        <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.3rem 0.4rem', borderRadius: '6px', cursor: 'pointer', background: checked ? 'rgba(251,191,36,0.08)' : 'transparent', transition: 'background 0.15s' }}>
                          <input type="checkbox" checked={checked} onChange={() => toggleStudent(s.id)} style={{ accentColor: 'var(--accent-gold)', width: '14px', height: '14px', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.82rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem', fontSize: '0.72rem' }}>{i + 1}.</span>
                            {s.fullName}
                          </span>
                        </label>
                      );
                    })}
                    {cls.students.length === 0 && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>لا يوجد طلاب</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

const labelStyle = {
  display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600,
};

const iconBtnStyle = {
  background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '6px',
  padding: '0.3rem', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
};
