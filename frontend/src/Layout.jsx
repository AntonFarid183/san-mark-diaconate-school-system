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
const MOBILE_BREAKPOINT = 860; // below this the sidebar becomes an off-canvas drawer for every role

// Tracks whether the viewport is narrow enough to need the drawer sidebar,
// kept in one hook so it's a single source of truth for both the sidebar
// itself and the main-content margin/padding that has to match it.
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return isMobile;
};

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
  const isMobile = useIsMobile();
  // Separate from `open` (which controls the desktop icon-strip collapse):
  // on mobile the sidebar is off-canvas entirely, shown/hidden by this instead.
  const [mobileOpen, setMobileOpen] = useState(false);
  const [gradesOpen, setGradesOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [grades, setGrades] = useState([]);
  const [pendingHomeworkCount, setPendingHomeworkCount] = useState(0);
  const [hasProfilePhoto, setHasProfilePhoto] = useState(true);

  const roleLabels = { Admin: 'مدير النظام', Student: 'طالب' };
  const isStudent = user?.role === 'Student';
  // Students always see the full sidebar on desktop — collapsing to a bare icon
  // strip adds a decision a young student shouldn't have to make. On mobile this
  // distinction doesn't apply: the sidebar is off-canvas for every role instead.
  const sidebarWidth = isStudent ? EXPANDED_WIDTH : (open ? EXPANDED_WIDTH : COLLAPSED_WIDTH);
  // The mobile drawer is always full-width when shown, so nav items should
  // render "expanded" (labels visible, not just icons) regardless of the
  // desktop icon-strip collapse state.
  const navOpen = isMobile || open;

  // Auto-close the mobile drawer on every navigation, so tapping a link doesn't
  // leave the drawer covering the page it just navigated to.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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
    { path: '/student-cards', label: 'كارنيهات الطلاب', icon: 'badge' },
    { path: '/birthdays', label: 'أعياد الميلاد', icon: 'cake' },
  ];

  const adminItems = [
    { path: '/student-performance', label: 'لوحة أداء الطلاب', icon: 'insights' },
    { path: '/academic-years', label: 'السنوات الدراسية', icon: 'calendar_month' },
    { path: '/class-distribution', label: 'توزيع الفصول', icon: 'groups' },
    { path: '/curriculum-management', label: 'المناهج', icon: 'import_contacts' },
    { path: '/homework-management', label: 'إدارة الواجبات', icon: 'edit_note' },
    { path: '/announcements', label: 'الإعلانات', icon: 'campaign' },
    { path: '/feedback', label: 'الاقتراحات والتعليقات', icon: 'forum' },
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
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', direction: 'rtl' }}>
      {/* Backdrop lives in its own layer so the photo can be tone-mapped
          (see .app-backdrop) rather than just hidden under a heavy wash. */}
      <div className="app-backdrop" aria-hidden="true" />

      {/* Backdrop behind the mobile drawer — tapping it closes the sidebar,
          same as tapping outside any off-canvas panel. Desktop never renders it. */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
        />
      )}

      {/* Sidebar — on mobile this is always full EXPANDED_WIDTH but slides
          off-canvas (translateX) when closed, instead of the desktop
          collapse-to-icon-strip behavior, so every role gets the same
          full-width, easy-to-read drawer regardless of the admin/student split. */}
      <aside style={{
        width: isMobile ? EXPANDED_WIDTH : sidebarWidth,
        maxWidth: isMobile ? '85vw' : undefined,
        background: 'var(--app-sidebar-bg)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderLeft: '1px solid var(--gold-tint)',
        boxShadow: '-4px 0 32px var(--shadow-tint)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, right: 0,
        height: '100vh', zIndex: 100,
        overflowY: 'auto', overflowX: 'hidden',
        transform: isMobile ? `translateX(${mobileOpen ? '0' : '100%'})` : 'none',
        transition: isMobile ? 'transform 0.25s ease' : 'width 0.25s ease',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* Logo */}
          <div style={{ borderBottom: '1px solid var(--surface-2)', position: 'relative' }}>
            {/* On mobile this is a close (X) button, shown for every role since the
                drawer covers the whole page. On desktop it's the existing
                collapse-to-icon-strip toggle, still hidden for students. */}
            {(isMobile || !isStudent) && (
              <button onClick={() => isMobile ? setMobileOpen(false) : setOpen(o => !o)} className="tap-target" style={{ position: 'absolute', top: '0.75rem', left: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-gold)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{isMobile ? 'close' : (open ? 'menu_open' : 'menu')}</span>
              </button>
            )}
            <div onClick={() => navigate('/dashboard')} style={{ padding: navOpen ? '1.25rem 1rem' : '1rem 0', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ChurchLogo size={navOpen ? 52 : 36} />
              {navOpen && (
                <>
                  <h2 style={{ color: 'var(--accent-gold)', marginTop: '0.4rem', fontSize: '0.88rem', lineHeight: 1.4 }}>مدرسة بي ثيؤريموس للألحان والتسبحة</h2>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>كنيسة العذراء القديسة مريم والقديس مارمرقس - النزهة 2</p>
                </>
              )}
            </div>
          </div>

          {/* Nav */}
          <nav aria-label={isStudent ? 'التنقل الرئيسي للطالب' : 'التنقل الرئيسي'} style={{ flex: 1, padding: isStudent ? '1rem 0.85rem' : (navOpen ? '1rem' : '0.75rem 0.5rem'), display: 'flex', flexDirection: 'column', gap: isStudent ? 0 : '0.25rem' }}>

            {isStudent && (
              <StudentNavButton icon="home" label="الرئيسية" color={STUDENT_COLORS.home} isActive={location.pathname === '/dashboard'} onClick={() => navigate('/dashboard')} />
            )}

            {!isStudent && (
              <NavButton icon="dashboard" label="لوحة التحكم" isActive={location.pathname === '/dashboard'} open={navOpen} onClick={() => navigate('/dashboard')} />
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
                    onClick={() => navOpen && setGradesOpen(o => !o)}
                    title={!navOpen ? 'شؤون الطلاب' : undefined}
                    style={{
                      display: 'flex', alignItems: 'center',
                      gap: navOpen ? '0.75rem' : '0',
                      justifyContent: navOpen ? 'flex-start' : 'center',
                      padding: navOpen ? '0.65rem 1rem' : '0.75rem',
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
                    {navOpen && <span style={{ flex: 1 }}>شؤون الطلاب</span>}
                    {navOpen && <span className="material-symbols-outlined" style={{ fontSize: '18px', transition: 'transform 0.2s', transform: gradesOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>chevron_left</span>}
                  </button>

                  {/* Sub-items */}
                  {navOpen && gradesOpen && (
                    <div style={{ marginTop: '0.15rem', marginBottom: '0.15rem' }}>
                      {/* Fixed links */}
                      {studentItems.map(item => (
                        <NavButton key={item.path} icon={item.icon} label={item.label} isActive={location.pathname === item.path && !activeGradeId} open={navOpen} onClick={() => navigate(item.path)} indent />
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
                                  open={navOpen}
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
                            open={navOpen}
                            onClick={() => navigate(`/students?stageId=${stage.id}&gradeName=${encodeURIComponent(stage.label)}`)}
                            indent
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {adminItems.map(item => (
                  <NavButton key={item.path} icon={item.icon} label={item.label} isActive={location.pathname === item.path} open={navOpen} onClick={() => navigate(item.path)} />
                ))}

                {navGroups.map(group => (
                  <NavGroup
                    key={group.key}
                    groupKey={group.key}
                    icon={group.icon}
                    label={group.label}
                    items={group.items}
                    open={navOpen}
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
          <div style={{ padding: navOpen ? '1rem' : '0.75rem 0.5rem', borderTop: '1px solid var(--surface-2)' }}>
            <button onClick={() => {
              logout();
              // Deferred: logging out flips ProtectedRoute's redirect-to-/login for the
              // still-mounted admin route in the same commit — navigating here last,
              // after that settles, ensures landing-page is the final destination.
              setTimeout(() => navigate('/'), 0);
            }}
              title={!navOpen ? 'تسجيل الخروج' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: navOpen ? '0.75rem' : '0',
                justifyContent: navOpen ? 'flex-start' : 'center',
                padding: navOpen ? '0.75rem 1rem' : '0.75rem',
                borderRadius: 'var(--radius-sm)', border: 'none',
                background: 'transparent', color: 'var(--danger)',
                fontFamily: 'inherit', fontSize: '0.93rem', fontWeight: 600,
                cursor: 'pointer', width: '100%', textAlign: 'right',
              }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>logout</span>
              {navOpen && 'تسجيل الخروج'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content — full width on mobile regardless of role, since the
          sidebar is off-canvas there rather than pushing content over. Padding
          also shrinks on mobile: 2rem on both sides was eating a big chunk of
          an already-narrow screen for no reason. */}
      <main style={{
        flex: 1,
        marginRight: isMobile ? 0 : sidebarWidth,
        padding: isMobile ? '1rem' : '2rem',
        minHeight: '100vh',
        maxWidth: '100vw',
        overflowX: 'hidden',
        transition: 'margin-right 0.25s ease',
        position: 'relative', zIndex: 1,
      }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            {/* The only way to open the drawer on mobile -- the in-sidebar toggle
                is unreachable while the sidebar itself is off-canvas. Shown for
                every role, unlike the desktop collapse toggle. */}
            {isMobile && (
              <button onClick={() => setMobileOpen(true)} className="tap-target" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>menu</span>
              </button>
            )}
            <h1 style={{ color: 'var(--accent-gold)', fontSize: isMobile ? '1.15rem' : '1.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title || ''}</h1>
          </div>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <ThemeToggle />
              <NotificationBell />
              {!isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--accent-gold)' }}>account_circle</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.fullName || user.userName}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{roleLabels[user.role] || user.role}</div>
                  </div>
                </div>
              )}
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
