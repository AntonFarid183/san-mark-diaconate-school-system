import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';

const CertificateScreen = () => {
  usePageTitle('الشهادة');
  const { id } = useParams();
  const navigate = useNavigate();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const r = await apiClient.get(`/certificate/${id}`);
        setCert(r.data);
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const w = window.open('', '_blank');
    w.document.write(`
      <!DOCTYPE html><html lang="ar" dir="rtl">
      <head><meta charset="UTF-8"><title>شهادة</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap');
        body { font-family: 'Tajawal', sans-serif; margin: 0; padding: 40px; background: white; color: #1a1a2e; }
        .cert { border: 8px double #b8860b; padding: 40px; max-width: 700px; margin: auto; text-align: center; }
        .cert h1 { color: #b8860b; font-size: 2rem; }
        .cert .name { font-size: 1.8rem; font-weight: 800; color: #1a1a2e; margin: 1rem 0; }
        .cert .score { font-size: 1.5rem; color: #b8860b; }
        .cert .detail { font-size: 0.95rem; color: #555; margin: 0.5rem 0; }
        .badge { display: inline-block; padding: 0.4rem 1.2rem; border-radius: 20px; font-weight: 700; font-size: 1.1rem; margin: 0.5rem auto; }
      </style></head>
      <body>${content}</body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  const classifyColor = (p) => {
    if (p >= 90) return '#16a34a';
    if (p >= 80) return '#2563eb';
    if (p >= 70) return '#d97706';
    if (p >= 60) return '#7c3aed';
    return '#dc2626';
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>;
  if (!cert) return <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--danger)' }}>الشهادة غير موجودة</p>;

  const pct = Math.round(cert.percentage);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button className="btn-secondary" style={{ width: 'auto', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          رجوع
        </button>
        <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={handlePrint}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>print</span>
          طباعة / تنزيل PDF
        </button>
      </div>

      {/* Certificate preview */}
      <div ref={printRef} className="cert" style={{
        border: '8px double var(--accent-gold)',
        borderRadius: '8px',
        padding: '3rem',
        maxWidth: '700px',
        margin: '0 auto',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.03)',
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '56px', color: 'var(--accent-gold)' }}>workspace_premium</span>
        </div>
        <h1 style={{ color: 'var(--accent-gold)', fontSize: '2rem', marginBottom: '0.5rem' }}>شهادة اجتياز</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>كنيسة سان مارك — مدرسة الشمامسة</p>

        <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>تُمنح هذه الشهادة إلى</p>
        <div className="name" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-gold)', margin: '1rem 0' }}>{cert.studentFullName}</div>

        <p style={{ fontSize: '0.95rem', margin: '0.5rem 0' }}>لاجتيازه امتحان: <strong>{cert.examTitle}</strong></p>
        <p style={{ fontSize: '0.95rem', margin: '0.5rem 0' }}>المرحلة: <strong>{cert.stageName}</strong> — السنة: <strong>{cert.gradeName}</strong></p>
        <p style={{ fontSize: '0.95rem', margin: '0.5rem 0' }}>العام الدراسي: <strong>{cert.academicYear}</strong></p>

        <div style={{ margin: '2rem 0' }}>
          <div className="score" style={{ fontSize: '2.5rem', fontWeight: 700, color: classifyColor(pct) }}>{pct}%</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{cert.score} من {cert.totalScore}</div>
          <span className="badge" style={{ background: `${classifyColor(pct)}22`, color: classifyColor(pct), marginTop: '0.5rem', display: 'inline-block', padding: '0.3rem 1.2rem', borderRadius: '20px', fontSize: '1.1rem', fontWeight: 700 }}>
            {cert.classification}
          </span>
        </div>

        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          تاريخ الإصدار: {new Date(cert.issuedAt).toLocaleDateString('ar-EG')}
        </div>
      </div>
    </>
  );
};

export default CertificateScreen;
