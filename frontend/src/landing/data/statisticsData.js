/**
 * Data source for the Statistics section — deliberately isolated from
 * StatisticsSection.jsx so swapping placeholders for a real backend call
 * later touches only this file's `getStatistics()` body, never the
 * section's JSX or the StatisticCard/AnimatedNumber components.
 *
 * Expected shape per statistic (matches StatisticCard's contract exactly):
 *   {
 *     id: string,
 *     icon: string,            // any Material Symbols Outlined name
 *     value: number,           // animated count target
 *     suffix?: string,         // appended after the number, e.g. '+', '%'
 *     title: string,
 *     description: string,
 *     animate?: boolean,       // false for non-numeric stats (e.g. "24/7")
 *     staticValue?: string,    // used when animate === false
 *     accentColor?: string,    // reserved, unused today
 *   }
 *
 * Future backend integration (e.g. total registered students, active
 * classes, hymn lessons, curriculum files, announcements):
 *
 *   export async function getStatistics() {
 *     const res = await apiClient.get('/public/landing-stats');
 *     return res.data; // must already match the shape above
 *   }
 *
 * No component downstream needs to change when that swap happens.
 */

const PLACEHOLDER_STATISTICS = [
  { id: 'stat-1', icon: 'groups', value: 250, suffix: '+', title: 'عنوان مؤقت', description: 'وصف مختصر مؤقت — يُستبدل لاحقاً.' },
  { id: 'stat-2', icon: 'school', value: 12, suffix: '+', title: 'عنوان مؤقت', description: 'وصف مختصر مؤقت — يُستبدل لاحقاً.' },
  { id: 'stat-3', icon: 'military_tech', value: 95, suffix: '%', title: 'عنوان مؤقت', description: 'وصف مختصر مؤقت — يُستبدل لاحقاً.' },
  { id: 'stat-4', icon: 'church', value: 0, animate: false, staticValue: '24/7', title: 'عنوان مؤقت', description: 'وصف مختصر مؤقت — يُستبدل لاحقاً.' },
];

export async function getStatistics() {
  // Placeholder "fetch" — replace the body with the apiClient.get call
  // documented above once a backend endpoint exists. The return shape
  // must stay identical.
  return PLACEHOLDER_STATISTICS;
}
