// Arabic search terms the school should be found for. Google ignores the meta
// "keywords" tag, so these matter most as words that actually appear in page
// copy (titles, descriptions, headings, the noscript fallback); the tag is kept
// for Bing and smaller engines that still read it.
export const SITE_URL = 'https://ptheorimos.com';
export const SITE_NAME = 'مدرسة بي ثيؤريموس للألحان والتسبحة';
export const CHURCH_NAME = 'كنيسة القديس مارمرقس الرسول - النزهة الجديدة';

export const KEYWORDS = [
  'مدرسة ألحان',
  'مدرسة ألحان قبطية',
  'تعليم الألحان الكنسية',
  'تعليم الألحان القبطية',
  'مدرسة تسبحة',
  'مدرسة شمامسة',
  'إعداد الشمامسة',
  'مدرسة الشمامسة',
  'تعليم الشماسية',
  'شروط الرسامة شماس',
  'رسامة شماس',
  'تعليم الطقس الكنسي',
  'تعليم اللغة القبطية',
  'تعليم القبطي',
  'الألحان الكنسية القبطية',
  'الكنيسة القبطية الأرثوذكسية',
  'كنيسة مارمرقس النزهة',
  'كنيسة القديس مارمرقس الرسول النزهة الجديدة',
  'كنيسة مارمرقس النزهة الجديدة',
  'بي ثيؤريموس',
  'سنكسار اليوم',
  'سنكسار اليوم القبطي',
  'تذكار القديسين اليوم',
  'التاريخ القبطي اليوم',
  'مناهج الألحان والطقس',
  'تسجيل في مدرسة الألحان',
  'مدرسة ألحان للأطفال',
  'مدرسة ألحان للكبار',
  'مدرسة ألحان القاهرة',
].join(', ');

export const DEFAULT_DESCRIPTION =
  `${SITE_NAME} ب${CHURCH_NAME}: تعليم الألحان والتسبحة والطقس والقبطي لجميع المراحل من الطفولة إلى الكبار، ` +
  'مع إعداد الشمامسة وشروط الرسامة، ومناهج وملفات للتحميل، وسنكسار اليوم، والتسجيل للأعضاء الجدد.';
