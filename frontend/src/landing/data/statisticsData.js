import apiClient from '../../apiClient';

/**
 * Data source for the home page "بالأرقام" strip. The numbers are the school's real,
 * current counts from GET /public/stats (aggregate only, no personal data).
 *
 * Each tile matches StatisticCard's contract:
 *   { id, icon, value, suffix?, title, description, animate?, staticValue? }
 */
const TILES = [
  { id: 'students', key: 'activeStudents', icon: 'groups', title: 'طالب وطالبة', description: 'مسجلون حاليًا في مراحل المدرسة المختلفة.' },
  { id: 'classes', key: 'classes', icon: 'school', title: 'فصل دراسي', description: 'فصول العام الدراسي الحالي.' },
  { id: 'curricula', key: 'publishedCurricula', icon: 'menu_book', title: 'منهج منشور', description: 'مناهج الألحان والطقس واللغة القبطية المتاحة للتحميل.' },
  { id: 'hymns', key: 'publishedHymnLessons', icon: 'music_note', title: 'درس ألحان', description: 'دروس الألحان والتسبحة المنشورة للتعلّم.' },
];

export async function getStatistics() {
  try {
    const { data } = await apiClient.get('/public/stats');
    return TILES.map(({ key, ...tile }) => ({ ...tile, value: Number(data[key]) || 0 }));
  } catch {
    // No numbers is better than wrong ones — the section hides itself when this is empty.
    return [];
  }
}
