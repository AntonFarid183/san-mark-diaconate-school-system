import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

/**
 * Generic Excel export modal — column selection, ordering, and saved templates.
 * columns: [{ key, label }]
 * rows: array of plain objects already shaped with the given keys
 * storageKey: unique per screen — used to namespace saved templates in localStorage
 */
export default function ExportModal({ columns, rows, storageKey, fileName, sheetName = 'Sheet1', onClose }) {
  const templatesKey = `export-templates:${storageKey}`;

  const [selected, setSelected] = useState(columns.map(c => c.key));
  const [templates, setTemplates] = useState({});
  const [templateName, setTemplateName] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(templatesKey);
      if (raw) setTemplates(JSON.parse(raw));
    } catch { /* ignore corrupt storage */ }
  }, [templatesKey]);

  const colByKey = Object.fromEntries(columns.map(c => [c.key, c]));
  const availableKeys = columns.map(c => c.key).filter(k => !selected.includes(k));

  const addColumn = (key) => setSelected(prev => [...prev, key]);
  const removeColumn = (key) => setSelected(prev => prev.filter(k => k !== key));
  const moveUp = (idx) => {
    if (idx === 0) return;
    setSelected(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };
  const moveDown = (idx) => {
    setSelected(prev => {
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const saveTemplate = () => {
    if (!templateName.trim()) return;
    const next = { ...templates, [templateName.trim()]: selected };
    setTemplates(next);
    localStorage.setItem(templatesKey, JSON.stringify(next));
    setTemplateName('');
  };

  const loadTemplate = (name) => {
    const cols = templates[name];
    if (cols) setSelected(cols.filter(k => colByKey[k])); // drop any stale keys
  };

  const deleteTemplate = (name) => {
    const next = { ...templates };
    delete next[name];
    setTemplates(next);
    localStorage.setItem(templatesKey, JSON.stringify(next));
  };

  const doExport = () => {
    if (selected.length === 0) return;
    setExporting(true);
    try {
      const exportRows = rows.map(row => {
        const obj = {};
        selected.forEach(key => { obj[colByKey[key].label] = row[key] ?? ''; });
        return obj;
      });
      const ws = XLSX.utils.json_to_sheet(exportRows);
      ws['!cols'] = selected.map(() => ({ wch: 18 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
      XLSX.writeFile(wb, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
      onClose();
    } finally {
      setExporting(false);
    }
  };

  const previewRows = rows.slice(0, 5);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: '2rem' }} onClick={onClose}>
      <div className="glass-card" style={{ padding: '2rem', width: '760px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', direction: 'rtl' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'var(--accent-gold)' }}>تصدير Excel</h3>
          <span onClick={onClose} style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}>✕</span>
        </div>

        {/* Templates */}
        {Object.keys(templates).length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>القوالب المحفوظة</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {Object.keys(templates).map(name => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem', borderRadius: '20px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
                  <span onClick={() => loadTemplate(name)} style={{ cursor: 'pointer', fontSize: '0.8rem', color: 'var(--accent-gold)' }}>{name}</span>
                  <span onClick={() => deleteTemplate(name)} style={{ cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)' }}>✕</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Column pickers */}
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <label style={labelStyle}>الأعمدة المتاحة</label>
            <div style={{ border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', minHeight: '160px', maxHeight: '260px', overflowY: 'auto' }}>
              {availableKeys.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>تم اختيار جميع الأعمدة</p>
              ) : availableKeys.map(key => (
                <div key={key} onClick={() => addColumn(key)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span>{colByKey[key].label}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>add</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '260px' }}>
            <label style={labelStyle}>الأعمدة المختارة (بترتيب التصدير)</label>
            <div style={{ border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', minHeight: '160px', maxHeight: '260px', overflowY: 'auto' }}>
              {selected.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>لم يتم اختيار أي عمود</p>
              ) : selected.map((key, idx) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', borderRadius: '6px', background: 'rgba(251,191,36,0.06)', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                  <span>{colByKey[key]?.label}</span>
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    <button onClick={() => moveUp(idx)} disabled={idx === 0} style={miniBtnStyle}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>arrow_upward</span>
                    </button>
                    <button onClick={() => moveDown(idx)} disabled={idx === selected.length - 1} style={miniBtnStyle}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>arrow_downward</span>
                    </button>
                    <button onClick={() => removeColumn(key)} style={{ ...miniBtnStyle, color: 'var(--danger)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save template */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <input className="premium-input" placeholder="اسم القالب (اختياري)" value={templateName} onChange={e => setTemplateName(e.target.value)} style={{ flex: 1 }} />
          <button onClick={saveTemplate} disabled={!templateName.trim()} className="btn-secondary" style={{ width: 'auto', padding: '0.5rem 1.25rem' }}>حفظ كقالب</button>
        </div>

        {/* Preview */}
        {selected.length > 0 && previewRows.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>معاينة (أول 5 صفوف)</label>
            <div style={{ overflowX: 'auto', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ background: 'var(--track-inset)' }}>
                    {selected.map(key => (
                      <th key={key} style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{colByKey[key]?.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--surface-2)' }}>
                      {selected.map(key => (
                        <td key={key} style={{ padding: '0.4rem 0.75rem', whiteSpace: 'nowrap' }}>{String(row[key] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={doExport} disabled={selected.length === 0 || exporting} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
            {exporting ? 'جاري التصدير...' : `تصدير ${rows.length} صف`}
          </button>
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600,
};

const miniBtnStyle = {
  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.1rem', display: 'flex', alignItems: 'center',
};
