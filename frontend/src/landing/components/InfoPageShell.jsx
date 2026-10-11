import LandingNavbar from '../sections/LandingNavbar';
import LandingFooter from './LandingFooter';
import Breadcrumb from './Breadcrumb';
import ScrollToTopButton from './ScrollToTopButton';
import '../Landing.css';

/**
 * Frame for every standalone public page (about, ordination, bylaws, contact, feedback):
 * navbar, a hero, breadcrumb, the page body, footer. Each page is a real route, so it has
 * its own address that can be shared and indexed — not a scroll position on the home page.
 */
export default function InfoPageShell({ eyebrow, icon = 'info', title, subtitle, crumb, children }) {
  return (
    <div className="landing-page">
      <LandingNavbar />

      <main className="landing-curriculum-browser landing-library-bg">
        <header className="landing-curriculum-hero info-hero">
          <span className="landing-hero-eyebrow">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{icon}</span>
            {eyebrow}
          </span>
          <h1 className="landing-curriculum-hero-title">{title}</h1>
          {subtitle && <p className="landing-curriculum-hero-subtitle">{subtitle}</p>}
        </header>

        <div className="landing-section info-body" style={{ paddingTop: 0 }}>
          <Breadcrumb items={[{ label: 'الرئيسية', path: '/' }, { label: crumb || eyebrow }]} />
          {children}
        </div>
      </main>

      <LandingFooter />
      <ScrollToTopButton />
    </div>
  );
}
