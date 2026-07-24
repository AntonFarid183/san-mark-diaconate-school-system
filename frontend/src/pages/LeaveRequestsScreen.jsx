import { useState, useEffect } from 'react';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';
import { useAuth } from '../context/AuthContext';

// Enum values mirror DiaconateSchool.Domain.Enums.LeaveStatus (serialized as numbers by the API)
const STATUS_LABELS = ['قيد المراجعة', 'موافق عليه', 'مرفوض'];
const STATUS_COLORS = ['var(--accent-gold)', 'var(--success)', 'var(--danger)'];
const STATUS_QUERY_NAMES = ['Pending', 'Approved', 'Rejected']; // for query-string filters
const STATUS_PENDING = 0;

const LeaveRequestsScreen = () => {
  usePageTitle('طلبات الإجازة');
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(isAdmin ? 'Pending' : '');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fromDate: '', toDate: '', reason: '' });
  const [msg, setMsg] = useState(null);

  useEffect(() => { fetchLeaves(); }, [statusFilter]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const r = await apiClient.get('/attendance/leaves', { params });
      setLeaves(r.data);
    } catch { setMsg({ type: 'error', text: 'فشل تحميل طلبات الإجازة.' }); }
    finally { setLoading(false); }
  };

  const submitRequest = async () => {
    try {
      await apiClient.post('/attendance/leaves', form);
      setMsg({ type: 'success', text: 'تم إرسال الطلب.' });
      setShowForm(false);
      setForm({ fromDate: '', toDate: '', reason: '' });
      fetchLeaves();
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل إرسال الطلب.' });
    }
  };

  const decide = async (id, approve) => {
    try {
      await apiClient.put(`/attendance/leaves/${id}/decision`, { approve });
      fetchLeaves();
    } catch { setMsg({ type: 'error', text: 'فشل تحديث الطلب.' }); }
  };

  return (
    <>
      {msg && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 'var(--radius-sm)', background: msg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)', display: 'flex', justifyContent: 'space-between' }}>
          {msg.text}
          <span style={{ cursor: 'pointer' }} onClick={() => setMsg(null)}>✕</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <select className="premium-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: '220px' }}>
          <option value="">كل الحالات</option>
          {STATUS_QUERY_NAMES.map((name, i) => <option key={name} value={name}>{STATUS_LABELS[i]}</option>)}
        </select>
        {!isAdmin && (
          <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.5rem' }} onClick={() => setShowForm(true)}>+ طلب إجازة</button>
        )}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>
      ) : leaves.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>event_note</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>لا توجد طلبات إجازة</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {leaves.map(l => (
            <div key={l.id} className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {isAdmin && <h3 style={{ color: 'var(--accent-gold)', fontSize: '0.95rem', marginBottom: '0.3rem' }}>{l.studentName}</h3>}
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{l.fromDate} — {l.toDate}</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{l.reason}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.7rem', borderRadius: '20px', background: `${STATUS_COLORS[l.status]}22`, color: STATUS_COLORS[l.status] }}>
                  {STATUS_LABELS[l.status]}
                </span>
                {isAdmin && l.status === STATUS_PENDING && (
                  <>
                    <button onClick={() => decide(l.id, true)} style={{ background: 'none', border: '1px solid var(--success)', color: 'var(--success)', borderRadius: '6px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.78rem' }}>موافقة</button>
                    <button onClick={() => decide(l.id, false)} style={{ background: 'none', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '6px', padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.78rem' }}>رفض</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="glass-card" style={{ padding: '2rem', width: '440px', direction: 'rtl' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>طلب إجازة جديد</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>من تاريخ</label>
              <input className="premium-input" type="date" value={form.fromDate} onChange={e => setForm({ ...form, fromDate: e.target.value })} />
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إلى تاريخ</label>
              <input className="premium-input" type="date" value={form.toDate} onChange={e => setForm({ ...form, toDate: e.target.value })} />
              <textarea className="premium-input" placeholder="سبب الإجازة" rows={3} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn-primary" style={{ flex: 1 }} disabled={!form.fromDate || !form.toDate || !form.reason.trim()} onClick={submitRequest}>إرسال</button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeaveRequestsScreen;
