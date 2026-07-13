import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import apiClient from './apiClient';
import NotificationBell from './components/NotificationBell';

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

const Layout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const [gradesOpen, setGradesOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [grades, setGrades] = useState([]);

  const roleLabels = { Admin: 'مدير النظام', Student: 'طالب' };
  const sidebarWidth = open ? EXPANDED_WIDTH : COLLAPSED_WIDTH;

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
  }, [user?.role]);

  useEffect(() => {
    const activeGroup = navGroups.find(g => g.items.some(i => i.path === location.pathname));
    if (activeGroup) setExpandedGroup(activeGroup.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

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
        { path: '/attendance/sessions', label: 'جلسات الحضور', icon: 'how_to_reg' },
        { path: '/attendance/dashboard', label: 'لوحة الحضور', icon: 'fact_check' },
        { path: '/attendance/leaves', label: 'طلبات الإجازة', icon: 'event_note' },
      ],
    },
  ];

  const studentNavItems = [
    { path: '/lessons', label: 'الدروس', icon: 'menu_book' },
    { path: '/curriculum', label: 'المناهج', icon: 'import_contacts' },
    { path: '/hymn-lessons', label: 'دروس الألحان', icon: 'music_note' },
    { path: '/homework', label: 'الواجبات', icon: 'edit_note' },
    { path: '/progress', label: 'التقدم', icon: 'trending_up' },
    { path: '/my-results', label: 'نتائجي', icon: 'assignment' },
    { path: '/attendance/checkin', label: 'تسجيل الحضور', icon: 'how_to_reg' },
    { path: '/attendance/leaves', label: 'طلبات الإجازة', icon: 'event_note' },
  ];

  const isStudentsActive = location.pathname.startsWith('/students') || location.pathname === '/register-student' || location.pathname === '/pending-approvals';
  const searchParams = new URLSearchParams(location.search);
  const activeGradeId = searchParams.get('gradeId');

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', direction: 'rtl',
      backgroundImage: 'linear-gradient(rgba(10,16,30,0.35), rgba(10,16,30,0.35)), url(/san-mark-wide.png)',
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
    }}>

      {/* Sidebar */}
      <aside style={{
        width: sidebarWidth,
        background: 'rgba(10, 16, 30, 0.97)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderLeft: '1px solid rgba(251,191,36,0.12)',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, right: 0,
        height: '100vh', zIndex: 100,
        overflowY: 'auto', overflowX: 'hidden',
        transition: 'width 0.25s ease',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* Logo */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', position: 'relative' }}>
            <button onClick={() => setOpen(o => !o)} style={{ position: 'absolute', top: '0.75rem', left: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-gold)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{open ? 'menu_open' : 'menu'}</span>
            </button>
            <div onClick={() => navigate('/dashboard')} style={{ padding: open ? '1.25rem 1rem' : '1rem 0', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--accent-gold)' }}>church</span>
              {open && (
                <>
                  <h2 style={{ color: 'var(--accent-gold)', marginTop: '0.4rem', fontSize: '0.88rem', lineHeight: 1.4 }}>مدرسة بي ثيؤريموس للألحان والتسبحة</h2>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>كنيسة مارمرقس النزهة 2</p>
                </>
              )}
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: open ? '1rem' : '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>

            {/* Dashboard — always */}
            <NavButton icon="dashboard" label="لوحة التحكم" isActive={location.pathname === '/dashboard'} open={open} onClick={() => navigate('/dashboard')} />

            {user?.role === 'Admin' ? (
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
                              <div style={{ padding: '0.25rem 1rem 0.1rem 2rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>{stage.label}</div>
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
            ) : (
              studentNavItems.map(item => (
                <NavButton key={item.path} icon={item.icon} label={item.label} isActive={location.pathname === item.path} open={open} onClick={() => navigate(item.path)} />
              ))
            )}
          </nav>

          {/* Logout */}
          <div style={{ padding: open ? '1rem' : '0.75rem 0.5rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
          <h1 style={{ color: 'var(--accent-gold)', fontSize: '1.5rem' }}>{title || ''}</h1>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
        {children}
      </main>
    </div>
  );
};

export default Layout;
