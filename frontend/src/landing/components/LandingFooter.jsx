import { Link } from 'react-router-dom';
import SchoolLogo from '../../components/SchoolLogo';
import BrandIcon from '../../components/BrandIcon';
import { CHURCH_NAME } from '../../constants/church';
import { SCHOOL_CONTACT } from '../../constants/schoolContact';

const PAGES = [
  { to: '/about', label: 'من نحن' },
  { to: '/ordination', label: 'لائحة الرسامة' },
  { to: '/bylaws', label: 'لائحة المدرسة' },
  { to: '/contact', label: 'تواصل معنا' },
  { to: '/suggestions', label: 'الاقتراحات والتعليقات' },
];

const external = { target: '_blank', rel: 'noopener noreferrer' };

export default function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        <div className="landing-footer-brand">
          <SchoolLogo size={56} />
          <div>
            <h3>مدرسة بي ثيؤريموس للألحان والتسبحة</h3>
            <p>{CHURCH_NAME}</p>
          </div>
        </div>

        <nav className="landing-footer-col" aria-label="صفحات الموقع">
          <h4>الموقع</h4>
          {PAGES.map(p => <Link key={p.to} to={p.to}>{p.label}</Link>)}
        </nav>

        <div className="landing-footer-col">
          <h4>تواصل</h4>
          {[SCHOOL_CONTACT.secretaryWhatsApp, SCHOOL_CONTACT.instituteWhatsApp].map(c => (
            <a key={c.number} href={c.link} {...external} className="landing-footer-contact">
              <BrandIcon name="whatsapp" size={22} />
              <span className="landing-footer-contact-text">
                <span>{c.label}</span>
                <bdi dir="ltr">{c.number}</bdi>
              </span>
            </a>
          ))}
          <a href={`mailto:${SCHOOL_CONTACT.email}`} className="landing-footer-contact">
            <BrandIcon name="email" size={22} />
            <span className="landing-footer-contact-text">
              <span>البريد الإلكتروني</span>
              <bdi dir="ltr">{SCHOOL_CONTACT.email}</bdi>
            </span>
          </a>
          <div className="landing-footer-social">
            <a href={SCHOOL_CONTACT.facebook} {...external} className="landing-footer-brand-link"><BrandIcon name="facebook" size={22} />فيسبوك</a>
            <a href={SCHOOL_CONTACT.youtube} {...external} className="landing-footer-brand-link"><BrandIcon name="youtube" size={22} />يوتيوب</a>
          </div>
        </div>
      </div>
      <p className="landing-footer-note">معًا نحفظ ألحان كنيستنا، ونتعلّم لغتها، وننقل تراثها من جيل إلى جيل.</p>
    </footer>
  );
}
