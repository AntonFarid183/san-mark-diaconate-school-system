// Shared "seen" state for dynamic notification items, persisted so it survives
// the full remount NotificationBell/NotificationsScreen get on every navigation
// (Layout — and everything inside it — is re-created per page, not a persistent shell).
const DISMISSED_KEY = 'dismissedDynamicNotificationCounts';

export const readDismissed = () => {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY)) || {}; } catch { return {}; }
};

export const writeDismissed = (map) => {
  try { localStorage.setItem(DISMISSED_KEY, JSON.stringify(map)); } catch { /* ignore */ }
};
