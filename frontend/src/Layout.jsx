import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const navItems = (role) => {
  const items = [
    { path: '/dashboard', label: 'لوحة التحكم', icon: 'dashboard' },
  ];

  if (role === 'Student') {
    items.push(
      { path: '/lessons', label: 'الدروس', icon: 'menu_book' },
      { path: '/progress', label: 'التقدم', icon: 'trending_up' },
      { path: '/hymns', label: 'الألحان', icon: 'music_note' },
      { path: '/exams/1', label: 'الامتحانات', icon: 'assignment' },
    );
  } else {
    items.push(
      { path: '/students', label: 'شؤون الطلاب', icon: 'school' },
      { path: '/content', label: 'إدارة المحتوى', icon: 'library_books' },
      { path: '/hymns/review', label: 'مراجعة الألحان', icon: 'rate_review' },
    );
  }

  return items;
};

const Layout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabels = {
    Admin: 'مدير النظام',
    Servant: 'خادم',
    Student: 'طالب'
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', direction: 'rtl' }}>
      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-width)',
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(16px)',
        borderLeft: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--glass-border)',
          textAlign: 'center',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--accent-gold)' }}>church</span>
          <h2 style={{ color: 'var(--accent-gold)', marginTop: '0.5rem', fontSize: '1.1rem' }}>مدرسة سان مارك</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>نظام إدارة الشمامسة</p>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems(user?.role).map(item => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                  color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: '100%',
                  textAlign: 'right',
                  position: 'relative',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '3px',
                    height: '60%',
                    background: 'var(--accent-gold)',
                    borderRadius: '0 3px 3px 0',
                  }} />
                )}
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'transparent',
              color: 'var(--danger)',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
              textAlign: 'right',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>logout</span>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        marginRight: 'var(--sidebar-width)',
        padding: '2rem',
        minHeight: '100vh',
      }}>
        {/* Top bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--glass-border)',
        }}>
          <div>
            <h1 style={{ color: 'var(--accent-gold)', fontSize: '1.5rem' }}>{title || ''}</h1>
          </div>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', cursor: 'pointer', fontSize: '22px' }}>notifications</span>
              <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', cursor: 'pointer', fontSize: '22px' }}>help_outline</span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.75rem',
                background: 'var(--glass-bg)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--glass-border)',
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
