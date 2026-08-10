import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';
import StudentIdCard, { CARD_WIDTH_MM, CARD_HEIGHT_MM } from '../components/StudentIdCard';
import { BACKEND_URL as BACKEND } from '../config';

const toAbsUrl = (url) => (!url ? null : url.startsWith('http') ? url : `${BACKEND}${url}`);
// Mirrors DiaconateSchool.Domain.Enums.StudentLevel (Level1 = 1, Level2 = 2)
const LEVEL_LABELS = { 1: 'المستوى 1', 2: 'المستوى 2' };

// Same dark palette as StudentIdCard.jsx's PALETTE.dark — kept in sync by
// hand since this build's a plain HTML string for window.print(), not React.
const PAL = {
  bgFrom: '#0f172a', bgTo: '#111c34', text: '#f1f5f9', subtext: '#93a1b8',
  gold: '#fbbf24', goldSoft: 'rgba(251,191,36,0.35)', goldFaint: 'rgba(251,191,36,0.14)',
  panel: 'rgba(255,255,255,0.04)', panelBorder: 'rgba(251,191,36,0.22)', chipBg: 'rgba(255,255,255,0.06)',
};

// ── Print rendering ──────────────────────────────────────────────────────
// Reuses the same window.open + document.write print pattern already used
// by CertificateScreen, rather than pulling in a PDF library. Each card gets
// its own page sized to the real ID-card aspect ratio (85.60 × 53.98mm) so
// nothing stretches; "Save as PDF" in the browser's print dialog covers the
// "download" requirement without extra tooling. Mirrors StudentIdCard.jsx's
// markup/design 1:1 — this used to be a separate old placeholder layout that
// never got updated when the card's visual design landed.
async function buildCardHtml(student) {
  const photoUrl = toAbsUrl(student.profilePictureUrl);
  const qrDataUrl = student.qrToken ? await QRCode.toDataURL(student.qrToken, { width: 200, margin: 0 }) : '';
  const levelText = LEVEL_LABELS[student.level] ?? '—';
  const name = student.fullName || '—';
  const initials = name.trim().charAt(0) || 'ط';

  return `
    <div class="card">
      <div class="glow-top"></div>
      <div class="glow-bottom"></div>
      <div class="header">
        <img class="church-logo" src="${window.location.origin}/church logo.png" alt="" />
        <div class="header-text">
          <div class="church-name">كنيسة مارمرقس الرسول</div>
          <div class="school-name">مدرسة بي ثيؤريموس للألحان والتسبحة</div>
        </div>
        <div class="school-badge"><img src="${window.location.origin}/school logo.png" alt="" /></div>
      </div>
      <div class="body">
        <div class="photo-col">
          <div class="photo-frame">
            ${photoUrl ? `<img src="${photoUrl}" />` : `<span class="initials">${initials}</span>`}
          </div>
          <div class="code-chip">${student.studentCode || ''}</div>
        </div>
        <div class="info-col">
          <div class="name" title="${name}">${name}</div>
          <div class="meta-grid">
            <div class="meta-item"><span class="meta-label">المرحلة</span><span class="meta-value">${student.stageName || '—'}</span></div>
            <div class="meta-item"><span class="meta-label">الصف</span><span class="meta-value">${student.gradeName || '—'}</span></div>
            <div class="meta-item"><span class="meta-label">الفصل</span><span class="meta-value">${student.className || '—'}</span></div>
            <div class="meta-item"><span class="meta-label">المستوى</span><span class="meta-value">${levelText}</span></div>
          </div>
        </div>
        <div class="qr-col">
          <div class="qr-chip">${qrDataUrl ? `<img src="${qrDataUrl}" />` : ''}</div>
        </div>
      </div>
      <div class="footer-rule"></div>
    </div>`;
}

