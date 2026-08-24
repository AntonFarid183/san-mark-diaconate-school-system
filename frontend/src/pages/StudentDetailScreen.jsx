import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';
import StudentPaymentModal from '../components/StudentPaymentModal';
import { toAbsoluteBackendUrl } from '../config';

const genderLabels = { Male: 'ذكر', Female: 'أنثى' };
const deaconRankLabels = {
  Epsaltos: 'إبصالتس (مرتل)',
  Oghnostos: 'أغنسطس (قارئ)',
  Epediakon: 'إيبدياكون (مساعد شماس)',
  Diakon: 'دياكون (شماس كامل)',
};

// Soft color coding — green/yellow/red by percentage, gray when there's no data yet.
// Same convention as StudentPerformanceScreen.
const performanceColor = (pct) => {
  if (pct == null) return { bg: 'rgba(148,163,184,0.12)', color: 'var(--text-muted)' };
  if (pct >= 80) return { bg: 'rgba(16,185,129,0.14)', color: 'var(--success)' };
  if (pct >= 60) return { bg: 'rgba(251,191,36,0.14)', color: 'var(--accent-gold)' };
  return { bg: 'rgba(239,68,68,0.14)', color: 'var(--danger)' };
};
const formatPct = (pct) => (pct == null ? '—' : `${pct.toFixed(0)}%`);
const formatAmount = (val) => `${Number(val ?? 0).toLocaleString('ar-EG')} ج.م`;
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('ar-EG') : '—');

const PAYMENT_STATUS_LABELS = {
  paid: { label: 'مدفوع بالكامل', color: 'var(--success)' },
  partial: { label: 'مدفوع جزئياً', color: 'var(--accent-gold)' },
  not_paid: { label: 'غير مدفوع', color: 'var(--danger)' },
  no_balance: { label: 'لا يوجد مبلغ مطلوب', color: 'var(--text-muted)' },
};

const HYMN_STATUS_LABELS = {
  pending: { label: 'قيد المراجعة', color: 'var(--accent-gold)' },
  approved: { label: 'معتمد', color: 'var(--success)' },
  resubmission_requested: { label: 'مطلوب إعادة تسجيل', color: 'var(--danger)' },
};

