import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import Layout from '../Layout';
import { getNotificationRoute, NOTIFICATION_ICONS, timeAgo } from '../utils/notifications';

const TABS = [
  { key: 'all', label: 'الكل', isRead: undefined },
  { key: 'unread', label: 'غير مقروءة', isRead: false },
  { key: 'read', label: 'مقروءة', isRead: true },
];

export default function NotificationsScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { setPage(1); load(1); }, [tab]);
  useEffect(() => { load(); }, [page]);

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
    <Layout title="الإشعارات">
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
    </Layout>
  );
}
