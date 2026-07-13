import { useState } from 'react';
import apiClient from '../../apiClient';

export default function FeedbackSection() {
  const [form, setForm] = useState({ name: '', contactInfo: '', message: '' });
  const [status, setStatus] = useState(null); // null | 'sending' | 'sent' | 'error'

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      setStatus('error');
      return;
    }
    setStatus('sending');
    try {
      await apiClient.post('/publicfeedback', form);
      setStatus('sent');
      setForm({ name: '', contactInfo: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="landing-section" id="feedback">
      <div className="landing-section-heading">
        <span className="landing-section-eyebrow">رأيك يهمنا</span>
        <h2 className="landing-section-title">الاقتراحات والتعليقات</h2>
        <p className="landing-section-subtitle">شاركنا رأيك أو اقتراحك حول المدرسة وخدماتها.</p>
      </div>

      <form onSubmit={submit} className="glass-card landing-feedback-form">
        <div>
          <label className="landing-feedback-label">الاسم *</label>
          <input className="premium-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="اسمك" />
        </div>
        <div>
          <label className="landing-feedback-label">وسيلة تواصل (اختياري)</label>
          <input className="premium-input" value={form.contactInfo} onChange={e => setForm({ ...form, contactInfo: e.target.value })} placeholder="بريد إلكتروني أو رقم هاتف" />
        </div>
        <div>
          <label className="landing-feedback-label">رسالتك *</label>
          <textarea className="premium-input" rows={4} style={{ resize: 'vertical' }} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="اكتب اقتراحك أو ملاحظتك هنا..." />
        </div>

        <button type="submit" className="btn-primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'جاري الإرسال...' : 'إرسال'}
        </button>

        {status === 'sent' && <p className="landing-feedback-status landing-feedback-status-success">تم إرسال رسالتك بنجاح، شكراً لتواصلك معنا.</p>}
        {status === 'error' && <p className="landing-feedback-status landing-feedback-status-error">يرجى تعبئة الاسم والرسالة بشكل صحيح.</p>}
      </form>
    </section>
  );
}
