// The students list keeps its page / search / class in the URL, and remembers the last
// URL it showed so the "back to the list" buttons on the student pages can return to the
// same page and search instead of starting over at page 1.
const KEY = 'studentListUrl';

export const rememberStudentListUrl = (url) => {
  try { sessionStorage.setItem(KEY, url); } catch { /* storage unavailable — fall back to the plain list */ }
};

export const getStudentListUrl = () => {
  try { return sessionStorage.getItem(KEY) || '/students'; } catch { return '/students'; }
};
