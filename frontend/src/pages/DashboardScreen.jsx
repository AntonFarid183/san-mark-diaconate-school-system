import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';
import { BACKEND_URL } from '../config';

// ─── Student Dashboard — "what do I need to know/do right now?" ───────────────

const performanceColor = (pct) => {
  if (pct == null) return { bg: 'rgba(148,163,184,0.12)', color: 'var(--text-muted)' };
  if (pct >= 80) return { bg: 'rgba(16,185,129,0.14)', color: 'var(--success)' };
  if (pct >= 60) return { bg: 'rgba(251,191,36,0.14)', color: 'var(--accent-gold)' };
  return { bg: 'rgba(239,68,68,0.14)', color: 'var(--danger)' };
};
const formatPct = (pct) => (pct == null ? '—' : `${pct.toFixed(0)}%`);
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('ar-EG') : '—');

const HYMN_STATUS_LABELS = {
  pending: { label: 'قيد المراجعة', color: 'var(--accent-gold)' },
  approved: { label: 'معتمد', color: 'var(--success)' },
  resubmission_requested: { label: 'مطلوب إعادة تسجيل', color: 'var(--danger)' },
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [homework, setHomework] = useState([]);
  const [hymns, setHymns] = useState([]);
  const [hymnProgress, setHymnProgress] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [notifications, setNotifications] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await apiClient.get('/students/me');
        setProfile(profileRes.data);

        const [hwRes, hymnRes, progRes, attRes, notifRes, annRes, certRes] = await Promise.allSettled([
          apiClient.get('/homework/my'),
          apiClient.get('/hymn-submissions/mine'),
          apiClient.get('/hymn-lessons/my-progress'),
          apiClient.get('/attendance/mine'),
          apiClient.get('/notifications/summary'),
          apiClient.get('/announcement', { params: { activeOnly: true, stageId: profileRes.data.stageId } }),
          apiClient.get('/certificate/my'),
        ]);
        if (hwRes.status === 'fulfilled') setHomework(hwRes.value.data);
        if (hymnRes.status === 'fulfilled') setHymns(hymnRes.value.data);
        if (progRes.status === 'fulfilled') setHymnProgress(progRes.value.data);
        if (attRes.status === 'fulfilled') setAttendance(attRes.value.data);
        if (notifRes.status === 'fulfilled') setNotifications(notifRes.value.data);
        if (annRes.status === 'fulfilled') setAnnouncements(annRes.value.data);
        if (certRes.status === 'fulfilled') setCertificates(certRes.value.data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>;

  const pendingHomework = homework.filter(h => !h.hasSubmitted);
  const gradedHomework = homework.filter(h => h.hasSubmitted && h.score != null);
  const homeworkCompletionRate = homework.length > 0
    ? Math.round((homework.filter(h => h.hasSubmitted).length / homework.length) * 100)
    : null;

  const resubmissionHymns = hymns.filter(h => h.status === 'resubmission_requested');
  const inProgressLesson = hymnProgress
    .filter(p => p.hasVideo && !p.isCompleted && p.watchedPercent > 0)
    .sort((a, b) => new Date(b.lastViewedAt) - new Date(a.lastViewedAt))[0];
  const scoredHymns = hymns.filter(h => h.score != null);
  const hymnsAverage = scoredHymns.length > 0
    ? Math.round((scoredHymns.reduce((sum, h) => sum + h.score, 0) / scoredHymns.length) * 10)
    : null;

  const presentCount = attendance.filter(a => a.status === 0).length;
  const absentCount = attendance.filter(a => a.status === 1).length;
  const attendanceTotal = presentCount + absentCount;
  const attendancePct = attendanceTotal > 0 ? Math.round((presentCount / attendanceTotal) * 100) : null;

  const outstandingBalanceItem = notifications?.dynamicItems?.find(n => n.key === 'outstanding-balance');
  const unreadCount = notifications?.unreadPersistentCount ?? 0;

  // "Today's tasks" — everything actually waiting on the student, pulled from data already fetched.
  const todoItems = [
    ...pendingHomework.map(h => ({ type: 'homework', icon: 'edit_note', color: 'var(--accent-gold)', label: `واجب: ${h.title}`, sub: h.subjectName, onClick: () => navigate(`/homework/${h.id}`) })),
    ...resubmissionHymns.map(h => ({ type: 'hymn', icon: 'replay', color: 'var(--danger)', label: `إعادة تسجيل: ${h.hymnTitle}`, sub: h.comments, onClick: () => navigate('/hymn-lessons') })),
    ...(inProgressLesson ? [{ type: 'lesson', icon: 'play_circle', color: 'var(--accent-blue)', label: `أكمل مشاهدة: ${inProgressLesson.title}`, sub: `${Math.round(inProgressLesson.watchedPercent)}%`, onClick: () => navigate(`/hymn-lessons/${inProgressLesson.hymnLessonId}`) }] : []),
  ];

  // Recent activity — merge already-fetched sources, newest first. No new backend logic.
  const activity = [
    ...homework.filter(h => h.hasSubmitted).map(h => ({
      date: h.submittedAt, icon: 'edit_note', color: 'var(--accent-gold)',
      label: `تسليم واجب: ${h.title}${h.score != null ? ` — ${h.score}/${h.totalMarks}` : ' (بانتظار التصحيح)'}`,
    })),
    ...hymns.map(h => ({
      date: h.reviewedAt || h.submittedAt, icon: 'music_note', color: HYMN_STATUS_LABELS[h.status]?.color || 'var(--text-muted)',
      label: `تسجيل لحن: ${h.hymnTitle} — ${HYMN_STATUS_LABELS[h.status]?.label || h.status}`,
    })),
    ...attendance.slice(0, 5).map(a => ({
      date: a.recordedAt, icon: a.status === 0 ? 'check_circle' : 'cancel', color: a.status === 0 ? 'var(--success)' : 'var(--danger)',
      label: `${a.status === 0 ? 'حضور' : 'غياب'} — ${a.sessionTitle}`,
    })),
  ].filter(e => e.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  const insight = (icon, label, value, color, onClick) => (
    <div className={`glass-card ${onClick ? 'card-hover' : ''}`} style={{ padding: '1.1rem', textAlign: 'center', flex: 1, minWidth: '150px', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <span className="material-symbols-outlined" style={{ fontSize: '26px', color, marginBottom: '0.4rem', display: 'block' }}>{icon}</span>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontSize: '1.15rem', fontWeight: 700, color }}>{value}</div>
    </div>
  );

  const sectionHeader = (icon, title, onViewAll) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--accent-gold)' }}>{icon}</span>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{title}</h3>
      </div>
      {onViewAll && (
        <span onClick={onViewAll} style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          عرض الكل
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>chevron_left</span>
        </span>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Greeting header ──────────────────────────────────────────── */}
      <div className="glass-card card-hover" style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => navigate('/profile')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {profile?.profilePictureUrl ? (
              <img src={profile.profilePictureUrl.startsWith('http') ? profile.profilePictureUrl : `${BACKEND_URL}${profile.profilePictureUrl}`} alt="" style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-gold)' }} />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--accent-gold)' }}>account_circle</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: 'var(--accent-gold)', fontSize: '1.3rem' }}>أهلاً، {profile?.firstName}</h1>
            <p style={{ fontSize: '0.85rem' }}>{profile?.stageName} — {profile?.gradeName}{profile?.className ? ` — فصل ${profile.className}` : ''}</p>
          </div>
          {todoItems.length > 0 && (
            <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.8rem', borderRadius: '20px', background: 'rgba(251,191,36,0.14)', color: 'var(--accent-gold)', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {todoItems.length} مهمة بانتظارك
            </span>
          )}
        </div>
      </div>

      {/* ── Quick insights ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {insight('edit_note', 'نسبة إتمام الواجبات', formatPct(homeworkCompletionRate), 'var(--accent-gold)', () => navigate('/homework'))}
        {insight('music_note', 'متوسط الألحان', hymnsAverage != null ? `${hymnsAverage}%` : '—', performanceColor(hymnsAverage).color, () => navigate('/hymn-lessons'))}
        {insight('how_to_reg', 'نسبة الحضور', formatPct(attendancePct), performanceColor(attendancePct).color)}
        {insight('notifications', 'إشعارات غير مقروءة', unreadCount, unreadCount > 0 ? 'var(--accent-blue)' : 'var(--text-muted)', () => navigate('/notifications'))}
        {outstandingBalanceItem && insight('account_balance_wallet', 'مبلغ مستحق', outstandingBalanceItem.message || outstandingBalanceItem.title, 'var(--danger)')}
      </div>

      {/* ── Today's tasks ────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        {sectionHeader('checklist', 'مهامك الآن')}
        {todoItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--success)' }}>task_alt</span>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>لا توجد مهام معلّقة — أنت على اطلاع بكل شيء!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {todoItems.map((t, i) => (
              <div key={i} onClick={t.onClick} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.9rem', borderRadius: '8px', background: 'var(--surface-1)', cursor: t.onClick ? 'pointer' : 'default', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: t.color }}>{t.icon}</span>
                  <span>{t.label}</span>
                </div>
                {t.sub && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.sub}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Announcements ────────────────────────────────────────────── */}
      {announcements.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          {sectionHeader('campaign', 'الإعلانات')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {announcements.slice(0, 3).map(a => (
              <div key={a.id} style={{ padding: '0.6rem 0.9rem', borderRadius: '8px', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--accent-gold)' }}>{a.title}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{a.body}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{formatDate(a.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Achievements ──────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        {sectionHeader('emoji_events', 'الإنجازات', () => navigate('/my-certificates'))}
        {certificates.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>لا توجد شهادات بعد.</p>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {certificates.slice(0, 3).map(c => (
              <div key={c.id} onClick={() => navigate(`/certificates/${c.id}`)} className="glass-card card-hover" style={{ padding: '1rem', minWidth: '160px', flex: 1, textAlign: 'center', cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--accent-gold)' }}>military_tech</span>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.4rem' }}>{c.examTitle}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.percentage}% — {c.classification}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Recent activity ──────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        {sectionHeader('history', 'النشاط الأخير')}
        {activity.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>لا يوجد نشاط بعد.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {activity.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.55rem 0', borderBottom: i < activity.length - 1 ? '1px solid var(--surface-2)' : 'none' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: e.color, flexShrink: 0, marginTop: '0.15rem' }}>{e.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.83rem' }}>{e.label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatDate(e.date)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

const BIRTHDAYS_PAGE_SIZE = 3;
const MONTH_DAY_LABEL = (isoDate) => new Date(isoDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' });

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(null);
  const [birthdays, setBirthdays] = useState(null); // null = loading
  const [birthdayPage, setBirthdayPage] = useState(0);

  useEffect(() => {
    apiClient.get('/students/pending')
      .then(r => setPendingCount(r.data.length))
      .catch(() => setPendingCount(0));
    apiClient.get('/students/birthdays-this-month')
      .then(r => setBirthdays(r.data))
      .catch(() => setBirthdays([]));
  }, []);

  const birthdayPageCount = Math.ceil((birthdays?.length || 0) / BIRTHDAYS_PAGE_SIZE);
  const visibleBirthdays = (birthdays || []).slice(birthdayPage * BIRTHDAYS_PAGE_SIZE, (birthdayPage + 1) * BIRTHDAYS_PAGE_SIZE);

  const quickActions = [
    { icon: 'person_add',          title: 'تسجيل طالب جديد',     desc: 'إضافة بيانات عضو جديد للمدرسة',          path: '/register-student',        btnLabel: 'إضافة طالب' },
    { icon: 'group',               title: 'شؤون الأعضاء',         desc: 'استعرض وأدر كافة الأعضاء المسجلين',      path: '/students',                btnLabel: 'عرض الأعضاء' },
    { icon: 'groups',              title: 'توزيع الفصول',         desc: 'وزّع الطلاب على فصول متوازنة تلقائياً',   path: '/class-distribution',      btnLabel: 'توزيع الفصول' },
    { icon: 'import_contacts',     title: 'المناهج الدراسية',     desc: 'أنشئ مناهج وارفع ملفات PDF للمراحل',     path: '/curriculum-management',   btnLabel: 'إدارة المناهج' },
    { icon: 'music_note',          title: 'دروس الألحان',          desc: 'أضف دروس فيديو وكلمات الألحان',          path: '/hymn-lessons-management', btnLabel: 'إدارة الألحان' },
    { icon: 'graphic_eq',          title: 'تسجيلات الألحان',       desc: 'استمع لتسجيلات الطلاب وقيّمها',          path: '/hymn-submissions',        btnLabel: 'مراجعة التسجيلات' },
    { icon: 'edit_note',           title: 'الواجبات',              desc: 'ارفع مذاكرات وحدد إجابات الاختبارات',    path: '/homework-management',     btnLabel: 'إدارة الواجبات' },
    { icon: 'calendar_month',      title: 'السنوات الدراسية',      desc: 'أدر السنة الدراسية الحالية والسابقة',    path: '/academic-years',          btnLabel: 'السنوات الدراسية' },
    { icon: 'campaign',            title: 'الإعلانات',             desc: 'انشر وأدر إعلانات المدرسة',              path: '/announcements',           btnLabel: 'الإعلانات' },
  ];

  return (
    <>
      <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        أهلاً بك يا {user?.fullName || user?.userName}، إليك الإجراءات المتاحة في النظام
      </p>

      {/* Birthdays today — active students only (backend now filters to same day, not the whole month) */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ color: 'var(--accent-gold)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>cake</span>
            أعياد الميلاد
            {birthdays && birthdays.length > 0 && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>({birthdays.length})</span>
            )}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span onClick={() => navigate('/birthdays')} style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', cursor: 'pointer', fontWeight: 600 }}>
              عرض الكل
            </span>
          {birthdayPageCount > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={() => setBirthdayPage(p => Math.max(0, p - 1))} disabled={birthdayPage === 0}
                style={{ background: 'none', border: 'none', color: birthdayPage === 0 ? 'var(--text-muted)' : 'var(--accent-gold)', cursor: birthdayPage === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_right</span>
              </button>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{birthdayPage + 1} / {birthdayPageCount}</span>
              <button onClick={() => setBirthdayPage(p => Math.min(birthdayPageCount - 1, p + 1))} disabled={birthdayPage === birthdayPageCount - 1}
                style={{ background: 'none', border: 'none', color: birthdayPage === birthdayPageCount - 1 ? 'var(--text-muted)' : 'var(--accent-gold)', cursor: birthdayPage === birthdayPageCount - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chevron_left</span>
              </button>
            </div>
          )}
          </div>
        </div>

        {birthdays === null ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>جاري التحميل...</p>
        ) : birthdays.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>لا يوجد أعياد ميلاد اليوم</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {visibleBirthdays.map(b => (
              <div
                key={b.id}
                onClick={() => navigate(`/students/${b.id}`)}
                className="card-hover"
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: b.isToday ? 'rgba(251,191,36,0.08)' : 'var(--surface-1)' }}
              >
                {b.profilePictureUrl ? (
                  <img src={b.profilePictureUrl.startsWith('http') ? b.profilePictureUrl : `${BACKEND_URL}${b.profilePictureUrl}`} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-gold)', flexShrink: 0 }} />
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: '38px', color: 'var(--accent-gold)', flexShrink: 0 }}>account_circle</span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {b.fullName}
                    {b.isToday && <span title="عيد ميلاده اليوم">🎉</span>}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {b.stageName} — {b.gradeName}{b.className ? ` — فصل ${b.className}` : ''}
                  </div>
                </div>
                <div style={{ fontSize: '0.82rem', color: b.isToday ? 'var(--accent-gold)' : 'var(--text-secondary)', fontWeight: b.isToday ? 700 : 400, flexShrink: 0 }}>
                  {MONTH_DAY_LABEL(b.dateOfBirth)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* Pending approvals card — highlighted when action is needed */}
        <div className="glass-card card-hover" style={{
          padding: '1.25rem',
          border: pendingCount > 0 ? '1px solid rgba(251,191,36,0.45)' : undefined,
          background: pendingCount > 0 ? 'rgba(251,191,36,0.06)' : undefined,
        }} onClick={() => navigate('/pending-approvals')}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--accent-gold)' }}>how_to_reg</span>
              {pendingCount > 0 && (
                <span style={{ position: 'absolute', top: '-6px', left: '-6px', background: 'var(--danger-solid)', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {pendingCount}
                </span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ color: 'var(--accent-gold)', fontSize: '1rem', marginBottom: '0.25rem' }}>الموافقة على طلبات التسجيل</h3>
              <p style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                {pendingCount === null ? 'جاري التحميل...' : pendingCount > 0 ? `${pendingCount} طلب بانتظار مراجعتك` : 'لا توجد طلبات معلّقة حالياً'}
              </p>
              <button onClick={e => { e.stopPropagation(); navigate('/pending-approvals'); }} className="btn-primary"
                style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
                مراجعة الطلبات
              </button>
            </div>
          </div>
        </div>

        {quickActions.map((action, i) => (
          <div key={i} className="glass-card card-hover" style={{ padding: '1.25rem' }} onClick={() => navigate(action.path)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--accent-gold)' }}>{action.icon}</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: 'var(--accent-gold)', fontSize: '1rem', marginBottom: '0.25rem' }}>{action.title}</h3>
                <p style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>{action.desc}</p>
                <button onClick={e => { e.stopPropagation(); navigate(action.path); }} className="btn-primary"
                  style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
                  {action.btnLabel}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────

const DashboardScreen = () => {
  const { user } = useAuth();
  usePageTitle(user?.role === 'Student' ? 'لوحة الطالب' : 'لوحة التحكم');
  return user?.role === 'Student' ? <StudentDashboard /> : <AdminDashboard />;
};

export default DashboardScreen;
