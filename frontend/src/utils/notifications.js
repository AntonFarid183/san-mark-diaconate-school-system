// Maps a persistent notification's (type, referenceId) to a frontend route.
// Backend NotificationType enum values (numeric, as serialized by ASP.NET Core):
// 0 AccountActivated, 1 HomeworkPublished, 2 HymnReviewed,
// 3 AnnouncementPosted, 4 CurriculumPublished, 5 HymnLessonPublished
export const getNotificationRoute = (type, referenceId) => {
  switch (type) {
    case 0: return '/profile';
    case 1: return `/homework/${referenceId}`;
    case 2: return `/hymn-lessons/${referenceId}`;
    case 3: return '/announcements';
    case 4: return '/curriculum';
    case 5: return `/hymn-lessons/${referenceId}`;
    default: return '/dashboard';
  }
};

export const NOTIFICATION_ICONS = {
  0: 'how_to_reg',      // AccountActivated
  1: 'edit_note',       // HomeworkPublished
  2: 'graphic_eq',      // HymnReviewed
  3: 'campaign',        // AnnouncementPosted
  4: 'import_contacts', // CurriculumPublished
  5: 'music_note',      // HymnLessonPublished
};

// Maps an admin dynamic action-item key to the management page that resolves it,
// pre-applying any filters the backend resolved (stage/grade/class/etc.) as a query string
// so the admin lands directly on the relevant record instead of an empty filter form.
export const getDynamicItemRoute = (key, filters) => {
  const base = (() => {
    // One admin notification per outstanding student — "outstanding-balance-{studentId}" —
    // plus an overflow summary item, both resolve to the same filtered report.
    if (key.startsWith('outstanding-balance-') || key === 'outstanding-balances-more') return '/payment-reports';
    switch (key) {
      case 'pending-approvals': return '/pending-approvals';
      case 'pending-hymn-reviews': return '/hymn-submissions';
      case 'draft-homework': return '/homework-management';
      case 'open-attendance-sessions': return '/attendance/sessions';
      case 'outstanding-balance': return '/profile';
      default: return '/dashboard';
    }
  })();

  if (filters && Object.keys(filters).length > 0) {
    const qs = new URLSearchParams(filters).toString();
    return `${base}?${qs}`;
  }
  return base;
};

// Arabic relative time — "منذ لحظات" / "منذ 5 دقائق" / "أمس" / "منذ 3 أيام" / falls back to date
export const timeAgo = (isoDate) => {
  const date = new Date(isoDate);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'منذ لحظات';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'أمس';
  if (days < 7) return `منذ ${days} أيام`;
  return date.toLocaleDateString('ar-EG');
};
