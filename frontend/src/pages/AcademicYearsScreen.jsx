import { useState, useEffect } from 'react';
import apiClient from '../apiClient';
import Layout from '../Layout';

const empty = { name: '', startDate: '', endDate: '', setAsCurrent: false };

export default function AcademicYearsScreen() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // AcademicYearDto | null
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get('/academic-years');
      setYears(r.data);
    } catch {
      setMsg({ type: 'error', text: 'فشل تحميل السنوات الدراسية.' });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setShowForm(true);
  };

  const openEdit = (year) => {
    setEditing(year);
    setForm({
      name: year.name,
      startDate: year.startDate,
      endDate: year.endDate,
      setAsCurrent: false,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) return;
    setSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/academic-years/${editing.id}`, {
          name: form.name,
          startDate: form.startDate,
          endDate: form.endDate,
        });
        setMsg({ type: 'success', text: 'تم تحديث السنة الدراسية.' });
      } else {
        await apiClient.post('/academic-years', {
          name: form.name,
          startDate: form.startDate,
          endDate: form.endDate,
          setAsCurrent: form.setAsCurrent,
        });
        setMsg({ type: 'success', text: 'تم إضافة السنة الدراسية.' });
      }
      setShowForm(false);
      load();
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل الحفظ.' });
    } finally {
      setSaving(false);
    }
  };

  const setCurrent = async (id) => {
    try {
      await apiClient.post(`/academic-years/${id}/set-current`);
      setMsg({ type: 'success', text: 'تم تعيين السنة الدراسية الحالية.' });
      load();
    } catch {
      setMsg({ type: 'error', text: 'فشل تعيين السنة الدراسية.' });
    }
  };

  const del = async (year) => {
    if (!window.confirm(`حذف السنة الدراسية "${year.name}"؟`)) return;
    try {
      await apiClient.delete(`/academic-years/${year.id}`);
      setMsg({ type: 'success', text: 'تم الحذف.' });
      load();
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل الحذف.' });
    }
  };

  const fmt = (d) => new Date(d).toLocaleDateString('ar-EG');

  return (
    <Layout title="السنوات الدراسية">
      <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        إدارة السنوات الدراسية. السنة الحالية تُستخدم كمرجع افتراضي لجميع العمليات.
      </p>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem', borderRadius: 'var(--radius-sm)', background: msg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
          {msg.text}
          <span style={{ cursor: 'pointer' }} onClick={() => setMsg(null)}>✕</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
        <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.5rem' }} onClick={openCreate}>
          + سنة دراسية جديدة
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>جاري التحميل...</p>
      ) : years.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)', display: 'block', marginBottom: '1rem' }}>calendar_today</span>
          <p style={{ color: 'var(--text-muted)' }}>لا توجد سنوات دراسية بعد</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {years.map(y => (
            <div key={y.id} className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px', color: y.isCurrent ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                  {y.isCurrent ? 'verified' : 'calendar_month'}
                </span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{y.name}</span>
                    {y.isCurrent && (
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.6rem', borderRadius: '20px', background: 'rgba(251,191,36,0.15)', color: 'var(--accent-gold)', fontWeight: 700 }}>
                        الحالية
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {fmt(y.startDate)} — {fmt(y.endDate)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {!y.isCurrent && (
                  <button
                    onClick={() => setCurrent(y.id)}
                    style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid var(--accent-gold)', background: 'transparent', color: 'var(--accent-gold)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit' }}
                  >
                    تعيين كحالية
                  </button>
                )}
                <button
                  onClick={() => openEdit(y)}
                  style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit' }}
                >
                  تعديل
                </button>
                {!y.isCurrent && (
                  <button
                    onClick={() => del(y)}
                    style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.4)', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit' }}
                  >
                    حذف
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-card" style={{ padding: '2rem', width: '420px', direction: 'rtl' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>
              {editing ? 'تعديل السنة الدراسية' : 'سنة دراسية جديدة'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>اسم السنة الدراسية</label>
                <input
                  className="premium-input"
                  placeholder="مثال: 2025-2026"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>تاريخ البداية</label>
                  <input
                    className="premium-input"
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>تاريخ الانتهاء</label>
                  <input
                    className="premium-input"
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>
              {!editing && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                  <input
                    type="checkbox"
                    checked={form.setAsCurrent}
                    onChange={e => setForm({ ...form, setAsCurrent: e.target.checked })}
                  />
                  تعيين كالسنة الدراسية الحالية
                </label>
              )}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                disabled={!form.name.trim() || !form.startDate || !form.endDate || saving}
                onClick={save}
              >
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

const labelStyle = {
  display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600,
};