function openPrintWindow(cardsHtml) {
  const w = window.open('', '_blank');
  w.document.write(`
    <!DOCTYPE html><html lang="ar" dir="rtl">
    <head><meta charset="UTF-8"><title>كارنيهات الطلاب</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />
    <style>
      @page { size: ${CARD_WIDTH_MM}mm ${CARD_HEIGHT_MM}mm; margin: 0; }
      * { box-sizing: border-box; }
      body { font-family: 'Cairo', 'Segoe UI', sans-serif; margin: 0; background: #05070d; }
      .card {
        position: relative;
        width: ${CARD_WIDTH_MM}mm; height: ${CARD_HEIGHT_MM}mm;
        border-radius: 3.18mm; overflow: hidden;
        background: linear-gradient(155deg, ${PAL.bgFrom} 0%, ${PAL.bgTo} 60%, ${PAL.bgFrom} 100%);
        border: 0.28mm solid ${PAL.panelBorder};
        display: flex; flex-direction: column;
        page-break-after: always;
      }
      .glow-top { position: absolute; top: -14mm; right: -10mm; width: 34mm; height: 34mm; border-radius: 50%; background: radial-gradient(circle, ${PAL.goldFaint} 0%, transparent 70%); }
      .glow-bottom { position: absolute; bottom: -16mm; left: -12mm; width: 30mm; height: 30mm; border-radius: 50%; background: radial-gradient(circle, ${PAL.goldFaint} 0%, transparent 70%); }
      .header { position: relative; display: flex; align-items: center; gap: 1.6mm; padding: 2mm 2.6mm 1.6mm; border-bottom: 0.2mm solid ${PAL.goldSoft}; }
      .church-logo { width: 7mm; height: 7mm; object-fit: contain; flex-shrink: 0; }
      .header-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.3mm; }
      .church-name { font-size: 2.1mm; font-weight: 600; color: ${PAL.subtext}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .school-name { font-size: 2.6mm; font-weight: 800; color: ${PAL.gold}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .school-badge { width: 9mm; height: 9mm; border-radius: 1.6mm; background: #fff; border: 0.22mm solid ${PAL.goldSoft}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
      .school-badge img { width: 100%; height: 100%; object-fit: cover; }
      .body { position: relative; flex: 1; display: flex; align-items: stretch; gap: 2mm; padding: 2mm 2.6mm; min-height: 0; }
      .photo-col { display: flex; flex-direction: column; align-items: center; gap: 1.3mm; flex-shrink: 0; }
      .photo-frame { width: 15mm; height: 18mm; border-radius: 2mm; border: 0.3mm solid ${PAL.goldSoft}; background: ${PAL.panel}; overflow: hidden; display: flex; align-items: center; justify-content: center; }
      .photo-frame img { width: 100%; height: 100%; object-fit: cover; }
      .initials { font-size: 5mm; font-weight: 800; color: ${PAL.gold}; }
      .code-chip { font-size: 1.9mm; font-weight: 700; color: ${PAL.text}; background: ${PAL.chipBg}; border: 0.18mm solid ${PAL.goldSoft}; border-radius: 1mm; padding: 0.6mm 1.4mm; white-space: nowrap; direction: ltr; }
      .info-col { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 1.8mm; }
      .name { font-size: 3.4mm; font-weight: 800; color: ${PAL.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
      .meta-grid { display: grid; grid-template-columns: 1fr 1fr; column-gap: 2mm; row-gap: 1.3mm; }
      .meta-item { display: flex; flex-direction: column; gap: 0.3mm; min-width: 0; }
      .meta-label { font-size: 1.7mm; font-weight: 600; color: ${PAL.subtext}; }
      .meta-value { font-size: 2.1mm; font-weight: 700; color: ${PAL.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .qr-col { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .qr-chip { width: 15mm; height: 15mm; background: #fff; border-radius: 1.4mm; border: 0.3mm solid ${PAL.goldSoft}; padding: 1.1mm; box-sizing: border-box; }
      .qr-chip img { width: 100%; height: 100%; display: block; }
      .footer-rule { height: 1.4mm; background: linear-gradient(90deg, transparent, ${PAL.gold}, transparent); opacity: 0.5; }
    </style></head>
    <body>${cardsHtml}</body></html>
  `);
  w.document.close();
  w.focus();
  w.print();
}

