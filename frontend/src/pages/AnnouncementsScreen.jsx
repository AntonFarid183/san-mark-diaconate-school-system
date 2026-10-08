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
  const emptyForm = { title: '', body: '', isActive: true, targetStageId: '', targetGradeId: '' };
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState(null);
  const [stages, setStages] = useState([]);
  const [formGrades, setFormGrades] = useState([]);

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (isAdmin) apiClient.get('/students/stages').then(r => setStages(r.data)).catch(() => {});
  }, [isAdmin]);

  // Grades of the stage picked in the form (KG1 / KG2 under طفولة, the single pseudo-grade elsewhere).
  const loadFormGrades = (stageId) => {
    if (!stageId) { setFormGrades([]); return; }
    apiClient.get(`/students/grades/${stageId}`).then(r => setFormGrades(r.data)).catch(() => setFormGrades([]));
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = { activeOnly: !isAdmin };
      if (!isAdmin) {
        // A student only sees announcements for everyone, their stage, or their own grade.
        const me = (await apiClient.get('/students/me')).data;
        params.stageId = me.stageId;
        params.gradeId = me.gradeId;
      }
      const r = await apiClient.get('/announcement', { params });
      setItems(r.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormGrades([]); setShowForm(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title, body: item.body, isActive: item.isActive,
      targetStageId: item.targetStageId || '', targetGradeId: item.targetGradeId || '',
    });
    loadFormGrades(item.targetStageId);
    setShowForm(true);
  };

  const submit = async () => {
    try {
      const target = { targetStageId: form.targetStageId || null, targetGradeId: form.targetGradeId || null };
      if (editing) {
        await apiClient.put(`/announcement/${editing.id}`, {
          title: form.title, body: form.body, isActive: form.isActive,
          ...target,
          clearTarget: !form.targetStageId, // back to "everyone"
        });
        setMsg({ type: 'success', text: 'تم التحديث.' });
      } else {
        await apiClient.post('/announcement', { title: form.title, body: form.body, ...target });
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
                    {item.targetStageName
                      ? ` — ${item.targetStageName}${item.targetGradeName && item.targetGradeName !== item.targetStageName ? ` / ${item.targetGradeName}` : ''}`
                      : ' — للجميع'}
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
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <select
                  className="premium-input" style={{ flex: 1, minWidth: '160px' }}
                  value={form.targetStageId}
                  onChange={e => { setForm({ ...form, targetStageId: e.target.value, targetGradeId: '' }); loadFormGrades(e.target.value); }}
                >
                  <option value="">للجميع (كل المراحل)</option>
                  {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select
                  className="premium-input" style={{ flex: 1, minWidth: '160px' }}
                  value={form.targetGradeId}
                  onChange={e => setForm({ ...form, targetGradeId: e.target.value })}
                  disabled={!form.targetStageId}
                >
                  <option value="">كل صفوف المرحلة</option>
                  {formGrades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
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
