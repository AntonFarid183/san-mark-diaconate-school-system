import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const navItems = (role) => {
  const items = [
    { path: '/dashboard', label: 'لوحة التحكم', icon: 'dashboard' },
  ];

  if (role === 'Student') {
    items.push(
      { path: '/lessons',          label: 'الدروس',        icon: 'menu_book' },
      { path: '/curriculum',       label: 'المناهج',       icon: 'import_contacts' },
      { path: '/hymn-lessons',     label: 'دروس الألحان',  icon: 'music_note' },
      { path: '/progress',         label: 'التقدم',        icon: 'trending_up' },
      { path: '/my-results',       label: 'نتائجي',        icon: 'assignment' },
      { path: '/my-certificates',  label: 'شهاداتي',       icon: 'workspace_premium' },
      { path: '/announcements',    label: 'الإعلانات',     icon: 'campaign' },
    );
  } else {
    items.push(
      { path: '/students',                  label: 'شؤون الطلاب',   icon: 'school' },
      { path: '/curriculum-management',     label: 'المناهج',       icon: 'import_contacts' },
      { path: '/hymn-lessons-management',   label: 'دروس الألحان',  icon: 'music_note' },
      { path: '/exams',                     label: 'الامتحانات',    icon: 'assignment' },
      { path: '/announcements',             label: 'الإعلانات',     icon: 'campaign' },
    );
  }

  return items;
};

const COLLAPSED_WIDTH = '64px';
const EXPANDED_WIDTH = '260px';

const Layout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);

  const roleLabels = { Admin: 'مدير النظام', Student: 'طالب' };

  const sidebarWidth = open ? EXPANDED_WIDTH : COLLAPSED_WIDTH;

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', direction: 'rtl',
      backgroundImage: 'linear-gradient(rgba(10,16,30,0.55), rgba(10,16,30,0.55)), url(/san-mark-wide.png)',
      backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
    }}>

      {/* Sidebar */}
      <aside style={{
        width: sidebarWidth,
        background: 'rgba(10, 16, 30, 0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderLeft: '1px solid rgba(251,191,36,0.12)',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        zIndex: 100,
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'width 0.25s ease',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Logo + toggle */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', position: 'relative' }}>
          {/* Toggle button */}
          <button onClick={() => setOpen(o => !o)} style={{
            position: 'absolute', top: '0.75rem', left: '0.5rem',
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', padding: '0.25rem', borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-gold)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
              {open ? 'menu_open' : 'menu'}
            </span>
          </button>

          <div onClick={() => navigate('/dashboard')} style={{
            padding: open ? '1.25rem 1rem 1.25rem' : '1rem 0',
            textAlign: 'center',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--accent-gold)' }}>church</span>
            {open && (
              <>
                <h2 style={{ color: 'var(--accent-gold)', marginTop: '0.4rem', fontSize: '0.88rem', lineHeight: 1.4 }}>
                  مدرسة بي ثيؤريموس للشمامسة
                </h2>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  كنيسة مارمرقس النزهة 2
                </p>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: open ? '1rem' : '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems(user?.role).map(item => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className="nav-item"
                title={!open ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: open ? '0.75rem' : '0',
                  justifyContent: open ? 'flex-start' : 'center',
                  padding: open ? '0.75rem 1rem' : '0.75rem',
                  borderRadius: 'var(--radius-sm)', border: 'none',
                  background: isActive ? 'rgba(251,191,36,0.1)' : 'transparent',
                  color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  fontFamily: 'inherit', fontSize: '0.93rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  width: '100%', textAlign: 'right', position: 'relative',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                }}>
                {isActive && (
                  <div style={{
                    position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                    width: '3px', height: '60%', background: 'var(--accent-gold)', borderRadius: '0 3px 3px 0',
                  }} />
                )}
                <span className="material-symbols-outlined" style={{ fontSize: '22px', flexShrink: 0 }}>{item.icon}</span>
                {open && item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: open ? '1rem' : '0.75rem 0.5rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="nav-logout"
            title={!open ? 'تسجيل الخروج' : undefined}
            style={{
              display: 'flex', alignItems: 'center',
              gap: open ? '0.75rem' : '0',
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
      <main style={{
        flex: 1,
        marginRight: sidebarWidth,
        padding: '2rem',
        minHeight: '100vh',
        transition: 'margin-right 0.25s ease',
      }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)',
        }}>
          <h1 style={{ color: 'var(--accent-gold)', fontSize: '1.5rem' }}>{title || ''}</h1>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="material-symbols-outlined"
                style={{ color: 'var(--text-muted)', cursor: 'pointer', fontSize: '22px' }}
                onClick={() => navigate('/announcements')}>campaign</span>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.4rem 0.75rem', background: 'var(--glass-bg)',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)',
              }}>
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
