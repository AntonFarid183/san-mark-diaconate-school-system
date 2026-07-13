import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import Layout from '../Layout';
import ExportModal from '../components/ExportModal';

const LEVEL_OPTIONS = [
  { value: '', label: 'كل المستويات' },
  { value: 1, label: 'المستوى 1' },
  { value: 2, label: 'المستوى 2' },
];

// Soft color coding — green/yellow/red by percentage, gray when there's no data yet.
const performanceColor = (pct) => {
  if (pct == null) return { bg: 'rgba(148,163,184,0.12)', color: 'var(--text-muted)' };
  if (pct >= 80) return { bg: 'rgba(16,185,129,0.14)', color: 'var(--success)' };
  if (pct >= 60) return { bg: 'rgba(251,191,36,0.14)', color: 'var(--accent-gold)' };
  return { bg: 'rgba(239,68,68,0.14)', color: 'var(--danger)' };
};

const formatPct = (pct) => (pct == null ? '—' : `${pct.toFixed(0)}%`);
const formatScore = (score, max) => (score == null ? 'لم يُسلّم' : `${score.toFixed(1)} / ${max}`);

export default function StudentPerformanceScreen() {
  const navigate = useNavigate();

  const [stages, setStages] = useState([]);
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  const [stageId, setStageId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [level, setLevel] = useState('');
  const [classId, setClassId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [search, setSearch] = useState('');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const [detailModal, setDetailModal] = useState(null); // { studentName, subjectName, history }
  const [exportConfig, setExportConfig] = useState(null); // { columns, rows, fileName, sheetName }

  useEffect(() => {
    apiClient.get('/students/stages').then(r => setStages(r.data)).catch(() => {});
    apiClient.get('/academic-years').then(r => {
      setAcademicYears(r.data);
      const current = r.data.find(y => y.isCurrent);
      if (current) setAcademicYearId(current.id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setGradeId(''); setGrades([]); setClassId(''); setClasses([]);
    if (stageId) apiClient.get(`/students/grades/${stageId}`).then(r => setGrades(r.data)).catch(() => setGrades([]));
  }, [stageId]);

  useEffect(() => {
    setClassId(''); setClasses([]);
    if (gradeId && academicYearId) {
      apiClient.get('/classes', { params: { gradeId, academicYearId } }).then(r => setClasses(r.data)).catch(() => setClasses([]));
    }
  }, [gradeId, academicYearId]);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const params = {};
      if (stageId) params.stageId = stageId;
      if (gradeId) params.gradeId = gradeId;
      if (level) params.level = level;
      if (classId) params.classId = classId;
      if (search.trim()) params.name = search.trim();
      const r = await apiClient.get('/students/performance', { params });
      setData(r.data);
    } catch {
      setMsg('فشل تحميل بيانات الأداء.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPerformance(); }, [stageId, gradeId, level, classId]);

  // Live search — debounced
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const timer = setTimeout(fetchPerformance, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const subjects = data?.subjects ?? [];
  const students = data?.students ?? [];
  const summary = data?.summary;

  const subjectScoreFor = (student, key) => student.subjectScores.find(s => s.subjectKey === key);

  const statCard = (icon, label, value, color) => (
    <div className="glass-card" style={{ padding: '1.1rem', textAlign: 'center', flex: 1, minWidth: '150px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '28px', color, marginBottom: '0.4rem', display: 'block' }}>{icon}</span>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 700, color }}>{value}</div>
    </div>
  );

  const buildExportRows = () => students.map(s => {
    const row = {
      studentCode: s.studentCode,
      fullName: s.fullName,
      className: s.className || 'بانتظار التوزيع',
      attendance: s.attendancePercentage != null ? `${s.attendancePercentage}%` : '—',
      overall: s.overallPercentage != null ? `${s.overallPercentage}%` : '—',
      weakestSubject: s.weakestSubjectName || '—',
      requiresFollowUp: s.requiresFollowUp ? 'نعم' : 'لا',
      missingHomework: s.isMissingHomework ? 'نعم' : 'لا',
    };
    subjects.forEach(subj => {
      const score = subjectScoreFor(s, subj.key);
      row[`subject_${subj.key}`] = score?.averageScore != null ? `${score.averageScore.toFixed(1)} / ${score.maxScore}` : 'لم يُسلّم';
    });
    return row;
  });

  const baseColumns = [
    { key: 'studentCode', label: 'الكود' },
    { key: 'fullName', label: 'الاسم' },
    { key: 'className', label: 'الفصل' },
  ];
  const subjectColumns = subjects.map(s => ({ key: `subject_${s.key}`, label: s.name }));
  const tailColumns = [
    { key: 'attendance', label: 'نسبة الحضور' },
    { key: 'overall', label: 'الأداء العام' },
  ];
  const extraColumns = [
    { key: 'weakestSubject', label: 'أضعف مادة' },
    { key: 'requiresFollowUp', label: 'يحتاج متابعة' },
    { key: 'missingHomework', label: 'واجبات ناقصة' },
  ];

  const openExportCurrent = () => {
    setExportConfig({
      columns: [...baseColumns, ...subjectColumns, ...tailColumns],
      rows: buildExportRows(),
      fileName: 'لوحة_أداء_الطلاب',
      sheetName: 'الأداء',
    });
  };

  const openExportFull = () => {
    setExportConfig({
      columns: [...baseColumns, ...subjectColumns, ...tailColumns, ...extraColumns],
      rows: buildExportRows(),
      fileName: 'تقرير_أداء_كامل',
      sheetName: 'تقرير كامل',
    });
  };

  const openExportSummary = () => {
    if (!summary) return;
    setExportConfig({
      columns: [
        { key: 'totalStudents', label: 'إجمالي الطلاب' },
        { key: 'averageOverall', label: 'متوسط الأداء العام' },
        { key: 'topStudentName', label: 'الطالب الأعلى' },
        { key: 'followUpCount', label: 'طلاب يحتاجون متابعة' },
        { key: 'missingHomeworkCount', label: 'واجبات ناقصة' },
        { key: 'averageAttendance', label: 'متوسط الحضور' },
      ],
      rows: [{
        totalStudents: summary.totalStudents,
        averageOverall: summary.averageOverall != null ? `${summary.averageOverall}%` : '—',
        topStudentName: summary.topStudentName || '—',
        followUpCount: summary.followUpCount,
        missingHomeworkCount: summary.missingHomeworkCount,
        averageAttendance: summary.averageAttendance != null ? `${summary.averageAttendance}%` : '—',
      }],
      fileName: 'ملخص_الأداء',
      sheetName: 'ملخص',
    });
  };

  return (
    <Layout title="لوحة أداء الطلاب">
      <p style={{ marginBottom: '1.5rem', fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
        نظرة شاملة وسريعة على أداء الطلاب في الألحان والواجبات والحضور.
      </p>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
          {msg}
          <span style={{ cursor: 'pointer' }} onClick={() => setMsg(null)}>✕</span>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: '180px' }}>
            <label style={labelStyle}>السنة الدراسية</label>
            <select className="premium-input" value={academicYearId} onChange={e => setAcademicYearId(e.target.value)}>
              <option value="">اختر السنة</option>
              {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
          <div style={{ minWidth: '150px' }}>
            <label style={labelStyle}>المرحلة</label>
            <select className="premium-input" value={stageId} onChange={e => setStageId(e.target.value)}>
              <option value="">كل المراحل</option>
              {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ minWidth: '180px' }}>
            <label style={labelStyle}>الصف الدراسي</label>
            <select className="premium-input" value={gradeId} onChange={e => setGradeId(e.target.value)} disabled={!stageId}>
              <option value="">كل الصفوف</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div style={{ minWidth: '150px' }}>
            <label style={labelStyle}>المستوى</label>
            <select className="premium-input" value={level} onChange={e => setLevel(e.target.value)}>
              {LEVEL_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div style={{ minWidth: '150px' }}>
            <label style={labelStyle}>الفصل</label>
            <select className="premium-input" value={classId} onChange={e => setClassId(e.target.value)} disabled={!gradeId}>
              <option value="">كل الفصول</option>
              {classes.map(c => <option key={c.id} value={c.id}>فصل {c.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <label style={labelStyle}>بحث</label>
            <span className="material-symbols-outlined" style={{ position: 'absolute', right: '12px', top: '38px', color: 'var(--text-muted)', fontSize: '20px', pointerEvents: 'none' }}>search</span>
            <input className="premium-input" placeholder="اسم الطالب أو الكود..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingRight: '40px' }} />
          </div>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>جاري التحميل...</p>
      ) : students.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)', display: 'block', marginBottom: '1rem' }}>insights</span>
          <p style={{ color: 'var(--text-muted)' }}>لا يوجد طلاب مطابقين لهذا الفلتر</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'flex', gap: '0.9rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {statCard('groups', 'إجمالي الطلاب', summary.totalStudents, 'var(--text-primary)')}
            {statCard('trending_up', 'متوسط الأداء العام', formatPct(summary.averageOverall), 'var(--accent-gold)')}
            {statCard('emoji_events', 'الطالب الأعلى', summary.topStudentName || '—', 'var(--success)')}
            {statCard('report', 'يحتاجون متابعة', summary.followUpCount, 'var(--danger)')}
            {statCard('edit_note', 'واجبات ناقصة', summary.missingHomeworkCount, 'var(--accent-gold)')}
            {statCard('how_to_reg', 'متوسط الحضور', formatPct(summary.averageAttendance), 'var(--success)')}
          </div>

          {/* Export actions */}
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <button onClick={openExportCurrent} className="btn-secondary" style={{ width: 'auto', padding: '0.5rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
              تصدير النتائج الحالية
            </button>
            <button onClick={openExportSummary} className="btn-secondary" style={{ width: 'auto', padding: '0.5rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>summarize</span>
              تصدير تقرير ملخص
            </button>
            <button onClick={openExportFull} className="btn-secondary" style={{ width: 'auto', padding: '0.5rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>description</span>
              تصدير تقرير كامل
            </button>
          </div>

          {/* Main table */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(15,23,42,0.4)' }}>
                    <th style={{ ...thStyle, textAlign: 'right' }}>الطالب</th>
                    {subjects.map(s => <th key={s.key} style={thStyle}>{s.name}</th>)}
                    <th style={thStyle}>الحضور</th>
                    <th style={thStyle}>الأداء العام</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.studentId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <div onClick={() => navigate(`/students/${student.studentId}`)} style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-gold)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}>
                          {student.fullName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{student.studentCode} — {student.className || 'بانتظار التوزيع'}</div>
                        <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                          {student.requiresFollowUp && (
                            <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.5rem', borderRadius: '10px', background: 'rgba(239,68,68,0.14)', color: 'var(--danger)', fontWeight: 700 }}>يحتاج متابعة</span>
                          )}
                          {student.isMissingHomework && (
                            <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.5rem', borderRadius: '10px', background: 'rgba(251,191,36,0.14)', color: 'var(--accent-gold)', fontWeight: 700 }}>واجبات ناقصة</span>
                          )}
                        </div>
                      </td>
                      {subjects.map(subj => {
                        const score = subjectScoreFor(student, subj.key);
                        const pct = score?.averageScore != null ? (score.averageScore / score.maxScore) * 100 : null;
                        const colors = performanceColor(pct);
                        const isWeakest = student.weakestSubjectName === subj.name;
                        return (
                          <td key={subj.key} style={tdStyle}>
                            <div
                              onClick={() => score?.averageScore != null && setDetailModal({ studentName: student.fullName, subjectName: subj.name, history: score.history, maxScore: score.maxScore })}
                              style={{
                                padding: '0.4rem 0.7rem', borderRadius: '8px', background: colors.bg, color: colors.color,
                                cursor: score?.averageScore != null ? 'pointer' : 'default', textAlign: 'center',
                                border: isWeakest ? '1px solid currentColor' : '1px solid transparent',
                              }}
                            >
                              <div style={{ fontWeight: 700 }}>{formatScore(score?.averageScore, score?.maxScore ?? 10)}</div>
                              <div style={{ fontSize: '0.68rem', opacity: 0.85, marginTop: '0.1rem' }}>
                                {score?.latestLabel ? `آخر: ${score.latestLabel}` : 'لا يوجد'}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                      <td style={tdStyle}>
                        <span style={{ ...pillStyle, ...performanceColor(student.attendancePercentage) }}>
                          {formatPct(student.attendancePercentage)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ ...pillStyle, ...performanceColor(student.overallPercentage), fontWeight: 800 }}>
                          {formatPct(student.overallPercentage)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Subject detail modal */}
      {detailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setDetailModal(null)}>
          <div className="glass-card" style={{ padding: '2rem', width: '440px', maxWidth: '92vw', maxHeight: '80vh', overflowY: 'auto', direction: 'rtl' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <h3 style={{ color: 'var(--accent-gold)' }}>{detailModal.subjectName}</h3>
              <span onClick={() => setDetailModal(null)} style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}>✕</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>{detailModal.studentName}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {detailModal.history.map((item, i) => {
                const pct = (item.score / item.maxScore) * 100;
                const colors = performanceColor(pct);
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.9rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(item.date).toLocaleDateString('ar-EG')}</div>
                    </div>
                    <span style={{ ...pillStyle, background: colors.bg, color: colors.color }}>{item.score} / {item.maxScore}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {exportConfig && (
        <ExportModal
          columns={exportConfig.columns}
          rows={exportConfig.rows}
          storageKey="student-performance"
          fileName={exportConfig.fileName}
          sheetName={exportConfig.sheetName}
          onClose={() => setExportConfig(null)}
        />
      )}
    </Layout>
  );
}

const labelStyle = {
  display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600,
};

const thStyle = {
  padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 700, fontSize: '0.8rem',
  color: 'var(--accent-gold)', whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '0.65rem 0.85rem', textAlign: 'center', verticalAlign: 'middle',
};

const pillStyle = {
  display: 'inline-block', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 700,
};
