import { useState, useEffect } from 'react';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';
import { timeAgo } from '../utils/notifications';

export default function PublicFeedbackScreen() {
  usePageTitle('الاقتراحات والتعليقات');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await apiClient.get('/PublicFeedback');
        setItems(r.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>جاري التحميل...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)', display: 'block', marginBottom: '1rem' }}>forum</span>
        <p style={{ color: 'var(--text-muted)' }}>لا توجد اقتراحات أو تعليقات بعد</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
      {items.map((f, i) => (
        <div key={f.id} style={{ padding: '1rem 1.25rem', borderBottom: i < items.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700 }}>{f.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeAgo(f.createdAt)}</span>
          </div>
          {f.contactInfo && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{f.contactInfo}</div>}
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{f.message}</div>
        </div>
      ))}
    </div>
  );
}
