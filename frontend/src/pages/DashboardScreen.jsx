import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../apiClient';
import Layout from '../Layout';
import { BACKEND_URL } from '../config';

// ─── Student Dashboard ───────────────────────────────────────────────────────

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, progressRes] = await Promise.allSettled([
          apiClient.get('/students/me'),
          apiClient.get('/progress/dashboard'),
        ]);
        if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
        if (progressRes.status === 'fulfilled') setProgress(progressRes.value.data);
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>;

  const overallProgress = progress?.overallProgress ?? 0;
  const completed = progress?.completedLessons ?? 0;
  const total = progress?.totalLessons ?? 0;
  const completedItems = progress?.completedContentItems ?? 0;
  const totalItems = progress?.totalContentItems ?? 0;
  const avgScore = progress?.averageScore ?? null;
  const recentLessons = progress?.recentLessons ?? [];

  return (
    <>
      {/* Student header */}
      <div className="glass-card card-hover" style={{ padding: '1.5rem', marginBottom: '1.5rem', cursor: 'pointer' }} onClick={() => navigate('/profile')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {profile?.profilePictureUrl ? (
              <img src={profile.profilePictureUrl.startsWith('http') ? profile.profilePictureUrl : `${BACKEND_URL}${profile.profilePictureUrl}`} alt="" style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-gold)' }} />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--accent-gold)' }}>account_circle</span>
            )}
            {!profile?.profilePictureUrl && (
              <span style={{ position: 'absolute', top: 0, left: 0, width: '14px', height: '14px', background: 'var(--danger)', borderRadius: '50%', border: '2px solid var(--bg-primary)' }} />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ color: 'var(--accent-gold)', fontSize: '1.3rem' }}>{profile?.fullName || progress?.studentName}</h1>
              {progress?.studentCode && (
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(251,191,36,0.15)', borderRadius: '20px', color: 'var(--accent-gold)', fontWeight: 600, direction: 'ltr', display: 'inline-block' }}>
                  {progress.studentCode}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.85rem' }}>{progress?.stageName} — {progress?.gradeName}</p>
            {!profile?.profilePictureUrl && (
              <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                يجب رفع صورة شخصية — اضغط هنا
              </p>
            )}
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-muted)' }}>arrow_back</span>
        </div>
      </div>

      {/* Progress ring + stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
            <circle cx="70" cy="70" r="60" fill="none" stroke="var(--accent-gold)" strokeWidth="10"
              strokeDasharray={`${2 * Math.PI * 60}`}
              strokeDashoffset={`${2 * Math.PI * 60 * (1 - overallProgress / 100)}`}
              strokeLinecap="round" transform="rotate(-90, 70, 70)"
              style={{ transition: 'stroke-dashoffset 1s ease' }} />
            <text x="70" y="60" textAnchor="middle" fill="var(--text-primary)" fontSize="28" fontWeight="700">{Math.round(overallProgress)}%</text>
            <text x="70" y="80" textAnchor="middle" fill="var(--text-muted)" fontSize="11">التقدم العام</text>
          </svg>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--accent-gold)' }}>menu_book</span>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{completed}/{total}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>الدروس المكتملة</div>
              </div>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--accent-gold)' }}>description</span>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{completedItems}/{totalItems}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>المحتوى المُنجز</div>
              </div>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--accent-gold)' }}>star</span>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{avgScore !== null ? `${avgScore}%` : '—'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>متوسط الدرجات</div>
              </div>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '1.25rem', cursor: 'pointer' }} onClick={() => navigate('/progress')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--accent-gold)' }}>trending_up</span>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>عرض التفاصيل</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>صفحة التقدم</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent lessons */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h3 style={{ color: 'var(--accent-gold)', fontSize: '1rem', marginBottom: '1rem' }}>آخر الدروس</h3>
        {recentLessons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--text-muted)' }}>school</span>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>لا توجد بيانات بعد، ابدأ بتصفح الدروس</p>
            <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 2rem', marginTop: '1rem', fontSize: '0.9rem' }}
              onClick={() => navigate('/lessons')}>تصفح الدروس</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '1rem', overflow: 'auto', paddingBottom: '0.5rem' }}>
            {recentLessons.map((lesson, i) => (
              <div key={i} className="glass-card" style={{ minWidth: '200px', padding: '1rem', cursor: 'pointer' }}
                onClick={() => navigate(`/lessons/${lesson.lessonId}`)}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>{lesson.lessonTitle}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {lesson.completedItems}/{lesson.totalItems}
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${lesson.progressPercent}%`, height: '100%', background: 'var(--accent-gold)', borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links — only working screens */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {[
          { path: '/lessons', icon: 'arrow_forward', label: 'متابعة التعلم', primary: true },
          { path: '/curriculum', icon: 'import_contacts', label: 'المناهج' },
          { path: '/hymn-lessons', icon: 'music_note', label: 'دروس الألحان' },
          { path: '/homework', icon: 'edit_note', label: 'الواجبات' },
          { path: '/my-results', icon: 'assignment', label: 'نتائجي' },
          { path: '/profile', icon: 'manage_accounts', label: 'الملف الشخصي' },
        ].map(({ path, icon, label, primary }) => (
          <button key={path}
            className={primary ? 'btn-primary' : 'btn-secondary'}
            style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => navigate(path)}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </>
  );
};

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(null);

  useEffect(() => {
    apiClient.get('/students/pending')
      .then(r => setPendingCount(r.data.length))
      .catch(() => setPendingCount(0));
  }, []);

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
                <span style={{ position: 'absolute', top: '-6px', left: '-6px', background: 'var(--danger)', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.68rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
  return user?.role === 'Student'
    ? <Layout title="لوحة الطالب"><StudentDashboard /></Layout>
    : <Layout title="لوحة التحكم"><AdminDashboard /></Layout>;
};

export default DashboardScreen;
