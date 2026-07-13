import { useState, useEffect } from 'react';
import apiClient from '../apiClient';

const STATUS_LABELS = {
  paid: { label: 'مدفوع بالكامل', color: 'var(--success)' },
  partial: { label: 'مدفوع جزئياً', color: 'var(--accent-gold)' },
  not_paid: { label: 'غير مدفوع', color: 'var(--danger)' },
  no_balance: { label: 'لا يوجد مبلغ مطلوب', color: 'var(--text-muted)' },
};

const formatAmount = (val) => `${Number(val ?? 0).toLocaleString('ar-EG')} ج.م`;

const emptyForm = { amount: '', description: '', notes: '', date: new Date().toISOString().slice(0, 10) };

export default function StudentPaymentModal({ studentId, studentName, onClose }) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const [editingTotal, setEditingTotal] = useState(false);
  const [totalInput, setTotalInput] = useState('');
  const [totalDescriptionInput, setTotalDescriptionInput] = useState('');
  const [savingTotal, setSavingTotal] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [editingTxId, setEditingTxId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [savingEdit, setSavingEdit] = useState(false);

  const [voidingTxId, setVoidingTxId] = useState(null);
  const [voidReason, setVoidReason] = useState('');
  const [savingVoid, setSavingVoid] = useState(false);

  useEffect(() => { load(); }, [studentId]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get(`/students/${studentId}/account`);
      setAccount(r.data);
    } catch {
      setMsg({ type: 'error', text: 'فشل تحميل بيانات المدفوعات.' });
    } finally {
      setLoading(false);
    }
  };

  const openEditTotal = () => {
    setTotalInput(String(account?.totalRequired ?? 0));
    setTotalDescriptionInput(account?.description ?? '');
    setEditingTotal(true);
  };

  const saveTotal = async () => {
    const value = parseFloat(totalInput);
    if (isNaN(value) || value < 0) return;
    setSavingTotal(true);
    try {
      const r = await apiClient.put(`/students/${studentId}/account/total-required`, {
        totalRequired: value,
        description: totalDescriptionInput.trim() || null,
      });
      setAccount(r.data);
      setEditingTotal(false);
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل تحديث المبلغ المطلوب.' });
    } finally {
      setSavingTotal(false);
    }
  };

  const submitTransaction = async () => {
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0 || !form.description.trim()) return;
    setSaving(true);
    try {
      const r = await apiClient.post(`/students/${studentId}/account/transactions`, {
        amount,
        description: form.description.trim(),
        notes: form.notes.trim() || null,
        transactionDate: form.date ? `${form.date}T00:00:00` : null,
      });
      setAccount(r.data);
      setShowAddForm(false);
      setForm(emptyForm);
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل تسجيل الدفعة.' });
    } finally {
      setSaving(false);
    }
  };

  const openEditTx = (t) => {
    setEditingTxId(t.id);
    setEditForm({
      amount: String(t.amount),
      description: t.description,
      notes: t.notes || '',
      date: t.transactionDate.slice(0, 10),
    });
  };

  const saveEditTx = async () => {
    const amount = parseFloat(editForm.amount);
    if (isNaN(amount) || amount <= 0 || !editForm.description.trim()) return;
    setSavingEdit(true);
    try {
      const r = await apiClient.put(`/students/${studentId}/account/transactions/${editingTxId}`, {
        amount,
        description: editForm.description.trim(),
        notes: editForm.notes.trim() || null,
        transactionDate: `${editForm.date}T00:00:00`,
      });
      setAccount(r.data);
      setEditingTxId(null);
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل تعديل الدفعة.' });
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmVoid = async () => {
    if (!voidReason.trim()) return;
    setSavingVoid(true);
    try {
      const r = await apiClient.post(`/students/${studentId}/account/transactions/${voidingTxId}/void`, {
        reason: voidReason.trim(),
      });
      setAccount(r.data);
      setVoidingTxId(null);
      setVoidReason('');
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل إلغاء الدفعة.' });
    } finally {
      setSavingVoid(false);
    }
  };

  const status = account ? STATUS_LABELS[account.status] : null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={onClose}>
      <div className="glass-card" style={{ padding: '2rem', width: '560px', maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto', direction: 'rtl' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'var(--accent-gold)' }}>مدفوعات {studentName}</h3>
          <span onClick={onClose} style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}>✕</span>
        </div>

        {msg && (
          <div style={{ padding: '0.6rem 1rem', marginBottom: '1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
            {msg.text}
            <span style={{ cursor: 'pointer' }} onClick={() => setMsg(null)}>✕</span>
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>جاري التحميل...</p>
        ) : account ? (
          <>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.9rem', borderRadius: 'var(--radius-sm)', background: 'rgba(15,23,42,0.5)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>المبلغ المطلوب</div>
                {!editingTotal && (
                  <div onClick={openEditTotal} style={{ fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                    {formatAmount(account.totalRequired)}
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>edit</span>
                  </div>
                )}
                {!editingTotal && account.description && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{account.description}</div>
                )}
              </div>
              <div style={{ padding: '0.9rem', borderRadius: 'var(--radius-sm)', background: 'rgba(15,23,42,0.5)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>المدفوع</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--success)' }}>{formatAmount(account.amountPaid)}</div>
              </div>
              <div style={{ padding: '0.9rem', borderRadius: 'var(--radius-sm)', background: 'rgba(15,23,42,0.5)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>المتبقي</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: account.remainingBalance > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{formatAmount(account.remainingBalance)}</div>
              </div>
            </div>

            {editingTotal && (
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <input autoFocus className="premium-input" type="number" min="0" step="0.01" placeholder="المبلغ المطلوب" value={totalInput} onChange={e => setTotalInput(e.target.value)} style={{ flex: 1 }} />
                </div>
                <input className="premium-input" placeholder="سبب المبلغ (مثال: رسوم الفصل الدراسي الثاني)" value={totalDescriptionInput} onChange={e => setTotalDescriptionInput(e.target.value)} style={{ width: '100%', marginBottom: '0.75rem' }} />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={saveTotal} disabled={savingTotal} className="btn-primary" style={{ flex: 1 }}>
                    {savingTotal ? 'جاري الحفظ...' : 'حفظ'}
                  </button>
                  <button onClick={() => setEditingTotal(false)} className="btn-secondary" style={{ flex: 1 }}>إلغاء</button>
                </div>
              </div>
            )}

            {status && (
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.9rem', borderRadius: '20px', background: `${status.color}22`, color: status.color, fontWeight: 700 }}>
                  {status.label}
                </span>
              </div>
            )}

            {/* Add payment */}
            {!showAddForm ? (
              <button onClick={() => setShowAddForm(true)} className="btn-primary" style={{ width: '100%', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                إضافة دفعة
              </button>
            ) : (
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <input className="premium-input" type="number" step="0.01" min="0.01" placeholder="المبلغ" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={{ flex: 1 }} />
                  <input className="premium-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ flex: 1 }} />
                </div>
                <input className="premium-input" placeholder="الوصف (مثال: رحلة الكنيسة، كتب، تبرع)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%', marginBottom: '0.75rem' }} />
                <textarea className="premium-input" placeholder="ملاحظات (اختياري)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ width: '100%', minHeight: '60px', marginBottom: '0.75rem', resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={submitTransaction} disabled={saving || !form.amount || !form.description.trim()} className="btn-primary" style={{ flex: 1 }}>
                    {saving ? 'جاري الحفظ...' : 'حفظ'}
                  </button>
                  <button onClick={() => setShowAddForm(false)} className="btn-secondary" style={{ flex: 1 }}>إلغاء</button>
                </div>
              </div>
            )}

            {/* Transaction history */}
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>سجل المدفوعات</h4>
            {account.transactions.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>لا يوجد سجل مدفوعات بعد</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {account.transactions.map(t => (
                  <div key={t.id} style={{ padding: '0.65rem 0.9rem', borderRadius: '8px', background: t.isVoided ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)', opacity: t.isVoided ? 0.65 : 1 }}>
                    {editingTxId === t.id ? (
                      <div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input className="premium-input" type="number" step="0.01" min="0.01" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} />
                          <input className="premium-input" type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} />
                        </div>
                        <input className="premium-input" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.85rem', marginBottom: '0.5rem' }} />
                        <textarea className="premium-input" placeholder="ملاحظات" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} style={{ width: '100%', minHeight: '50px', padding: '0.4rem 0.6rem', fontSize: '0.85rem', marginBottom: '0.5rem', resize: 'vertical' }} />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={saveEditTx} disabled={savingEdit} className="btn-primary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.82rem' }}>
                            {savingEdit ? 'جاري الحفظ...' : 'حفظ'}
                          </button>
                          <button onClick={() => setEditingTxId(null)} className="btn-secondary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.82rem' }}>إلغاء</button>
                        </div>
                      </div>
                    ) : voidingTxId === t.id ? (
                      <div>
                        <p style={{ fontSize: '0.82rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>سبب إلغاء هذه الدفعة:</p>
                        <input autoFocus className="premium-input" placeholder="مثال: تم إدخالها بالخطأ" value={voidReason} onChange={e => setVoidReason(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && confirmVoid()}
                          style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.85rem', marginBottom: '0.5rem' }} />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={confirmVoid} disabled={savingVoid || !voidReason.trim()} style={{ flex: 1, padding: '0.4rem', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--danger)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                            {savingVoid ? 'جاري الإلغاء...' : 'تأكيد الإلغاء'}
                          </button>
                          <button onClick={() => { setVoidingTxId(null); setVoidReason(''); }} className="btn-secondary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.82rem' }}>تراجع</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, textDecoration: t.isVoided ? 'line-through' : 'none' }}>
                            {t.description}
                            {t.isVoided && <span style={{ marginRight: '0.5rem', fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>ملغاة</span>}
                          </div>
                          {t.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{t.notes}</div>}
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            {new Date(t.transactionDate).toLocaleDateString('ar-EG')} — {t.recordedByName}
                          </div>
                          {t.isVoided && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: '0.15rem' }}>
                              ألغيت بواسطة {t.voidedByName} — {t.voidReason}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem', flexShrink: 0 }}>
                          <div style={{ fontWeight: 700, color: 'var(--success)', whiteSpace: 'nowrap' }}>
                            {formatAmount(t.amount)}
                          </div>
                          {!t.isVoided && (
                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                              <button onClick={() => openEditTx(t)} title="تعديل" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.1rem' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                              </button>
                              <button onClick={() => { setVoidingTxId(t.id); setVoidReason(''); }} title="إلغاء الدفعة" style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.1rem' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>block</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
