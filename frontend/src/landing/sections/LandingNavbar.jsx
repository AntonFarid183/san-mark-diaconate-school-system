import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';
import SchoolLogo from '../../components/SchoolLogo';

const CURRICULUM_SUBJECTS = [
  { slug: 'rites', label: 'الطقس' },
  { slug: 'hymns', label: 'الألحان' },
  { slug: 'coptic', label: 'القبطي' },
];

const NAV_LINKS = [
  { type: 'scroll', href: '#about', label: 'عن المدرسة' },
  { type: 'scroll', href: '#ordination', label: 'شروط الرسامة' },
  { type: 'scroll', href: '#bylaws', label: 'لائحة المدرسة' },
  { type: 'dropdown', label: 'المناهج', items: CURRICULUM_SUBJECTS },
  { type: 'scroll', href: '#contact', label: 'تواصل معنا' },
  { type: 'scroll', href: '#feedback', label: 'الاقتراحات والتعليقات' },
];

export default function LandingNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [solid, setSolid] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCurriculumOpen, setMobileCurriculumOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToSection = (href) => {
    setMobileOpen(false);
    if (location.pathname !== '/') {
      navigate(`/${href}`);
      return;
    }
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const goToCurriculum = (slug) => {
    setMobileOpen(false);
    setMobileCurriculumOpen(false);
    navigate(`/curriculum/${slug}`);
  };

  return (
    <>
      <header className={`landing-navbar ${solid ? 'landing-navbar-solid' : ''}`}>
        <div className="landing-navbar-brand" onClick={() => navigate('/')}>
          <SchoolLogo size={40} />
          <div className="landing-navbar-brand-text">
            <h1>مدرسة بي ثيؤريموس للألحان والتسبحة</h1>
            <p>كنيسة العذراء القديسة مريم والقديس مارمرقس - النزهة 2</p>
          </div>
        </div>

        <nav className="landing-navbar-links">
          {NAV_LINKS.map(link => link.type === 'dropdown' ? (
            <div className="landing-navbar-dropdown" key={link.label}>
              <button className="landing-navbar-link landing-navbar-dropdown-trigger">
                {link.label}
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>expand_more</span>
              </button>
              <div className="landing-navbar-dropdown-menu">
                {link.items.map(item => (
                  <button key={item.slug} className="landing-navbar-dropdown-item" onClick={() => goToCurriculum(item.slug)}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button key={link.href} className="landing-navbar-link" onClick={() => scrollToSection(link.href)}>
              {link.label}
            </button>
          ))}
        </nav>

        <div className="landing-navbar-actions">
          <ThemeToggle size={36} />
          <button className="btn-secondary" style={{ width: 'auto', padding: '0.5rem 1.4rem' }} onClick={() => navigate('/login')}>
            تسجيل الدخول
          </button>
          <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.4rem', fontSize: '0.9rem' }} onClick={() => navigate('/self-register')}>
            تسجيل عضو جديد
          </button>
          <button className="landing-navbar-toggle" onClick={() => setMobileOpen(true)} aria-label="فتح القائمة">
            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>menu</span>
          </button>
        </div>
      </header>

      {mobileOpen && (
        <>
          <div className="landing-navbar-mobile-backdrop" onClick={() => setMobileOpen(false)} />
          <div className="landing-navbar-mobile-menu">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button onClick={() => setMobileOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
              </button>
            </div>
            {NAV_LINKS.map(link => link.type === 'dropdown' ? (
              <div key={link.label} style={{ width: '100%' }}>
                <button
                  className="landing-navbar-link"
                  style={{ textAlign: 'right', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => setMobileCurriculumOpen(o => !o)}
                >
                  {link.label}
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', transform: mobileCurriculumOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s ease' }}>expand_more</span>
                </button>
                {mobileCurriculumOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '1rem' }}>
                    {link.items.map(item => (
                      <button key={item.slug} className="landing-navbar-link" style={{ textAlign: 'right', width: '100%', fontSize: '0.85rem' }} onClick={() => goToCurriculum(item.slug)}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button key={link.href} className="landing-navbar-link" style={{ textAlign: 'right', width: '100%' }} onClick={() => scrollToSection(link.href)}>
                {link.label}
              </button>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
              <button className="btn-secondary" onClick={() => navigate('/login')}>تسجيل الدخول</button>
              <button className="btn-primary" onClick={() => navigate('/self-register')}>تسجيل عضو جديد</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
