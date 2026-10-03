// The church's name as it appears on screen and on printed ID cards. It used to
// be typed out by hand in ~10 places (and had drifted: some said
// "العذراء القديسة مريم والقديس مارمرقس - النزهة 2", the ID card said
// "كنيسة مارمرقس الرسول", the certificate said "كنيسة سان مارك"). Change it
// here and every screen follows.
//
// The spaces inside "النزهة الجديدة ٢" are non-breaking (U+00A0) on purpose:
// in a narrow spot like the sidebar the name wraps, and with normal spaces the
// lone "٢" got stranded on its own line. They render identically; the phrase
// just wraps as one unit.
export const CHURCH_NAME = 'كنيسة القديس مارمرقس الرسول - النزهة الجديدة ٢';
