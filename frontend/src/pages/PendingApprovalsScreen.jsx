import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';

const stageLabel = (s) => s || '—';

export default function PendingApprovalsScreen() {
  usePageTitle('طلبات التسجيل الذاتي');
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(null);
  const [feeModal, setFeeModal] = useState(null); // { id } while the paid-vs-discount choice is open
  const [isDiscount, setIsDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [payLaterModal, setPayLaterModal] = useState(null); // { id } while the pay-later amount prompt is open
  const [payLaterAmount, setPayLaterAmount] = useState('');
  const [cleaning, setCleaning] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/students/pending');
      setStudents(res.data);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // withFees=true charges the current academic year's term fee automatically —
  // no amount to type unless it's a discount, then paidAmount is the actual
  // amount collected and the gap is recorded as a discount, not just skipped.
  // isExempt=true skips charging entirely — no debt on record at all.
  const activate = async (id, { withFees = false, isExempt = false, paidAmount = null, amountDue = null } = {}) => {
    setActivating(id);
    try {
      await apiClient.post(`/students/${id}/activate`, { withFees, isExempt, paidAmount, amountDue });
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch {
      alert('حدث خطأ أثناء تفعيل الحساب، حاول مرة أخرى.');
    } finally {
      setActivating(null);
    }
  };

  const openFeeModal = (id) => {
    setIsDiscount(false);
    setDiscountAmount('');
    setFeeModal({ id });
  };

  const confirmFullPayment = () => {
    const id = feeModal.id;
    setFeeModal(null);
    activate(id, { withFees: true });
  };

  const confirmDiscountPayment = () => {
    const amount = parseFloat(discountAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('يرجى إدخال مبلغ صحيح.');
      return;
    }
    const id = feeModal.id;
    setFeeModal(null);
    activate(id, { withFees: true, paidAmount: amount });
  };

  const openPayLaterModal = (id) => {
    setPayLaterAmount('');
    setPayLaterModal({ id });
  };

  // Leaving the amount blank bills the standard current-year term fee;
  // typing one bills exactly that instead (e.g. a special-case amount).
  const confirmPayLater = () => {
    const raw = payLaterAmount.trim();
    let amountDue = null;
    if (raw) {
      const amount = parseFloat(raw);
      if (isNaN(amount) || amount <= 0) {
        alert('يرجى إدخال مبلغ صحيح، أو تركه فارغاً لاستخدام رسم الترم الحالي.');
        return;
      }
      amountDue = amount;
    }
    const id = payLaterModal.id;
    setPayLaterModal(null);
    activate(id, { amountDue });
  };

  // One-off cleanup for students who already have a payment recorded (e.g. from
  // before a new payment auto-activated) but are still stuck here -- safe to
  // click more than once, just does nothing if nobody matches anymore.
  const cleanAlreadyPaid = async () => {
    setCleaning(true);
    try {
      const res = await apiClient.post('/students/pending/activate-already-paid');
      const activated = res.data;
      if (activated.length === 0) {
        alert('لا يوجد طلاب معلّقون سبق أن دفعوا الاشتراك.');
      } else {
        alert(`تم تفعيل ${activated.length} حساب سبق دفع اشتراكهم:\n${activated.map(a => `${a.fullName} (${a.studentCode})`).join('\n')}`);
        setStudents(prev => prev.filter(s => !activated.some(a => a.id === s.id)));
      }
    } catch {
      alert('حدث خطأ أثناء التنظيف، حاول مرة أخرى.');
    } finally {
      setCleaning(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          الأعضاء الذين سجّلوا أنفسهم عبر نموذج التسجيل — في انتظار موافقة الإدارة على قبولهم وتفعيل حساباتهم.
        </p>
        <button
          onClick={cleanAlreadyPaid}
          disabled={cleaning}
          title="يفعّل أي طالب هنا سبق أن سُجّلت له دفعة اشتراك فعلية، دون تحصيل أي مبلغ إضافي"
          style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: cleaning ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{cleaning ? 'hourglass_empty' : 'cleaning_services'}</span>
          {cleaning ? 'جاري التنظيف...' : 'تفعيل من سبق أن دفعوا'}
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>جاري التحميل...</p>
      ) : students.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '56px', color: 'var(--success)', marginBottom: '1rem', display: 'block' }}>check_circle</span>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>لا توجد طلبات معلّقة</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>جميع الطلبات تمت مراجعتها</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {students.map(s => (
            <div key={s.id} className="glass-card" style={{ padding: '1.25rem', border: '1px solid rgba(251,191,36,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>

                {/* Avatar */}
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(251,191,36,0.12)', border: '2px solid rgba(251,191,36,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '26px', color: 'var(--accent-gold)' }}>person</span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                    {s.fullName}
                    <span style={{ marginRight: '0.6rem', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '20px', background: 'rgba(251,191,36,0.12)', color: 'var(--accent-gold)', fontWeight: 600 }}>
                      {s.studentCode}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <span><span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginLeft: '3px' }}>school</span>{stageLabel(s.stageName)} — {s.gradeName}</span>
                    <span><span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginLeft: '3px' }}>phone</span>{s.fatherMobile}</span>
                    <span><span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginLeft: '3px' }}>church</span>{s.fatherOfConfession}</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginLeft: '3px' }}>calendar_today</span>
                      {new Date(s.registeredDate).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginLeft: '3px' }}>location_on</span>{s.address}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => navigate(`/students/${s.id}`)}
                    style={{ padding: '0.45rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                    الملف الكامل
                  </button>
                  <button
                    disabled={activating === s.id}
                    onClick={() => openFeeModal(s.id)}
                    style={{ padding: '0.45rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', background: activating === s.id ? 'rgba(16,185,129,0.4)' : 'var(--success)', color: '#fff', cursor: activating === s.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      {activating === s.id ? 'hourglass_empty' : 'payments'}
                    </span>
                    {activating === s.id ? 'جاري التفعيل...' : 'تم السداد — تفعيل'}
                  </button>
                  <button
                    disabled={activating === s.id}
                    onClick={() => openPayLaterModal(s.id)}
                    title="تفعيل الحساب وتسجيل الرسوم كمبلغ مستحق، دون تحصيل الآن"
                    style={{ padding: '0.45rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--c-blue)', background: 'rgba(96,165,250,0.08)', color: 'var(--c-blue)', cursor: activating === s.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                    سداد لاحقاً — تفعيل
                  </button>
                  <button
                    disabled={activating === s.id}
                    onClick={() => activate(s.id, { isExempt: true })}
                    style={{ padding: '0.45rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(251,191,36,0.5)', background: 'rgba(251,191,36,0.08)', color: 'var(--accent-gold)', cursor: activating === s.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>volunteer_activism</span>
                    إعفاء — تفعيل
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paid-in-full vs discount choice */}
      {feeModal && (
        <div className="payment-overlay" onClick={() => setFeeModal(null)}>
          <div className="payment-modal" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--success)', marginBottom: '0.5rem', display: 'block' }}>payments</span>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>تفاصيل السداد</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>هل تم سداد المبلغ كاملاً أم تم تطبيق خصم؟</p>
            </div>

            {!isDiscount ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button onClick={confirmFullPayment} className="btn-primary" style={{ padding: '0.75rem' }}>
                  دفع المبلغ كاملاً
                </button>
                <button onClick={() => setIsDiscount(true)} style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 600 }}>
                  تطبيق خصم
                </button>
                <button onClick={() => setFeeModal(null)} style={{ padding: '0.5rem', border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>
                  إلغاء
                </button>
              </div>
            ) : (
              <>
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                  <input
                    autoFocus
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="المبلغ الذي دفعه الطالب فعلياً"
                    value={discountAmount}
                    onChange={e => setDiscountAmount(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') confirmDiscountPayment(); }}
                    className="premium-input"
                    style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, padding: '1rem' }}
                  />
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>ج.م</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '-1rem', marginBottom: '1rem', textAlign: 'center' }}>الفرق بين هذا المبلغ والرسم الكامل يُسجَّل كخصم</p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => setIsDiscount(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 600 }}>
                    رجوع
                  </button>
                  <button onClick={confirmDiscountPayment} className="btn-primary" style={{ flex: 1 }}>
                    تأكيد
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pay-later amount prompt */}
      {payLaterModal && (
        <div className="payment-overlay" onClick={() => setPayLaterModal(null)}>
          <div className="payment-modal" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--c-blue)', marginBottom: '0.5rem', display: 'block' }}>schedule</span>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>المبلغ المستحق</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>سيُفعَّل الحساب فوراً وسيُخطَر الطالب بهذا المبلغ. اتركه فارغاً لاستخدام رسم الترم الحالي.</p>
            </div>
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <input
                autoFocus
                type="number"
                step="0.01"
                min="0"
                placeholder="مثال: 300 (اختياري)"
                value={payLaterAmount}
                onChange={e => setPayLaterAmount(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') confirmPayLater(); }}
                className="premium-input"
                style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, padding: '1rem' }}
              />
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>ج.م</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setPayLaterModal(null)} style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 600 }}>
                إلغاء
              </button>
              <button onClick={confirmPayLater} className="btn-primary" style={{ flex: 1 }}>
                تفعيل
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
