import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import apiClient from './apiClient';
import NotificationBell from './components/NotificationBell';
import ThemeToggle from './components/ThemeToggle';
import ChurchLogo from './components/ChurchLogo';
import { PageTitleProvider } from './context/PageTitleContext';

const COLLAPSED_WIDTH = '64px';
const EXPANDED_WIDTH = '260px';

const NavButton = ({ icon, label, isActive, open, onClick, indent = false, badge }) => (
  <button
    onClick={onClick}
    className="nav-item"
    title={!open ? label : undefined}
    style={{
      display: 'flex', alignItems: 'center',
      gap: open ? '0.75rem' : '0',
      justifyContent: open ? 'flex-start' : 'center',
      padding: open ? `0.65rem ${indent ? '1rem' : '1rem'} 0.65rem ${indent ? '2rem' : '1rem'}` : '0.75rem',
      borderRadius: 'var(--radius-sm)', border: 'none',
      background: isActive ? 'rgba(251,191,36,0.1)' : 'transparent',
      color: isActive ? 'var(--accent-gold)' : indent ? 'var(--text-muted)' : 'var(--text-secondary)',
      fontFamily: 'inherit', fontSize: indent ? '0.83rem' : '0.93rem',
      fontWeight: isActive ? 700 : 500,
      cursor: 'pointer', width: '100%', textAlign: 'right',
      whiteSpace: 'nowrap', overflow: 'hidden', position: 'relative',
    }}
  >
    {isActive && !indent && (
      <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '60%', background: 'var(--accent-gold)', borderRadius: '0 3px 3px 0' }} />
    )}
    <span className="material-symbols-outlined" style={{ fontSize: indent ? '18px' : '22px', flexShrink: 0 }}>{icon}</span>
    {open && <span style={{ flex: 1 }}>{label}</span>}
    {open && badge != null && (
      <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', background: 'rgba(251,191,36,0.15)', borderRadius: '10px', color: 'var(--accent-gold)', fontWeight: 700 }}>{badge}</span>
    )}
  </button>
);

// ── Student sidebar — deliberately different from the admin one: always
// expanded (no collapse-to-icon-strip), flat (no nested/collapsible groups),
// bigger touch targets, one color per life-area so a 6-year-old and a
// 30-year-old can both scan it in a second, and section labels instead of
// admin's accordions to organize without adding a click. ────────────────────
const StudentSectionLabel = ({ label }) => (
  <div style={{ padding: '1.1rem 0.75rem 0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.03em' }}>
    {label}
  </div>
);

