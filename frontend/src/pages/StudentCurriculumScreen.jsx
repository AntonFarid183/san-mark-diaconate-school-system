import { useState, useEffect } from 'react';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';
import { BACKEND_URL } from '../config';

export default function StudentCurriculumScreen() {
  usePageTitle('المناهج الدراسية');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try { const r = await apiClient.get('/curriculum/my'); setItems(r.data); }
      catch { setItems([]); } finally { setLoading(false); }
    };
    fetch();
  }, []);

  const fmt = (bytes) => bytes ? (bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`) : null;

  const downloadFile = async (url, fileName) => {
    try {
      const res = await fetch(`${BACKEND_URL}${url}`);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName || 'curriculum.pdf';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { alert('تعذّر تنزيل الملف.'); }
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>;

  return (
    <>
      {items.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>menu_book</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>لا توجد مناهج منشورة لمرحلتك حالياً</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {items.map(item => (
            <div key={item.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--accent-gold)' }}>menu_book</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.stageName} — {item.academicYear}</div>
                </div>
              </div>
              {item.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.description}</p>}
              {item.pdfUrl && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {item.pdfFileName} {fmt(item.pdfSizeBytes) && `· ${fmt(item.pdfSizeBytes)}`}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                {item.pdfUrl ? (
                  <>
                    <button className="btn-primary" style={{ flex: 1, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                      onClick={() => setViewing(item)}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                      عرض
                    </button>
                    <button onClick={() => downloadFile(item.pdfUrl, item.pdfFileName)}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                      تنزيل
                    </button>
                  </>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', width: '100%' }}>لم يُرفع ملف PDF بعد</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF Viewer Modal */}
      {viewing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.5rem', background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid var(--glass-border)' }}>
            <span style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>{viewing.title}</span>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button onClick={() => downloadFile(viewing.pdfUrl, viewing.pdfFileName)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                تنزيل
              </button>
              <button onClick={() => setViewing(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>✕</button>
            </div>
          </div>
          <iframe
            src={`${BACKEND_URL}${viewing.pdfUrl}`}
            style={{ flex: 1, border: 'none', width: '100%' }}
            title={viewing.title}
          />
        </div>
      )}
    </>
  );
}
