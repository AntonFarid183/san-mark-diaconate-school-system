import { useEffect } from 'react';
import { BACKEND_URL } from '../../config';

const fmt = (b) => b ? (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`) : null;

export default function CurriculumViewerModal({ item, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const download = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}${item.pdfUrl}`);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = item.pdfFileName || `${item.title}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { /* silent — preview remains available even if download fails */ }
  };

  return (
    <div className="landing-viewer-backdrop" onClick={onClose}>
      <div className="landing-viewer-panel" onClick={e => e.stopPropagation()}>
        <div className="landing-viewer-toolbar">
          <div className="landing-viewer-toolbar-info">
            <span className="material-symbols-outlined landing-viewer-toolbar-icon">auto_stories</span>
            <div>
              <div className="landing-viewer-toolbar-title">{item.title}</div>
              <div className="landing-viewer-toolbar-meta">
                {item.stageName}{item.academicYear ? ` · ${item.academicYear}` : ''}{fmt(item.pdfSizeBytes) ? ` · ${fmt(item.pdfSizeBytes)}` : ''}
              </div>
            </div>
          </div>

          <div className="landing-viewer-toolbar-actions">
            <button className="landing-viewer-action-btn" onClick={download} title="تنزيل">
              <span className="material-symbols-outlined">download</span>
            </button>
            <button className="landing-viewer-action-btn landing-viewer-close-btn" onClick={onClose} title="إغلاق">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="landing-viewer-frame-wrap">
          <iframe src={`${BACKEND_URL}${item.pdfUrl}`} title={item.title} />
        </div>
      </div>
    </div>
  );
}