const StudentNavButton = ({ icon, label, subtitle, color, isActive, onClick, badge }) => (
  <button
    onClick={onClick}
    aria-current={isActive ? 'page' : undefined}
    className="student-nav-item"
    style={{
      display: 'flex', alignItems: 'center', gap: '0.9rem',
      padding: '0.85rem 0.9rem',
      minHeight: '52px',
      borderRadius: 'var(--radius-md)', border: 'none',
      background: isActive ? `color-mix(in srgb, ${color} 12%, transparent)` : 'transparent',
      color: 'var(--text-primary)',
      fontFamily: 'inherit',
      cursor: 'pointer', width: '100%', textAlign: 'right',
      position: 'relative', marginBottom: '0.3rem',
    }}
    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-2)'; }}
    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
  >
    {isActive && (
      <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: '4px', height: '65%', background: color, borderRadius: '0 4px 4px 0' }} />
    )}
    <span
      className="material-symbols-outlined"
      aria-hidden="true"
      style={{
        fontSize: '24px', flexShrink: 0, color,
        width: '38px', height: '38px', borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >{icon}</span>
    <span style={{ flex: 1, minWidth: 0 }}>
      <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: isActive ? 700 : 600 }}>{label}</span>
      {subtitle && <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{subtitle}</span>}
    </span>
    {badge > 0 && (
      <span style={{ fontSize: '0.75rem', minWidth: '22px', height: '22px', padding: '0 0.4rem', background: 'var(--danger-solid)', color: '#fff', borderRadius: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {badge}
      </span>
    )}
  </button>
);

const NavGroup = ({ icon, label, items, open, isActive, location, navigate, expandedGroup, setExpandedGroup, groupKey }) => {
  const isExpanded = expandedGroup === groupKey;
  return (
    <div>
      <button
        onClick={() => open && setExpandedGroup(g => g === groupKey ? null : groupKey)}
        title={!open ? label : undefined}
        style={{
          display: 'flex', alignItems: 'center',
          gap: open ? '0.75rem' : '0',
          justifyContent: open ? 'flex-start' : 'center',
          padding: open ? '0.65rem 1rem' : '0.75rem',
          borderRadius: 'var(--radius-sm)', border: 'none',
          background: isActive ? 'rgba(251,191,36,0.1)' : 'transparent',
          color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
          fontFamily: 'inherit', fontSize: '0.93rem', fontWeight: isActive ? 700 : 500,
          cursor: 'pointer', width: '100%', textAlign: 'right',
          whiteSpace: 'nowrap', overflow: 'hidden', position: 'relative',
        }}
      >
        {isActive && (
          <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '60%', background: 'var(--accent-gold)', borderRadius: '0 3px 3px 0' }} />
        )}
        <span className="material-symbols-outlined" style={{ fontSize: '22px', flexShrink: 0 }}>{icon}</span>
        {open && <span style={{ flex: 1 }}>{label}</span>}
        {open && <span className="material-symbols-outlined" style={{ fontSize: '18px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>chevron_left</span>}
      </button>

      {open && isExpanded && (
        <div style={{ marginTop: '0.15rem', marginBottom: '0.15rem' }}>
          {items.map(item => (
            <NavButton key={item.path} icon={item.icon} label={item.label} isActive={location.pathname === item.path} open={open} onClick={() => navigate(item.path)} indent />
          ))}
        </div>
      )}
    </div>
  );
};

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const [gradesOpen, setGradesOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [grades, setGrades] = useState([]);
  const [pendingHomeworkCount, setPendingHomeworkCount] = useState(0);
  const [hasProfilePhoto, setHasProfilePhoto] = useState(true);

  const roleLabels = { Admin: 'مدير النظام', Student: 'طالب' };
  const isStudent = user?.role === 'Student';
  // Students always see the full sidebar — collapsing to a bare icon strip
  // adds a decision a young student shouldn't have to make.
  const sidebarWidth = isStudent ? EXPANDED_WIDTH : (open ? EXPANDED_WIDTH : COLLAPSED_WIDTH);

  // All stages — same order as registration form
  const ALL_STAGES = [
    { id: '00000000-0000-0000-0000-000000000001', label: 'طفولة',   hasSubGrades: true  },
    { id: '00000000-0000-0000-0001-000000000001', label: 'ابتدائي', hasSubGrades: true  },
    { id: '00000000-0000-0000-0002-000000000001', label: 'إعدادي',  hasSubGrades: true  },
    { id: '00000000-0000-0000-0003-000000000001', label: 'ثانوي',   hasSubGrades: true  },
    { id: '00000000-0000-0000-0004-000000000001', label: 'جامعة',   hasSubGrades: false },
    { id: '00000000-0000-0000-0005-000000000001', label: 'خريجون',  hasSubGrades: false },
    { id: '00000000-0000-0000-0006-000000000001', label: 'كبار',    hasSubGrades: false },
  ];

  useEffect(() => {
    if (user?.role === 'Admin') {
      apiClient.get('/students/grades').then(r => setGrades(r.data)).catch(() => {});
    }
    if (isStudent) {
      apiClient.get('/homework/my')
        .then(r => setPendingHomeworkCount(r.data.filter(h => !h.hasSubmitted).length))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  useEffect(() => {
    const activeGroup = navGroups.find(g => g.items.some(i => i.path === location.pathname));
    if (activeGroup) setExpandedGroup(activeGroup.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // A profile picture is mandatory for students — re-checked on every
  // navigation so it clears itself right after they upload one on /profile.
  useEffect(() => {
    if (!isStudent) return;
    apiClient.get('/students/me')
      .then(r => setHasProfilePhoto(!!r.data.profilePictureUrl))
      .catch(() => {});
  }, [isStudent, location.pathname]);

  useEffect(() => {
    if (isStudent && !hasProfilePhoto && location.pathname !== '/profile' && location.pathname !== '/change-password') {
      navigate('/profile', { replace: true });
    }
  }, [isStudent, hasProfilePhoto, location.pathname, navigate]);

  // Group DB grades by stageId
  const gradesByStageId = grades.reduce((acc, g) => {
    if (!acc[g.stageId]) acc[g.stageId] = [];
    acc[g.stageId].push(g);
    return acc;
  }, {});

  const studentItems = [
    { path: '/students', label: 'جميع الطلاب', icon: 'group' },
    { path: '/register-student', label: 'تسجيل طالب جديد', icon: 'person_add' },
    { path: '/pending-approvals', label: 'طلبات التسجيل', icon: 'pending_actions' },
    { path: '/payment-reports', label: 'تقرير المدفوعات', icon: 'account_balance' },
  ];

  const adminItems = [
    { path: '/student-performance', label: 'لوحة أداء الطلاب', icon: 'insights' },
    { path: '/academic-years', label: 'السنوات الدراسية', icon: 'calendar_month' },
    { path: '/class-distribution', label: 'توزيع الفصول', icon: 'groups' },
    { path: '/curriculum-management', label: 'المناهج', icon: 'import_contacts' },
    { path: '/homework-management', label: 'إدارة الواجبات', icon: 'edit_note' },
    { path: '/announcements', label: 'الإعلانات', icon: 'campaign' },
  ];

  const navGroups = [
    {
      key: 'hymns', icon: 'music_note', label: 'الألحان',
      items: [
        { path: '/hymn-lessons-management', label: 'دروس الألحان', icon: 'music_note' },
        { path: '/hymn-submissions', label: 'مراجعة التسجيلات', icon: 'graphic_eq' },
      ],
    },
    {
      key: 'attendance', icon: 'how_to_reg', label: 'الحضور',
      items: [
        { path: '/attendance/sessions', label: 'تسجيل الحضور', icon: 'how_to_reg' },
        { path: '/attendance/dashboard', label: 'لوحة الحضور', icon: 'fact_check' },
      ],
    },
  ];

  // One color per life-area (not per item) so the sidebar reads as a small
  // number of "places" rather than a long uniform list — helps orientation
  // for both a young student and an adult skimming quickly.
  const STUDENT_COLORS = { home: 'var(--accent-gold)', learn: 'var(--accent-blue)', tasks: 'var(--accent-amber)', progress: 'var(--accent-violet)', account: 'var(--text-muted)' };

  // Trimmed to only the features that are actually wired up end-to-end —
  // no dead links to pages without real backing logic yet. Just four items
  // plus Home, so a single flat list (no section labels needed).
  const studentSections = [
    {
      label: null,
      items: [
        { path: '/hymn-lessons', label: 'دروس الألحان', subtitle: 'استمع وتعلّم الألحان', icon: 'music_note', color: STUDENT_COLORS.learn },
        { path: '/curriculum', label: 'المناهج', subtitle: 'ملفات المنهج الدراسي', icon: 'import_contacts', color: STUDENT_COLORS.learn },
        { path: '/homework', label: 'واجباتي', subtitle: 'الواجبات المطلوبة منك', icon: 'edit_note', color: STUDENT_COLORS.tasks, badge: pendingHomeworkCount },
        { path: '/profile', label: 'ملفي الشخصي', icon: 'account_circle', color: STUDENT_COLORS.account },
      ],
    },
  ];

  const isStudentsActive = location.pathname.startsWith('/students') || location.pathname === '/register-student' || location.pathname === '/pending-approvals';
  const searchParams = new URLSearchParams(location.search);
  const activeGradeId = searchParams.get('gradeId');

  return (
    <PageTitleProvider>
      {(title) => (
    <div style={{
      display: 'flex', minHeight: '100vh', direction: 'rtl',
      backgroundImage: 'linear-gradient(var(--app-wash), var(--app-wash)), url(/san-mark-wide.png)',
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
    }}>

      {/* Sidebar */}
      <aside style={{
        width: sidebarWidth,
        background: 'var(--app-sidebar-bg)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderLeft: '1px solid var(--gold-tint)',
        boxShadow: '-4px 0 32px var(--shadow-tint)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, right: 0,
        height: '100vh', zIndex: 100,
        overflowY: 'auto', overflowX: 'hidden',
        transition: 'width 0.25s ease',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* Logo */}
          <div style={{ borderBottom: '1px solid var(--surface-2)', position: 'relative' }}>
            {!isStudent && (
              <button onClick={() => setOpen(o => !o)} style={{ position: 'absolute', top: '0.75rem', left: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-gold)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{open ? 'menu_open' : 'menu'}</span>
              </button>
            )}
            <div onClick={() => navigate('/dashboard')} style={{ padding: open ? '1.25rem 1rem' : '1rem 0', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ChurchLogo size={open ? 52 : 36} />
              {open && (
                <>
                  <h2 style={{ color: 'var(--accent-gold)', marginTop: '0.4rem', fontSize: '0.88rem', lineHeight: 1.4 }}>مدرسة بي ثيؤريموس للألحان والتسبحة</h2>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>كنيسة العذراء القديسة مريم والقديس مارمرقس - النزهة 2</p>
                </>
              )}
            </div>
          </div>

          {/* Nav */}
          <nav aria-label={isStudent ? 'التنقل الرئيسي للطالب' : 'التنقل الرئيسي'} style={{ flex: 1, padding: isStudent ? '1rem 0.85rem' : (open ? '1rem' : '0.75rem 0.5rem'), display: 'flex', flexDirection: 'column', gap: isStudent ? 0 : '0.25rem' }}>

            {isStudent && (
              <StudentNavButton icon="home" label="الرئيسية" color={STUDENT_COLORS.home} isActive={location.pathname === '/dashboard'} onClick={() => navigate('/dashboard')} />
            )}

            {!isStudent && (
              <NavButton icon="dashboard" label="لوحة التحكم" isActive={location.pathname === '/dashboard'} open={open} onClick={() => navigate('/dashboard')} />
            )}

            {isStudent ? (
              studentSections.map((section, i) => (
                <div key={i}>
                  {section.label && <StudentSectionLabel label={section.label} />}
                  {section.items.map(item => (
                    <StudentNavButton
                      key={item.path}
                      icon={item.icon}
                      label={item.label}
                      subtitle={item.subtitle}
                      color={item.color}
                      badge={item.badge}
                      isActive={location.pathname === item.path}
                      onClick={() => navigate(item.path)}
                    />
                  ))}
                </div>
              ))
            ) : user?.role === 'Admin' ? (
              <>
                {/* شؤون الطلاب collapsible group */}
                <div>
                  <button
                    onClick={() => open && setGradesOpen(o => !o)}
                    title={!open ? 'شؤون الطلاب' : undefined}
                    style={{
                      display: 'flex', alignItems: 'center',
                      gap: open ? '0.75rem' : '0',
                      justifyContent: open ? 'flex-start' : 'center',
                      padding: open ? '0.65rem 1rem' : '0.75rem',
                      borderRadius: 'var(--radius-sm)', border: 'none',
                      background: isStudentsActive ? 'rgba(251,191,36,0.1)' : 'transparent',
                      color: isStudentsActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                      fontFamily: 'inherit', fontSize: '0.93rem', fontWeight: isStudentsActive ? 700 : 500,
                      cursor: 'pointer', width: '100%', textAlign: 'right',
                      whiteSpace: 'nowrap', overflow: 'hidden', position: 'relative',
                    }}
                  >
                    {isStudentsActive && (
                      <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '60%', background: 'var(--accent-gold)', borderRadius: '0 3px 3px 0' }} />
                    )}
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', flexShrink: 0 }}>school</span>
                    {open && <span style={{ flex: 1 }}>شؤون الطلاب</span>}
                    {open && <span className="material-symbols-outlined" style={{ fontSize: '18px', transition: 'transform 0.2s', transform: gradesOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>chevron_left</span>}
                  </button>

                  {/* Sub-items */}
                  {open && gradesOpen && (
                    <div style={{ marginTop: '0.15rem', marginBottom: '0.15rem' }}>
                      {/* Fixed links */}
                      {studentItems.map(item => (
                        <NavButton key={item.path} icon={item.icon} label={item.label} isActive={location.pathname === item.path && !activeGradeId} open={open} onClick={() => navigate(item.path)} indent />
                      ))}

                      {/* Stages + grades */}
                      <div style={{ padding: '0.5rem 1rem 0.25rem 1rem', fontSize: '0.7rem', color: 'rgba(251,191,36,0.5)', fontWeight: 700, letterSpacing: '0.05em' }}>
                        المراحل الدراسية
                      </div>
                      {ALL_STAGES.map(stage => {
                        const subGrades = gradesByStageId[stage.id] || [];
                        const activeStageId = searchParams.get('stageId');
                        const isStageActive = activeStageId === stage.id && !activeGradeId;

                        if (stage.hasSubGrades && subGrades.length > 0) {
                          return (
                            <div key={stage.id}>
                              <div style={{ padding: '0.25rem 1rem 0.1rem 2rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>{stage.label}</div>
                              {subGrades.map(grade => (
                                <NavButton
                                  key={grade.id}
                                  icon="class"
                                  label={grade.name}
                                  isActive={activeGradeId === grade.id}
                                  open={open}
                                  onClick={() => navigate(`/students?gradeId=${grade.id}&gradeName=${encodeURIComponent(grade.name)}`)}
                                  indent
                                />
                              ))}
                            </div>
                          );
                        }

                        return (
                          <NavButton
                            key={stage.id}
                            icon="class"
                            label={stage.label}
                            isActive={isStageActive}
                            open={open}
                            onClick={() => navigate(`/students?stageId=${stage.id}&gradeName=${encodeURIComponent(stage.label)}`)}
                            indent
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {adminItems.map(item => (
                  <NavButton key={item.path} icon={item.icon} label={item.label} isActive={location.pathname === item.path} open={open} onClick={() => navigate(item.path)} />
                ))}

                {navGroups.map(group => (
                  <NavGroup
                    key={group.key}
                    groupKey={group.key}
                    icon={group.icon}
                    label={group.label}
                    items={group.items}
                    open={open}
                    isActive={group.items.some(i => i.path === location.pathname)}
                    location={location}
                    navigate={navigate}
                    expandedGroup={expandedGroup}
                    setExpandedGroup={setExpandedGroup}
                  />
                ))}
              </>
            ) : null}
          </nav>

          {/* Logout */}
          <div style={{ padding: open ? '1rem' : '0.75rem 0.5rem', borderTop: '1px solid var(--surface-2)' }}>
            <button onClick={() => {
              logout();
              // Deferred: logging out flips ProtectedRoute's redirect-to-/login for the
              // still-mounted admin route in the same commit — navigating here last,
              // after that settles, ensures landing-page is the final destination.
              setTimeout(() => navigate('/'), 0);
            }}
              title={!open ? 'تسجيل الخروج' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: open ? '0.75rem' : '0',
                justifyContent: open ? 'flex-start' : 'center',
                padding: open ? '0.75rem 1rem' : '0.75rem',
                borderRadius: 'var(--radius-sm)', border: 'none',
                background: 'transparent', color: 'var(--danger)',
                fontFamily: 'inherit', fontSize: '0.93rem', fontWeight: 600,
                cursor: 'pointer', width: '100%', textAlign: 'right',
              }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>logout</span>
              {open && 'تسجيل الخروج'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, marginRight: sidebarWidth, padding: '2rem', minHeight: '100vh', transition: 'margin-right 0.25s ease' }}>
        {isStudent && !hasProfilePhoto && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem',
            padding: '0.9rem 1.25rem', borderRadius: 'var(--radius-md)',
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--c-red)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px', flexShrink: 0 }}>account_circle</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              مطلوب رفع صورة شخصية لإكمال حسابك — من فضلك ارفع صورتك بالأسفل قبل استخدام باقي الموقع.
            </span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
          <h1 style={{ color: 'var(--accent-gold)', fontSize: '1.5rem' }}>{title || ''}</h1>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ThemeToggle />
              <NotificationBell />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--accent-gold)' }}>account_circle</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.fullName || user.userName}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{roleLabels[user.role] || user.role}</div>
                </div>
              </div>
            </div>
          )}
        </div>
        <Outlet />
      </main>
    </div>
      )}
    </PageTitleProvider>
  );
};

export default Layout;
