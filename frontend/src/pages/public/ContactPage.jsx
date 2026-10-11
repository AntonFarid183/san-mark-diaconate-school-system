import InfoPageShell from '../../landing/components/InfoPageShell';
import BrandIcon from '../../components/BrandIcon';
import Reveal from '../../landing/components/Reveal';
import { SCHOOL_CONTACT, SERVICE_DAYS } from '../../constants/schoolContact';
import { CHURCH_NAME } from '../../constants/church';
import useSeo from '../../seo/useSeo';
import { SITE_NAME } from '../../seo/keywords';

const external = { target: '_blank', rel: 'noopener noreferrer' };

const CHANNELS = [
  {
    brand: 'whatsapp', title: SCHOOL_CONTACT.secretaryWhatsApp.label, value: SCHOOL_CONTACT.secretaryWhatsApp.number,
    hint: 'للاستفسار والتسجيل والمتابعة', href: SCHOOL_CONTACT.secretaryWhatsApp.link, action: 'ابدأ محادثة', external: true,
  },
  {
    brand: 'whatsapp', title: SCHOOL_CONTACT.instituteWhatsApp.label, value: SCHOOL_CONTACT.instituteWhatsApp.number,
    hint: 'للمرحلة الجامعية والكبار', href: SCHOOL_CONTACT.instituteWhatsApp.link, action: 'ابدأ محادثة', external: true,
  },
  {
    brand: 'email', title: 'البريد الإلكتروني', value: SCHOOL_CONTACT.email,
    hint: 'نرد على رسائلكم في أقرب وقت', href: `mailto:${SCHOOL_CONTACT.email}`, action: 'أرسل رسالة',
  },
  {
    brand: 'facebook', title: 'صفحتنا على فيسبوك', value: 'الصفحة الرسمية',
    hint: 'آخر الأخبار والصور', href: SCHOOL_CONTACT.facebook, action: 'زيارة الصفحة', external: true,
  },
  {
    brand: 'youtube', title: 'قناتنا على يوتيوب', value: 'القناة الرسمية',
    hint: 'مقاطع الألحان والخدمة', href: SCHOOL_CONTACT.youtube, action: 'مشاهدة القناة', external: true,
  },
];

export default function ContactPage() {
  useSeo({
    title: `تواصل معنا — ${SITE_NAME}`,
    description: 'تواصل مع مدرسة بي ثيؤريموس للألحان والتسبحة عبر واتساب سكرتارية المدرسة أو معهد تين ثينو أو البريد الإلكتروني أو فيسبوك ويوتيوب.',
  });

  return (
    <InfoPageShell
      eyebrow="تواصل معنا"
      icon="forum"
      title="يسعدنا تواصلكم معنا"
      subtitle="اختر الوسيلة الأنسب لك، وسنكون سعداء بالرد على استفساراتكم."
    >
      <div className="info-contact-grid">
        {CHANNELS.map((c, i) => (
          <Reveal key={c.title} delay={i * 60}>
            <a className="glass-card card-hover info-contact-card" href={c.href} {...(c.external ? external : {})}>
              {c.brand
                ? <span className="info-contact-brand"><BrandIcon name={c.brand} size={44} /></span>
                : <span className="material-symbols-outlined">{c.icon}</span>}
              <h3>{c.title}</h3>
              <strong dir="ltr">{c.value}</strong>
              <p>{c.hint}</p>
              <span className="info-contact-action">{c.action}</span>
            </a>
          </Reveal>
        ))}
      </div>

      <section className="info-section">
        <h2 className="info-heading info-heading-center">أين ومتى؟</h2>
        <p className="info-lead">{CHURCH_NAME}</p>
        <div className="info-schedule">
          {SERVICE_DAYS.map((d, i) => (
            <Reveal key={d.day} delay={i * 80}>
              <div className="glass-card info-day">
                <h3><span className="material-symbols-outlined">event</span>{d.day}</h3>
                <ul>
                  {d.items.map(item => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </InfoPageShell>
  );
}
