// Public contact details for the school — one place, used by the contact page and the site footer.
const toWhatsAppLink = (localNumber) => `https://wa.me/20${localNumber.replace(/^0/, '')}`;

export const SCHOOL_CONTACT = {
  secretaryWhatsApp: { number: '01554883653', label: 'سكرتارية المدرسة', link: toWhatsAppLink('01554883653') },
  instituteWhatsApp: { number: '01556534388', label: 'معهد تين ثينو للألحان', link: toWhatsAppLink('01556534388') },
  email: 'Ptheorimos@gmail.com',
  facebook: 'https://www.facebook.com/share/19eYxXkLik/',
  youtube: 'https://youtube.com/channel/UCeTPsLSBZFKnU28ZSAfhhsg?si=S8Lbrc84Yt_se0gz',
};

// Same wording as the "من نحن" page, shown on the about and contact pages.
export const SERVICE_DAYS = [
  { day: 'يوم الخميس', items: ['مرحلة كيجى 1 وكيجى 2', 'المرحلة الأولى والثانية الابتدائية'] },
  { day: 'يوم الجمعة', items: ['المرحلة الثالثة والرابعة الابتدائية', 'المرحلة الخامسة والسادسة الابتدائية', 'المرحلة الإعدادية والثانوية'] },
  { day: 'يوم الاثنين', items: ['معهد تين ثينو للألحان، لخدمة المرحلة الجامعية والكبار'] },
];
