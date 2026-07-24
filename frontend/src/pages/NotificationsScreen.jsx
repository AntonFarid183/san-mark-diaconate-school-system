import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';
import { useAuth } from '../context/AuthContext';
import { getNotificationRoute, getDynamicItemRoute, NOTIFICATION_ICONS, timeAgo } from '../utils/notifications';
import { readDismissed, writeDismissed } from '../utils/notificationDismissal';

const TABS = [
  { key: 'all', label: 'الكل', isRead: undefined },
  { key: 'unread', label: 'غير مقروءة', isRead: false },
  { key: 'read', label: 'مقروءة', isRead: true },
];

export default function NotificationsScreen() {
  usePageTitle('الإشعارات');
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Admin action items (pending approvals, outstanding balances, open sessions, ...) —
  // these are computed live, not stored Notification rows, so they never show up in the
  // paged list below. Fetch and render them the same way the bell dropdown does.
  const [dynamicItems, setDynamicItems] = useState([]);
  const [dismissed, setDismissed] = useState(readDismissed);

  const activeTab = TABS.find(t => t.key === tab);

  const load = async (pg = page) => {
    setLoading(true);
    try {
      const params = { page: pg, pageSize: 20 };
      if (activeTab.isRead !== undefined) params.isRead = activeTab.isRead;
      const r = await apiClient.get('/notifications', { params });
      setItems(r.data.items);
      setTotalPages(r.data.totalPages);
      setTotalCount(r.data.totalCount);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const loadSummary = async () => {
    try {
      const r = await apiClient.get('/notifications/summary');
      setDynamicItems(r.data.dynamicItems || []);
      setDismissed(d => {
        const liveKeys = new Set((r.data.dynamicItems || []).map(i => i.key));
        const pruned = Object.fromEntries(Object.entries(d).filter(([k]) => liveKeys.has(k)));
        writeDismissed(pruned);
        return pruned;
      });
    } catch { /* ignore */ }
  };

  useEffect(() => { loadSummary(); }, []);
  useEffect(() => { if (!isAdmin) { setPage(1); load(1); } }, [tab]);
  useEffect(() => { if (!isAdmin) load(); }, [page]);

  const openDynamicItem = (item) => {
    setDismissed(d => {
      const next = { ...d, [item.key]: item.count };
      writeDismissed(next);
      return next;
    });
    navigate(getDynamicItemRoute(item.key, item.filters));
  };

  const openNotification = async (n) => {
    if (!n.isRead) {
      try {
        await apiClient.post(`/notifications/${n.id}/read`);
        setItems(curr => curr.map(i => i.id === n.id ? { ...i, isRead: true } : i));
      } catch { /* ignore */ }
    }
    navigate(getNotificationRoute(n.type, n.referenceId));
  };

  const markAllRead = async () => {
    try {
      await apiClient.post('/notifications/read-all');
      load();
    } catch { /* ignore */ }
  };

  return (
    <>
      {dynamicItems.length > 0 && (
        <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'rgba(251,191,36,0.7)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
            إجراءات مطلوبة
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {dynamicItems.map(item => (
              <div key={item.key} onClick={() => openDynamicItem(item)} className="table-row-hover"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.9rem', borderRadius: '8px', background: 'rgba(251,191,36,0.08)', cursor: 'pointer' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{item.title}</div>
                  {item.message && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{item.message}</div>}
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-gold)', background: 'rgba(251,191,36,0.15)', borderRadius: '10px', padding: '0.15rem 0.6rem', flexShrink: 0, marginRight: '0.5rem' }}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isAdmin && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15,23,42,0.5)', borderRadius: 'var(--radius-sm)', padding: '0.25rem' }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none',
                  background: tab === t.key ? 'var(--accent-gold)' : 'transparent',
                  color: tab === t.key ? '#1e293b' : 'var(--text-secondary)',
                  fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: tab === t.key ? 700 : 500, cursor: 'pointer',
                }}>
                  {t.label}
                </button>
              ))}
            </div>
            <button onClick={markAllRead} style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>
              تحديد الكل كمقروء
            </button>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>جاري التحميل...</p>
          ) : items.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)', display: 'block', marginBottom: '1rem' }}>notifications_off</span>
              <p style={{ color: 'var(--text-muted)' }}>لا توجد إشعارات</p>
            </div>
          ) : (
            <>
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                {items.map((n, i) => (
                  <div key={n.id} onClick={() => openNotification(n)} className="table-row-hover"
                    style={{ display: 'flex', gap: '1rem', padding: '1rem 1.25rem', cursor: 'pointer', background: n.isRead ? 'transparent' : 'rgba(251,191,36,0.04)', borderBottom: i < items.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: n.isRead ? 'var(--text-muted)' : 'var(--accent-gold)', flexShrink: 0 }}>
                      {NOTIFICATION_ICONS[n.type] || 'notifications'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: n.isRead ? 500 : 700 }}>{n.title}</span>
                        {!n.isRead && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-gold)' }} />}
                      </div>
                      {n.message && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{n.message}</div>}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{timeAgo(n.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>صفحة {page} من {totalPages} — {totalCount} إشعار</span>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', opacity: page === totalPages ? 0.4 : 1 }}>
                    السابق
                  </button>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', opacity: page === 1 ? 0.4 : 1 }}>
                    التالي
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {isAdmin && dynamicItems.length === 0 && (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)', display: 'block', marginBottom: '1rem' }}>notifications_off</span>
          <p style={{ color: 'var(--text-muted)' }}>لا توجد إشعارات</p>
        </div>
      )}
    </>
  );
}
