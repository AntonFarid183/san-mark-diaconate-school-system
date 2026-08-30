import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import { getNotificationRoute, getDynamicItemRoute, NOTIFICATION_ICONS, timeAgo } from '../utils/notifications';
import { readDismissed, writeDismissed } from '../utils/notificationDismissal';

// Was 60s, polled forever regardless of whether the tab was even visible --
// on a serverless Azure SQL DB (auto-pause after 15min idle), that alone was
// enough to keep the database billed online 24/7 any time someone left a
// logged-in tab open, background or not. 5 minutes + pausing entirely while
// the tab is hidden (below) means a backgrounded/forgotten tab now costs
// nothing -- only actively-open, foreground tabs poll at all.
const POLL_INTERVAL_MS = 5 * 60 * 1000;

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState({ dynamicItems: [], recentPersistent: [], unreadPersistentCount: 0 });
  const [dismissed, setDismissed] = useState(readDismissed);
  const containerRef = useRef(null);

  const fetchSummary = async () => {
    try {
      const r = await apiClient.get('/notifications/summary');
      setSummary(r.data);
      // Prune dismissed entries for items that are fully resolved / gone
      setDismissed(d => {
        const liveKeys = new Set((r.data.dynamicItems || []).map(i => i.key));
        const pruned = Object.fromEntries(Object.entries(d).filter(([k]) => liveKeys.has(k)));
        writeDismissed(pruned);
        return pruned;
      });
    } catch { /* silent — bell just stays at last known state */ }
  };

  useEffect(() => {
    fetchSummary();
    let timer = null;
    const start = () => { if (!timer) timer = setInterval(fetchSummary, POLL_INTERVAL_MS); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const handleVisibility = () => {
      if (document.hidden) stop();
      else { fetchSummary(); start(); } // refresh immediately on return, don't wait for the next tick
    };
    start();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const totalBadge = (summary.dynamicItems?.reduce((sum, i) => sum + Math.max(0, i.count - (dismissed[i.key] || 0)), 0) || 0)
    + (summary.unreadPersistentCount || 0);

  const openDynamicItem = (item) => {
    setOpen(false);
    // Mark this backlog as "seen" up to its current count — the badge drops immediately
    // and stays down (survives the remount on navigation) until the count grows further.
    setDismissed(d => {
      const next = { ...d, [item.key]: item.count };
      writeDismissed(next);
      return next;
    });
    navigate(getDynamicItemRoute(item.key, item.filters));
  };

  const openNotification = async (n) => {
    setOpen(false);
    if (!n.isRead) {
      // Optimistic local update so the badge decreases immediately, not on next poll
      setSummary(s => ({
        ...s,
        unreadPersistentCount: Math.max(0, (s.unreadPersistentCount || 0) - 1),
        recentPersistent: s.recentPersistent.map(i => i.id === n.id ? { ...i, isRead: true } : i),
      }));
      try { await apiClient.post(`/notifications/${n.id}/read`); } catch { /* ignore */ }
    }
    navigate(getNotificationRoute(n.type, n.referenceId));
  };

  const markAllRead = async () => {
    try {
      await apiClient.post('/notifications/read-all');
      fetchSummary();
    } catch { /* ignore */ }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="tap-target"
        style={{
          position: 'relative', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-sm)', width: '40px', height: '40px', display: 'flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>notifications</span>
        {totalBadge > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', left: '-4px', background: 'var(--danger-solid)', color: '#fff',
            borderRadius: '50%', minWidth: '18px', height: '18px', fontSize: '0.68rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
          }}>
            {totalBadge > 9 ? '9+' : totalBadge}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '48px', left: 0, width: '340px', maxHeight: '480px', overflowY: 'auto',
          background: 'var(--popover-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-md)', boxShadow: '0 8px 32px var(--shadow-tint)', zIndex: 500, direction: 'rtl',
        }}>
          <div style={{ padding: '0.9rem 1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-gold)' }}>الإشعارات</span>
            {summary.unreadPersistentCount > 0 && (
              <span onClick={markAllRead} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                تحديد الكل كمقروء
              </span>
            )}
          </div>

          {/* Dynamic action items — things that need doing right now */}
          {summary.dynamicItems?.length > 0 && (
            <div style={{ padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', borderBottom: '1px solid var(--glass-border)' }}>
              {summary.dynamicItems.map(item => (
                <div key={item.key} onClick={() => openDynamicItem(item)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'var(--gold-tint-weak)', cursor: 'pointer' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.title}</div>
                    {item.message && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{item.message}</div>}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-gold)', background: 'var(--gold-tint)', borderRadius: '10px', padding: '0.1rem 0.5rem', flexShrink: 0, marginRight: '0.5rem' }}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Recent persistent notifications */}
          {summary.recentPersistent?.length === 0 && (!summary.dynamicItems || summary.dynamicItems.length === 0) ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--text-muted)' }}>notifications_off</span>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>لا توجد إشعارات جديدة</p>
            </div>
          ) : (
            <div>
              {summary.recentPersistent?.map(n => (
                <div key={n.id} onClick={() => openNotification(n)}
                  style={{ display: 'flex', gap: '0.7rem', padding: '0.75rem 1rem', cursor: 'pointer', background: n.isRead ? 'transparent' : 'var(--gold-tint-weak)', borderBottom: '1px solid var(--surface-1)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: n.isRead ? 'var(--text-muted)' : 'var(--accent-gold)', flexShrink: 0, marginTop: '0.1rem' }}>
                    {NOTIFICATION_ICONS[n.type] || 'notifications'}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: n.isRead ? 500 : 700, color: 'var(--text-primary)' }}>{n.title}</span>
                      {!n.isRead && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-gold)', flexShrink: 0 }} />}
                    </div>
                    {n.message && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{timeAgo(n.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div onClick={() => { setOpen(false); navigate('/notifications'); }}
            style={{ padding: '0.7rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--accent-gold)', cursor: 'pointer', fontWeight: 600 }}>
            عرض الكل
          </div>
        </div>
      )}
    </div>
  );
}