const StudentCardsScreen = () => {
  usePageTitle('كارنيهات الطلاب');

  const [stages, setStages] = useState([]);
  const [grades, setGrades] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);

  const [stageId, setStageId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [classId, setClassId] = useState('');
  const [level, setLevel] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    apiClient.get('/students/stages').then(r => setStages(r.data)).catch(() => {});
    apiClient.get('/academic-years').then(r => setAcademicYears(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setGradeId(''); setGrades([]); setClassId(''); setClasses([]);
    if (stageId) {
      apiClient.get(`/students/grades/${stageId}`).then(r => setGrades(r.data)).catch(() => setGrades([]));
    }
  }, [stageId]);

  useEffect(() => {
    setClassId(''); setClasses([]);
    if (gradeId && academicYears.length > 0) {
      Promise.all(
        academicYears.map(y =>
          apiClient.get('/classes', { params: { gradeId, academicYearId: y.id } })
            .then(r => r.data)
            .catch(() => [])
        )
      ).then(results => setClasses(results.flat()));
    }
  }, [gradeId, academicYears]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = { page: 1, pageSize: 1000 };
      if (searchTerm.trim()) params.name = searchTerm.trim();
      if (classId) params.classId = classId;
      else if (gradeId) params.gradeId = gradeId;
      else if (stageId) params.stageId = stageId;
      if (level !== '') params.level = level;
      const res = await apiClient.get('/students', { params });
      setStudents(res.data.students);
      setSelected(new Set());
    } catch { setStudents([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStudents(); }, [stageId, gradeId, classId, level]);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const timer = setTimeout(fetchStudents, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const printStudents = async (list) => {
    if (list.length === 0) return;
    setPrinting(true);
    try {
      const cardsHtml = (await Promise.all(list.map(buildCardHtml))).join('');
      openPrintWindow(cardsHtml);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <>
      {/* Filters */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
        <div style={{ minWidth: '160px' }}>
          <label style={labelStyle}>المرحلة</label>
          <select className="premium-input" value={stageId} onChange={e => setStageId(e.target.value)}>
            <option value="">كل المراحل</option>
            {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={{ minWidth: '160px' }}>
          <label style={labelStyle}>الصف</label>
          <select className="premium-input" value={gradeId} onChange={e => setGradeId(e.target.value)} disabled={!stageId}>
            <option value="">كل الصفوف</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div style={{ minWidth: '140px' }}>
          <label style={labelStyle}>الفصل</label>
          <select className="premium-input" value={classId} onChange={e => setClassId(e.target.value)} disabled={!gradeId}>
            <option value="">كل الفصول</option>
            {classes.map(c => <option key={c.id} value={c.id}>فصل {c.name}</option>)}
          </select>
        </div>
        <div style={{ minWidth: '140px' }}>
          <label style={labelStyle}>المستوى</label>
          <select className="premium-input" value={level} onChange={e => setLevel(e.target.value)}>
            <option value="">كل المستويات</option>
            <option value="1">المستوى 1</option>
            <option value="2">المستوى 2</option>
          </select>
        </div>
        <div style={{ minWidth: '200px', flex: 1 }}>
          <label style={labelStyle}>البحث باسم الطالب</label>
          <input className="premium-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="اسم الطالب..." />
        </div>
      </div>

      {/* Bulk actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {students.length} طالب — {selected.size} محدد
        </span>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            className="btn-secondary"
            style={{ width: 'auto', padding: '0.5rem 1.1rem' }}
            disabled={selected.size === 0 || printing}
            onClick={() => printStudents(students.filter(s => selected.has(s.id)))}
          >
            طباعة المحدد ({selected.size})
          </button>
          <button
            className="btn-primary"
            style={{ width: 'auto', padding: '0.5rem 1.1rem' }}
            disabled={students.length === 0 || printing}
            onClick={() => printStudents(students)}
          >
            طباعة الكل ({students.length})
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>
      ) : students.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>badge</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>لا يوجد طلاب مطابقين لهذا الفلتر</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {students.map(s => (
            <div key={s.id} className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} />
                تحديد
              </label>

              <StudentIdCard student={s} />

              <button
                className="btn-secondary"
                style={{ width: '100%' }}
                disabled={printing}
                onClick={() => printStudents([s])}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle', marginLeft: '0.3rem' }}>print</span>
                طباعة / تنزيل PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

const labelStyle = {
  display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600,
};

export default StudentCardsScreen;
