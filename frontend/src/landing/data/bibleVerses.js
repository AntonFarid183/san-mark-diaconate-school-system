// A curated set of well-known verses — one is chosen at random on every page load.
// Text kept short so it reads well inside the hero's verse card.
export const BIBLE_VERSES = [
  { text: 'الرب راعيّ فلا يعوزني شيء.', reference: 'مزمور 23: 1' },
  { text: 'أنا هو الطريق والحق والحياة.', reference: 'يوحنا 14: 6' },
  { text: 'كل شيء أستطيع في المسيح الذي يقويني.', reference: 'فيلبي 4: 13' },
  { text: 'الرب نوري وخلاصي، ممن أخاف؟', reference: 'مزمور 27: 1' },
  { text: 'تعالوا إليّ يا جميع المتعبين والثقيلي الأحمال، وأنا أريحكم.', reference: 'متى 11: 28' },
  { text: 'لأنه هكذا أحب الله العالم حتى بذل ابنه الوحيد.', reference: 'يوحنا 3: 16' },
  { text: 'ثقوا، أنا قد غلبت العالم.', reference: 'يوحنا 16: 33' },
  { text: 'لا تخف لأني معك، لا تتلفت لأني إلهك.', reference: 'إشعياء 41: 10' },
  { text: 'الرب هو الذي يسير أمامك، هو يكون معك.', reference: 'تثنية 31: 8' },
  { text: 'اطلبوا أولاً ملكوت الله وبره، وهذه كلها تُزاد لكم.', reference: 'متى 6: 33' },
  { text: 'من يثبت فيّ وأنا فيه هذا يأتي بثمر كثير.', reference: 'يوحنا 15: 5' },
  { text: 'الرب قريب من كل الذين يدعونه.', reference: 'مزمور 145: 18' },
  { text: 'لا تهتموا بشيء، بل في كل شيء بالصلاة والدعاء مع الشكر لتُعلَم طلباتكم لدى الله.', reference: 'فيلبي 4: 6' },
  { text: 'هلمّوا نسجد ونركع، ونجثو أمام الرب خالقنا.', reference: 'مزمور 95: 6' },
  { text: 'الحكمة رأس الأمور، فاقتنِ الحكمة.', reference: 'أمثال 4: 7' },
];

export function getRandomVerse() {
  return BIBLE_VERSES[Math.floor(Math.random() * BIBLE_VERSES.length)];
}