export default function StudentDetailScreen() {
  usePageTitle('ملف الطالب');
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [performance, setPerformance] = useState(null); // this student's row from the bulk endpoint
  const [subjectDefs, setSubjectDefs] = useState([]); // { key, name } — subjectKey is a raw GUID for homework subjects, so names must come from here
  const [attendance, setAttendance] = useState([]);
  const [account, setAccount] = useState(null);
  const [gradeHistory, setGradeHistory] = useState([]);
  const [homework, setHomework] = useState([]);
  const [hymns, setHymns] = useState([]);
  const [notifications, setNotifications] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const studentRes = await apiClient.get(`/students/${id}`);
        if (cancelled) return;
        const s = studentRes.data;
        setStudent(s);

        const [perfRes, attRes, accRes, ghRes, hwRes, hymnRes, notifRes] = await Promise.allSettled([
          apiClient.get('/students/performance', { params: { gradeId: s.gradeId, classId: s.classId || undefined, level: s.level } }),
          apiClient.get('/attendance/records', { params: { studentId: id } }),
          apiClient.get(`/students/${id}/account`),
          apiClient.get(`/students/${id}/grade-history`),
          apiClient.get(`/homework/student/${id}`),
          apiClient.get(`/hymn-submissions/student/${id}`),
          apiClient.get(`/notifications/student/${id}`),
        ]);
        if (cancelled) return;

        if (perfRes.status === 'fulfilled') {
          const row = perfRes.value.data.students.find(st => st.studentId === id);
          setPerformance(row || null);
          setSubjectDefs(perfRes.value.data.subjects || []);
        }
        if (attRes.status === 'fulfilled') setAttendance(attRes.value.data);
        if (accRes.status === 'fulfilled') setAccount(accRes.value.data);
        if (ghRes.status === 'fulfilled') setGradeHistory(ghRes.value.data);
        if (hwRes.status === 'fulfilled') setHomework(hwRes.value.data);
        if (hymnRes.status === 'fulfilled') setHymns(hymnRes.value.data);
        if (notifRes.status === 'fulfilled') setNotifications(notifRes.value.data);
      } catch {
        if (!cancelled) setError('فشل في تحميل بيانات الطالب');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/students/${id}`);
      navigate('/students');
    } catch (e) {
      setDeleteError(e.response?.data?.message || 'فشل حذف الطالب.');
      setDeleting(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}><p>جاري التحميل...</p></div>
  );

  if (error || !student) return (
    <div className="glass-card" style={{ textAlign: 'center', maxWidth: '500px', margin: '2rem auto' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--danger)', marginBottom: '1rem' }}>error</span>
      <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error || 'الطالب غير موجود'}</p>
      <button onClick={() => navigate('/students')} className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.5rem' }}>
        العودة للقائمة
      </button>
    </div>
  );

  // subjectKey is "hymns" for the fixed hymns slot, or a raw HomeworkSubject GUID for the
  // rest — names only ever come from the bulk response's subject definitions.
  const subjectName = (key) => subjectDefs.find(s => s.key === key)?.name || key;

  const presentCount = attendance.filter(a => a.status === 0).length;
  const absentCount = attendance.filter(a => a.status === 1).length;
  const attendanceTotal = presentCount + absentCount;
  const attendancePct = performance?.attendancePercentage ?? (attendanceTotal > 0 ? Math.round((presentCount / attendanceTotal) * 100) : null);

  const subjects = performance?.subjectScores ?? [];
  const strongest = subjects.filter(s => s.averageScore != null).sort((a, b) => (b.averageScore / b.maxScore) - (a.averageScore / a.maxScore))[0];
  const weakestSubject = subjects.filter(s => s.averageScore != null).sort((a, b) => (a.averageScore / a.maxScore) - (b.averageScore / b.maxScore))[0];

  const missingHomeworkCount = homework.filter(h => !h.hasSubmitted).length;
  const pendingHomeworkCount = homework.filter(h => h.hasSubmitted && h.score == null).length;
  const homeworkCompletionRate = homework.length > 0
    ? Math.round((homework.filter(h => h.hasSubmitted).length / homework.length) * 100)
    : null;

  const pendingHymnCount = hymns.filter(h => h.status === 'pending' || h.status === 'resubmission_requested').length;

  // Simple trend — compares the last two scored entries in a subject's history. No predictive analytics.
  const trendFor = (history) => {
    const scored = (history || []).filter(h => h.score != null);
    if (scored.length < 2) return null;
    const [latest, prev] = scored;
    if (latest.score > prev.score) return { icon: 'trending_up', label: 'في تحسّن', color: 'var(--success)' };
    if (latest.score < prev.score) return { icon: 'trending_down', label: 'يحتاج متابعة', color: 'var(--danger)' };
    return { icon: 'trending_flat', label: 'مستقر', color: 'var(--text-muted)' };
  };

  // Merge every already-fetched source into one sorted feed — no new backend logic, no audit table.
  const timeline = [
    { date: student.registeredDate, icon: 'how_to_reg', label: 'تسجيل الطالب', color: 'var(--text-muted)' },
    ...gradeHistory.map(g => ({
      date: g.promotedAt, icon: 'move_up', color: 'var(--accent-gold)',
      label: `انتقال من ${g.fromGradeName || '—'} إلى ${g.toGradeName}${g.academicYear ? ` (${g.academicYear})` : ''}`,
    })),
    ...(account?.transactions || []).filter(t => !t.isVoided).map(t => ({
      date: t.transactionDate, icon: 'payments', color: 'var(--success)',
      label: `دفعة: ${t.description} — ${formatAmount(t.amount)}`,
    })),
    ...attendance.map(a => ({
      date: a.recordedAt, icon: a.status === 0 ? 'check_circle' : 'cancel', color: a.status === 0 ? 'var(--success)' : 'var(--danger)',
      label: `${a.status === 0 ? 'حضور' : 'غياب'} — ${a.sessionTitle}`,
    })),
    ...homework.filter(h => h.hasSubmitted).map(h => ({
      date: h.submittedAt ?? student.registeredDate, icon: 'edit_note', color: 'var(--accent-gold)',
      label: `تسليم واجب: ${h.title}${h.score != null ? ` — ${h.score}/${h.totalMarks}` : ' (بانتظار التصحيح)'}`,
    })),
    ...hymns.map(h => ({
      date: h.reviewedAt || h.submittedAt, icon: 'music_note', color: HYMN_STATUS_LABELS[h.status]?.color || 'var(--text-muted)',
      label: `تسجيل لحن: ${h.hymnTitle} — ${HYMN_STATUS_LABELS[h.status]?.label || h.status}${h.score != null ? ` (${h.score}/10)` : ''}`,
    })),
    ...(notifications?.recentPersistent || []).map(n => ({
      date: n.createdAt, icon: 'notifications', color: 'var(--accent-blue)', label: n.title,
    })),
  ].filter(e => e.date).sort((a, b) => new Date(b.date) - new Date(a.date));

  const infoFields = [
    { label: 'النوع', value: genderLabels[student.gender] || student.gender },
    { label: 'تاريخ الميلاد', value: student.dateOfBirth },
    { label: 'المرحلة', value: student.stageName },
    { label: 'الصف الدراسي', value: student.gradeName },
    { label: 'الفصل', value: student.className || 'بانتظار التوزيع' },
    { label: 'المستوى', value: student.levelLabel },
    { label: 'أب الاعتراف', value: student.fatherOfConfession },
    ...(student.isDeacon ? [{ label: 'الرتبة الشماسية', value: deaconRankLabels[student.deaconRank] || student.deaconRank }] : []),
    { label: 'موبايل الأب', value: student.fatherMobile, ltr: true },
    { label: 'موبايل الأم', value: student.motherMobile, ltr: true },
    { label: 'واتساب', value: student.whatsAppNumber, ltr: true },
    ...(student.landline ? [{ label: 'تليفون أرضي', value: student.landline, ltr: true }] : []),
    { label: 'تاريخ التسجيل', value: formatDate(student.registeredDate) },
  ];

  const insight = (icon, label, value, color) => (
    <div className="glass-card" style={{ padding: '1rem', textAlign: 'center', flex: 1, minWidth: '140px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '24px', color, marginBottom: '0.35rem', display: 'block' }}>{icon}</span>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontSize: '1.05rem', fontWeight: 700, color }}>{value}</div>
    </div>
  );

  const sectionHeader = (icon, title, onViewAll, viewAllLabel = 'عرض الكل') => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--accent-gold)' }}>{icon}</span>
        <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{title}</h3>
      </div>
      {onViewAll && (
        <span onClick={onViewAll} style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          {viewAllLabel}
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>chevron_left</span>
        </span>
      )}
    </div>
  );

  const paymentStatus = account ? PAYMENT_STATUS_LABELS[account.status] : null;

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* ── 1. Overview ─────────────────────────────────────────────── */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {student.profilePictureUrl && !photoFailed ? (
                <img src={toAbsoluteBackendUrl(student.profilePictureUrl)} alt="" onError={() => setPhotoFailed(true)} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-gold)' }} />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: '52px', color: 'var(--accent-gold)' }}>account_circle</span>
              )}
              <div>
                <h2 style={{ color: 'var(--accent-gold)', fontSize: '1.3rem' }}>{student.fullName}</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>رقم القيد: #{student.studentCode || '—'}</p>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.6rem', borderRadius: '20px', background: student.isActive ? 'rgba(16,185,129,0.14)' : 'rgba(251,191,36,0.14)', color: student.isActive ? 'var(--success)' : 'var(--accent-gold)', fontWeight: 700 }}>
                    {student.isActive ? 'حساب مفعّل' : 'قيد التفعيل'}
                  </span>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.6rem', borderRadius: '20px', background: 'rgba(148,163,184,0.14)', color: 'var(--text-secondary)', fontWeight: 700 }}>
                    {student.status}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => setShowAccountModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(251,191,36,0.4)', background: 'rgba(251,191,36,0.08)', color: 'var(--accent-gold)', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>payments</span>
                إدارة المدفوعات
              </button>
              <button onClick={() => navigate(`/students/${id}/edit`)} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                تعديل
              </button>
              <button onClick={() => navigate('/students')} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                العودة
              </button>
              <button
                onClick={() => { setDeleteError(null); setShowDeleteConfirm(true); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                حذف الطالب
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {infoFields.map((f, i) => (
              <div key={i}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{f.label}</p>
                <p style={{ fontWeight: 600, fontSize: '0.88rem', direction: f.ltr ? 'ltr' : undefined, textAlign: f.ltr ? 'right' : undefined }}>{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick Insights ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {insight('emoji_events', 'أقوى مادة', strongest?.subjectKey ? subjectName(strongest.subjectKey) : '—', 'var(--success)')}
          {insight('report', 'أضعف مادة', weakestSubject?.subjectKey ? subjectName(weakestSubject.subjectKey) : '—', 'var(--danger)')}
          {insight('edit_note', 'نسبة إتمام الواجبات', formatPct(homeworkCompletionRate), 'var(--accent-gold)')}
          {insight('how_to_reg', 'نسبة الحضور', formatPct(attendancePct), 'var(--success)')}
          {insight('account_balance_wallet', 'المبلغ المتبقي', account ? formatAmount(account.remainingBalance) : '—', account?.remainingBalance > 0 ? 'var(--danger)' : 'var(--text-muted)')}
          {insight('pending_actions', 'واجبات معلّقة', missingHomeworkCount + pendingHomeworkCount, 'var(--accent-gold)')}
        </div>

        {/* ── 2. Academic Performance ──────────────────────────────────── */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          {sectionHeader('insights', 'الأداء الدراسي', () => navigate('/student-performance'))}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {insight('trending_up', 'الأداء العام', formatPct(performance?.overallPercentage), performanceColor(performance?.overallPercentage).color)}
            {insight('how_to_reg', 'نسبة الحضور', formatPct(attendancePct), performanceColor(attendancePct).color)}
            {insight('emoji_events', 'أقوى مادة', strongest ? subjectName(strongest.subjectKey) : '—', 'var(--success)')}
            {insight('warning', 'أضعف مادة', performance?.weakestSubjectName || '—', 'var(--danger)')}
          </div>

          {/* ── 3. Subjects Overview ───────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {subjects.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>لا توجد بيانات أداء بعد.</p>
            ) : subjects.map(subj => {
              const pct = subj.averageScore != null ? (subj.averageScore / subj.maxScore) * 100 : null;
              const colors = performanceColor(pct);
              const trend = trendFor(subj.history);
              return (
                <div key={subj.subjectKey} className="glass-card" style={{ padding: '1.1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{subjectName(subj.subjectKey)}</span>
                    {trend && (
                      <span title={trend.label} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: trend.color, fontSize: '0.7rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{trend.icon}</span>
                      </span>
                    )}
                  </div>
                  <span style={{ display: 'inline-block', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 800, background: colors.bg, color: colors.color, marginBottom: '0.6rem' }}>
                    {subj.averageScore != null ? `${subj.averageScore.toFixed(1)} / ${subj.maxScore}` : 'لا يوجد'}
                  </span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {subj.latestLabel ? `آخر: ${subj.latestLabel} — ${formatDate(subj.latestDate)}` : 'لم يُسجَّل بعد'}
                  </div>
                  {/* Subject history — small chronological feed, newest first */}
                  {subj.history?.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.5rem' }}>
                      {subj.history.slice(0, 3).map((h, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '13px', color: h.score != null ? 'var(--success)' : 'var(--danger)' }}>
                              {h.score != null ? 'check_circle' : 'cancel'}
                            </span>
                            {h.title}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>{h.score != null ? `${h.score}/${h.maxScore}` : 'لم يُسلّم'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 4. Attendance ────────────────────────────────────────────── */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          {sectionHeader('how_to_reg', 'الحضور', () => navigate('/attendance/sessions'))}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {insight('percent', 'نسبة الحضور', formatPct(attendancePct), performanceColor(attendancePct).color)}
            {insight('check_circle', 'أيام الحضور', presentCount, 'var(--success)')}
            {insight('cancel', 'أيام الغياب', absentCount, 'var(--danger)')}
          </div>
          {attendance.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>لا يوجد سجل حضور بعد.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {attendance.slice(0, 5).map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'var(--surface-1)', fontSize: '0.85rem' }}>
                  <span>{a.sessionTitle}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{formatDate(a.recordedAt)}</span>
                    <span style={{ padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: a.status === 0 ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)', color: a.status === 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {a.status === 0 ? 'حاضر' : 'غائب'}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 5. Payments ──────────────────────────────────────────────── */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          {sectionHeader('payments', 'المدفوعات', () => setShowAccountModal(true), 'إدارة')}
          {account ? (
            <>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {insight('request_quote', 'المطلوب', formatAmount(account.totalRequired), 'var(--text-primary)')}
                {insight('paid', 'المدفوع', formatAmount(account.amountPaid), 'var(--success)')}
                {insight('account_balance_wallet', 'المتبقي', formatAmount(account.remainingBalance), account.remainingBalance > 0 ? 'var(--danger)' : 'var(--text-muted)')}
              </div>
              {paymentStatus && (
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.78rem', padding: '0.25rem 0.9rem', borderRadius: '20px', background: `${paymentStatus.color}22`, color: paymentStatus.color, fontWeight: 700 }}>
                    {paymentStatus.label}
                  </span>
                </div>
              )}
              {account.transactions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>لا يوجد سجل مدفوعات بعد.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {account.transactions.filter(t => !t.isVoided).slice(0, 5).map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'var(--surface-1)', fontSize: '0.85rem' }}>
                      <span>{t.description}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{formatDate(t.transactionDate)}</span>
                        <span style={{ fontWeight: 700, color: 'var(--success)' }}>{formatAmount(t.amount)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>تعذّر تحميل بيانات المدفوعات.</p>
          )}
        </div>

        {/* ── 6. Homework ──────────────────────────────────────────────── */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          {sectionHeader('edit_note', 'الواجبات', () => navigate('/homework-management'))}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {insight('checklist', 'نسبة الإتمام', formatPct(homeworkCompletionRate), 'var(--success)')}
            {insight('hourglass_empty', 'واجبات ناقصة', missingHomeworkCount, 'var(--danger)')}
            {insight('rate_review', 'بانتظار التصحيح', pendingHomeworkCount, 'var(--accent-gold)')}
          </div>
          {homework.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>لا توجد واجبات لهذا الصف بعد.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {homework.slice(0, 5).map(h => (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'var(--surface-1)', fontSize: '0.85rem' }}>
                  <span>{h.title} <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({h.subjectName})</span></span>
                  <span style={{ padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, ...(!h.hasSubmitted ? { background: 'rgba(239,68,68,0.14)', color: 'var(--danger)' } : h.score == null ? { background: 'rgba(251,191,36,0.14)', color: 'var(--accent-gold)' } : { background: 'rgba(16,185,129,0.14)', color: 'var(--success)' }) }}>
                    {!h.hasSubmitted ? 'لم يُسلَّم' : h.score == null ? 'بانتظار التصحيح' : `${h.score} / ${h.totalMarks}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 7. Hymns ─────────────────────────────────────────────────── */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          {sectionHeader('music_note', 'الألحان', () => navigate('/hymn-submissions'))}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {insight('pending_actions', 'قيد المراجعة / إعادة تسجيل', pendingHymnCount, 'var(--accent-gold)')}
          </div>
          {hymns.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>لا توجد تسجيلات ألحان بعد.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {hymns.slice(0, 5).map(h => {
                const st = HYMN_STATUS_LABELS[h.status] || { label: h.status, color: 'var(--text-muted)' };
                return (
                  <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'var(--surface-1)', fontSize: '0.85rem' }}>
                    <span>{h.hymnTitle}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {h.score != null && <span style={{ fontWeight: 700 }}>{h.score}/10</span>}
                      <span style={{ padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: `${st.color}22`, color: st.color }}>{st.label}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 8. Notifications ─────────────────────────────────────────── */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          {sectionHeader('notifications', 'الإشعارات')}
          {(!notifications || (notifications.dynamicItems.length === 0 && notifications.recentPersistent.length === 0)) ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>لا توجد إشعارات حالياً.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {notifications.dynamicItems.map((n, i) => (
                <div key={`d-${i}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.9rem', borderRadius: '8px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>{n.title}</div>
                    {n.message && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{n.message}</div>}
                  </div>
                </div>
              ))}
              {notifications.recentPersistent.slice(0, 5).map(n => (
                <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.9rem', borderRadius: '8px', background: n.isRead ? 'var(--surface-1)' : 'rgba(59,130,246,0.08)', border: n.isRead ? 'none' : '1px solid rgba(59,130,246,0.25)', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ fontWeight: n.isRead ? 500 : 700 }}>{n.title}</div>
                    {n.message && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{n.message}</div>}
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{formatDate(n.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 9. Timeline ──────────────────────────────────────────────── */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          {sectionHeader('history', 'السجل الزمني')}
          {timeline.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>لا توجد أحداث بعد.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {timeline.map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.6rem 0', borderBottom: i < timeline.length - 1 ? '1px solid var(--surface-2)' : 'none' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: e.color, flexShrink: 0, marginTop: '0.1rem' }}>{e.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem' }}>{e.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatDate(e.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAccountModal && (
        <StudentPaymentModal studentId={id} studentName={student.fullName} onClose={() => setShowAccountModal(false)} />
      )}

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div className="glass-card" style={{ padding: '2rem', width: 'min(420px, 90vw)', direction: 'rtl' }}>
            <h3 style={{ color: 'var(--danger)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined">warning</span>
              حذف الطالب نهائياً
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '0.5rem' }}>
              سيتم حذف <strong style={{ color: 'var(--text-primary)' }}>{student.fullName}</strong> نهائياً، بما في ذلك سجل الحضور والواجبات ونتائج الامتحانات والشهادات والمدفوعات وتسجيلات الألحان وحساب الدخول الخاص به. لا يمكن التراجع عن هذا الإجراء.
            </p>
            {deleteError && (
              <p style={{ fontSize: '0.85rem', color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem' }}>
                {deleteError}
              </p>
            )}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                className="btn-secondary"
                style={{ flex: 1 }}
                disabled={deleting}
                onClick={() => setShowDeleteConfirm(false)}
              >
                إلغاء
              </button>
              <button
                style={{ flex: 1, borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--danger)', color: '#fff', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', padding: '0.7rem', opacity: deleting ? 0.7 : 1 }}
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? 'جاري الحذف...' : 'حذف نهائياً'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
