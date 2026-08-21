import { useState, useEffect } from 'react';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';
import { useAuth } from '../context/AuthContext';

const AnnouncementsScreen = () => {
  usePageTitle('الإعلانات');
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', body: '', isActive: true });
  const [msg, setMsg] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get('/announcement', { params: { activeOnly: !isAdmin } });
      setItems(r.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const openCreate = () => { setEditing(null); setForm({ title: '', body: '', isActive: true }); setShowForm(true); };
  const openEdit = (item) => { setEditing(item); setForm({ title: item.title, body: item.body, isActive: item.isActive }); setShowForm(true); };

  const submit = async () => {
    try {
      if (editing) {
        await apiClient.put(`/announcement/${editing.id}`, form);
        setMsg({ type: 'success', text: 'تم التحديث.' });
      } else {
        await apiClient.post('/announcement', form);
        setMsg({ type: 'success', text: 'تم النشر.' });
      }
      setShowForm(false);
      fetchAll();
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل الحفظ.' });
    }
  };

  const del = async (id) => {
    if (!window.confirm('حذف الإعلان؟')) return;
    try {
      await apiClient.delete(`/announcement/${id}`);
      setMsg({ type: 'success', text: 'تم الحذف.' });
      fetchAll();
    } catch { setMsg({ type: 'error', text: 'فشل الحذف.' }); }
  };

  return (
    <>
      {msg && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 'var(--radius-sm)', background: msg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
          {msg.text}
          <span style={{ cursor: 'pointer' }} onClick={() => setMsg(null)}>✕</span>
        </div>
      )}

      {isAdmin && (
        <div style={{ marginBottom: '1.5rem' }}>
          <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.5rem' }} onClick={openCreate}>+ إعلان جديد</button>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>
      ) : items.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>campaign</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>لا توجد إعلانات</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map(item => (
            <div key={item.id} className="glass-card" style={{ padding: '1.5rem', opacity: item.isActive ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--accent-gold)', fontSize: '22px' }}>campaign</span>
                    <h3 style={{ color: 'var(--accent-gold)', fontSize: '1rem' }}>{item.title}</h3>
                    {!item.isActive && isAdmin && (
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '20px', background: 'rgba(239,68,68,0.15)', color: 'var(--danger)' }}>مخفي</span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{item.body}</p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                    {new Date(item.createdAt).toLocaleDateString('ar-EG')}
                    {item.targetStageName && ` — ${item.targetStageName}`}
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem' }}>
                    <button onClick={() => openEdit(item)} style={{ background: 'none', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>تعديل</button>
                    <button onClick={() => del(item.id)} style={{ background: 'none', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>حذف</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-card" style={{ padding: '2rem', width: '540px', maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto', direction: 'rtl' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>{editing ? 'تعديل إعلان' : 'إعلان جديد'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input className="premium-input" placeholder="عنوان الإعلان" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <textarea className="premium-input" placeholder="نص الإعلان" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={5} style={{ resize: 'vertical' }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                نشر مباشرة
              </label>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={submit} disabled={!form.title || !form.body}>حفظ</button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AnnouncementsScreen;
