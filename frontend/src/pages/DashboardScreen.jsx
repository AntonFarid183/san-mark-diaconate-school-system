import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../apiClient';
import Layout from '../Layout';

const genderLabels = { Male: 'ذكر', Female: 'أنثى' };

const StudentDashboard = () => {
  const { user } = useAuth();
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
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
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
  const pendingSubs = progress?.pendingSubmissions ?? 0;
  const recentLessons = progress?.recentLessons ?? [];

  return (
    <>
      {/* Student header card */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--accent-gold)' }}>account_circle</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ color: 'var(--accent-gold)', fontSize: '1.3rem' }}>{profile?.fullName || progress?.studentName}</h1>
              {progress?.studentCode && (
                <span style={{
                  fontSize: '0.75rem', padding: '0.2rem 0.6rem',
                  background: 'rgba(251, 191, 36, 0.15)', borderRadius: '20px',
                  color: 'var(--accent-gold)', fontWeight: 600, direction: 'ltr', display: 'inline-block',
                }}>{progress.studentCode}</span>
              )}
            </div>
            <p style={{ fontSize: '0.85rem' }}>{progress?.stageName} — {progress?.gradeName}</p>
          </div>
        </div>
      </div>

      {/* Progress ring + stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Circular progress ring */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
            <circle cx="70" cy="70" r="60" fill="none" stroke="var(--accent-gold)" strokeWidth="10"
              strokeDasharray={`${2 * Math.PI * 60}`}
              strokeDashoffset={`${2 * Math.PI * 60 * (1 - overallProgress / 100)}`}
              strokeLinecap="round" transform="rotate(-90, 70, 70)"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
            <text x="70" y="60" textAnchor="middle" fill="var(--text-primary)" fontSize="28" fontWeight="700">{Math.round(overallProgress)}%</text>
            <text x="70" y="80" textAnchor="middle" fill="var(--text-muted)" fontSize="11">التقدم العام</text>
          </svg>
        </div>

        {/* Stat cards */}
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
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: pendingSubs > 0 ? 'var(--warning)' : 'var(--success)' }}>pending_actions</span>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{pendingSubs}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>في انتظار المراجعة</div>
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

      {/* Quick links */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button className="btn-primary" style={{ width: 'auto', padding: '0.6rem 1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={() => navigate('/lessons')}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
          متابعة التعلم
        </button>
        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={() => navigate('/lessons')}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>menu_book</span>
          عرض الدروس
        </button>
      </div>
    </>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const roleLabels = { Admin: 'مدير النظام', Servant: 'خادم', Student: 'طالب' };

  const statsCards = [
    { icon: 'group', label: 'إجمالي الطلاب', value: '1,248', trend: '+12%', trendUp: true },
    { icon: 'payments', label: 'الرسوم المحصلة', value: '85%', trend: '+5%', trendUp: true },
    { icon: 'event_available', label: 'حضور القداس', value: '342', sub: 'اليوم' },
    { icon: 'assignment_turned_in', label: 'تسليم المهام', value: '92%', trend: '', trendUp: true },
  ];

  const quickActions = [
    { icon: 'person_add', title: 'تسجيل طالب جديد', desc: 'ابدأ إضافة بيانات الشماس الجديد', action: () => navigate('/register-student'), btnLabel: 'إضافة طالب' },
    { icon: 'format_list_bulleted', title: 'قائمة الطلاب', desc: 'استعرض كافة الطلاب المسجلين', action: () => navigate('/students'), btnLabel: 'عرض القائمة' },
    { icon: 'library_books', title: 'إدارة المحتوى', desc: 'أضف دروساً وملفات تعليمية جديدة', action: () => navigate('/content'), btnLabel: 'إدارة المحتوى' },
    { icon: 'library_music', title: 'مراجعة الألحان', desc: 'راجع تسليمات الألحان المعلقة', action: () => navigate('/hymns/review'), btnLabel: 'المراجعة' },
  ];

  const activities = [
    { icon: 'person_check', color: 'var(--success)', text: 'تم تسجيل "مينا عادل" بنجاح', sub: 'منذ ساعتين', time: '10:30 ص' },
    { icon: 'assignment', color: 'var(--accent-gold)', text: 'تحديث منهج الألحان القبطية', sub: 'المستوى الثاني - منذ 5 ساعات', time: '08:15 ص' },
    { icon: 'warning', color: 'var(--danger)', text: 'تنبيه غياب متكرر', sub: 'الطالب أبانوب كمال - 3 غيابات', time: 'أمس' },
  ];

  return (
    <>
      <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        أهلاً بك يا {roleLabels[user?.role] || 'خادم'}، إليك ملخص سريع لأداء مدرسة الشمامسة اليوم
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {statsCards.map((card, i) => (
          <div key={i} className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--accent-gold)' }}>{card.icon}</span>
              {card.trend && (
                <span style={{ fontSize: '0.75rem', color: card.trendUp ? 'var(--success)' : 'var(--danger)', background: card.trendUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '20px', fontWeight: 600 }}>{card.trend}</span>
              )}
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{card.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{card.sub || card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {quickActions.map((action, i) => (
            <div key={i} className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--accent-gold)' }}>{action.icon}</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: 'var(--accent-gold)', fontSize: '1rem', marginBottom: '0.25rem' }}>{action.title}</h3>
                  <p style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>{action.desc}</p>
                  <button onClick={action.action} className="btn-primary" style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                    {action.btnLabel}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--accent-gold)', fontSize: '1rem' }}>آخر النشاطات</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', cursor: 'pointer' }}>مشاهدة الكل</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activities.map((act, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', background: 'var(--glass-highlight)', borderRadius: 'var(--radius-sm)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px', color: act.color }}>{act.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{act.text}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{act.sub}</div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{act.time}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--glass-highlight)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>اكتمال التحصيل</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--accent-gold)' }}>75%</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>الرسوم الدراسية — الهدف: 50,000 ج.م</div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '75%', height: '100%', background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-gold-hover))', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const DashboardScreen = () => {
  const { user } = useAuth();

  if (user?.role === 'Student') {
    return (
      <Layout title="لوحة الطالب">
        <StudentDashboard />
      </Layout>
    );
  }

  return (
    <Layout title="لوحة التحكم">
      <AdminDashboard />
    </Layout>
  );
};

export default DashboardScreen;
