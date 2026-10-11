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
  { to: '/feedback', label: 'الاقتراحات والتعليقات' },
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
          <a href={SCHOOL_CONTACT.secretaryWhatsApp.link} {...external} className="landing-footer-brand-link"><BrandIcon name="whatsapp" size={20} />السكرتارية — <bdi dir="ltr">{SCHOOL_CONTACT.secretaryWhatsApp.number}</bdi></a>
          <a href={SCHOOL_CONTACT.instituteWhatsApp.link} {...external} className="landing-footer-brand-link"><BrandIcon name="whatsapp" size={20} />المعهد — <bdi dir="ltr">{SCHOOL_CONTACT.instituteWhatsApp.number}</bdi></a>
          <a href={`mailto:${SCHOOL_CONTACT.email}`}>{SCHOOL_CONTACT.email}</a>
          <div className="landing-footer-social">
            <a href={SCHOOL_CONTACT.facebook} {...external} className="landing-footer-brand-link"><BrandIcon name="facebook" size={20} />فيسبوك</a>
            <a href={SCHOOL_CONTACT.youtube} {...external} className="landing-footer-brand-link"><BrandIcon name="youtube" size={20} />يوتيوب</a>
          </div>
        </div>
      </div>
      <p className="landing-footer-note">معًا نحفظ ألحان كنيستنا، ونتعلّم لغتها، وننقل تراثها من جيل إلى جيل.</p>
    </footer>
  );
}
