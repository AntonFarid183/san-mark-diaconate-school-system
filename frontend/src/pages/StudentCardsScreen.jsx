import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';
import StudentIdCard, { CARD_WIDTH_MM, CARD_HEIGHT_MM } from '../components/StudentIdCard';
import { BACKEND_URL as BACKEND } from '../config';

const toAbsUrl = (url) => (!url ? null : url.startsWith('http') ? url : `${BACKEND}${url}`);
// Mirrors DiaconateSchool.Domain.Enums.StudentLevel (Level1 = 1, Level2 = 2)
const LEVEL_LABELS = { 1: 'المستوى 1', 2: 'المستوى 2' };

// Same dark palette as StudentIdCard.jsx's PALETTE.dark — kept in sync by
// hand since this build's a plain HTML string for window.print(), not React.
// bgFrom/bgTo/gold/goldSoft/goldFaint/panelBorder are the *default* theme
// (used when a student's grade/stage isn't in GRADE_ACCENTS below, e.g.
// خريجون -- graduates weren't given their own color) — text colors and
// everything else stay the same across every grade.
const PAL = {
  bgFrom: '#0f172a', bgTo: '#111c34', text: '#f1f5f9', subtext: '#93a1b8',
  gold: '#fbbf24', goldSoft: 'rgba(251,191,36,0.35)', goldFaint: 'rgba(251,191,36,0.14)',
  panel: 'rgba(255,255,255,0.04)', panelBorder: 'rgba(251,191,36,0.22)', chipBg: 'rgba(255,255,255,0.06)',
};

// A full theme (dark tinted background + a brighter accent in the same hue,
// for the border/name-plate/glow/footer-rule) per grade -- the whole card
// background changes now, not just the trim. KG1/KG2 and each primary grade
// (1st-6th) get their own color; إعدادي (Middle) and ثانوي (High) are
// grouped -- every grade within either stage shares one color rather than
// splitting further; جامعة (University) and كبار (Adult) each get one too.
// Same soft/faint/border alpha ratios as the original gold (0.35/0.14/0.22).
// Kept in sync by hand with the identical map in StudentIdCard.jsx (same
// "plain string vs React" reason as the PAL duplication above).
// v3: v2's 600/700 shades were called too bright/loud. Shifted one step
// darker to Tailwind's 700/800 shades -- still a clearly distinct color per
// grade (not back to v1's muddy near-black), just calmer. Accent stays the
// 300 shade -- still pops fine as trim against the slightly darker body.
const GRADE_ACCENTS = {
  'KG1': { bgFrom: '#be123c', bgTo: '#9f1239', color: '#fda4af', soft: 'rgba(253,164,175,0.35)', faint: 'rgba(253,164,175,0.14)', border: 'rgba(253,164,175,0.22)' },
  'KG2': { bgFrom: '#c2410c', bgTo: '#9a3412', color: '#fdba74', soft: 'rgba(253,186,116,0.35)', faint: 'rgba(253,186,116,0.14)', border: 'rgba(253,186,116,0.22)' },
  'الصف 1 الابتدائي': { bgFrom: '#b45309', bgTo: '#92400e', color: '#fcd34d', soft: 'rgba(252,211,77,0.35)', faint: 'rgba(252,211,77,0.14)', border: 'rgba(252,211,77,0.22)' },
  'الصف 2 الابتدائي': { bgFrom: '#4d7c0f', bgTo: '#3f6212', color: '#bef264', soft: 'rgba(190,242,100,0.35)', faint: 'rgba(190,242,100,0.14)', border: 'rgba(190,242,100,0.22)' },
  'الصف 3 الابتدائي': { bgFrom: '#047857', bgTo: '#065f46', color: '#6ee7b7', soft: 'rgba(110,231,183,0.35)', faint: 'rgba(110,231,183,0.14)', border: 'rgba(110,231,183,0.22)' },
  'الصف 4 الابتدائي': { bgFrom: '#0f766e', bgTo: '#115e59', color: '#5eead4', soft: 'rgba(94,234,212,0.35)', faint: 'rgba(94,234,212,0.14)', border: 'rgba(94,234,212,0.22)' },
  'الصف 5 الابتدائي': { bgFrom: '#0369a1', bgTo: '#075985', color: '#7dd3fc', soft: 'rgba(125,211,252,0.35)', faint: 'rgba(125,211,252,0.14)', border: 'rgba(125,211,252,0.22)' },
  'الصف 6 الابتدائي': { bgFrom: '#6d28d9', bgTo: '#5b21b6', color: '#c4b5fd', soft: 'rgba(196,181,253,0.35)', faint: 'rgba(196,181,253,0.14)', border: 'rgba(196,181,253,0.22)' },
  'إعدادي': { bgFrom: '#a21caf', bgTo: '#86198f', color: '#f0abfc', soft: 'rgba(240,171,252,0.35)', faint: 'rgba(240,171,252,0.14)', border: 'rgba(240,171,252,0.22)' },
  'ثانوي': { bgFrom: '#b91c1c', bgTo: '#991b1b', color: '#fca5a5', soft: 'rgba(252,165,165,0.35)', faint: 'rgba(252,165,165,0.14)', border: 'rgba(252,165,165,0.22)' },
  'جامعة': { bgFrom: '#475569', bgTo: '#334155', color: '#cbd5e1', soft: 'rgba(203,213,225,0.35)', faint: 'rgba(203,213,225,0.14)', border: 'rgba(203,213,225,0.22)' },
  'كبار': { bgFrom: '#57534e', bgTo: '#44403c', color: '#d6d3d1', soft: 'rgba(214,211,209,0.35)', faint: 'rgba(214,211,209,0.14)', border: 'rgba(214,211,209,0.22)' },
};
// إعدادي/ثانوي are grouped by stage (ignore which of the 3 grades); every
// other stage has exactly one grade per student anyway, so keying by grade
// name works for all of them, including future grades this map hasn't seen.
function gradeColorKey(student) {
  if (student?.stageName === 'إعدادي' || student?.stageName === 'ثانوي') return student.stageName;
  return student?.gradeName || student?.stageName;
}
function gradeAccent(student) {
  return GRADE_ACCENTS[gradeColorKey(student)] || { bgFrom: PAL.bgFrom, bgTo: PAL.bgTo, color: PAL.gold, soft: PAL.goldSoft, faint: PAL.goldFaint, border: PAL.panelBorder };
}

// ── Print rendering ──────────────────────────────────────────────────────
// Reuses the same window.open + document.write print pattern already used
// by CertificateScreen, rather than pulling in a PDF library. Each card gets
// its own page sized to the real ID-card aspect ratio (85.60 × 53.98mm) so
// nothing stretches; "Save as PDF" in the browser's print dialog covers the
// "download" requirement without extra tooling. Mirrors StudentIdCard.jsx's
// markup/design 1:1 — this used to be a separate old placeholder layout that
// never got updated when the card's visual design landed.
// cacheBust: true (capture path only) appends a unique query param to the
// photo URL so the very first request the browser makes for it is already
// distinct from any plain (non-CORS) cached copy the on-screen student grid
// left behind -- appending it later, after the HTML is already inserted,
// is too late: the browser starts loading the un-busted src the instant
// innerHTML is parsed, firing a doomed extra request before any JS runs.
async function buildCardHtml(student, { cacheBust = false } = {}) {
  let photoUrl = toAbsUrl(student.profilePictureUrl);
  if (photoUrl && cacheBust) photoUrl += (photoUrl.includes('?') ? '&' : '?') + '_dl=' + Date.now();
  const qrDataUrl = student.qrToken ? await QRCode.toDataURL(student.qrToken, { width: 200, margin: 0 }) : '';
  const levelText = LEVEL_LABELS[student.level] ?? '—';
  const name = student.fullName || '—';
  const initials = name.trim().charAt(0) || 'ط';
  const accent = gradeAccent(student);

  return `
    <div class="card" style="--bg-from:${accent.bgFrom}; --bg-to:${accent.bgTo}; --accent:${accent.color}; --accent-soft:${accent.soft}; --accent-faint:${accent.faint}; --accent-border:${accent.border};">
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
            ${photoUrl ? `<img src="${photoUrl}" crossorigin="anonymous" />` : `<span class="initials">${initials}</span>`}
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

// Waits for every <img> in the print window to finish loading (or fail) before
// calling print(). Without this, w.print() fires synchronously right after
// document.write() — local assets like the two logos are usually cached and
// make it in time, but each student's photo is a fresh network request per
// card, and with "Print All" firing dozens of them at once most haven't
// loaded yet, so they print as empty boxes while everything else (borders,
// text, the QR, which is an inline data URL) renders fine. Resolves on error
// too, so one broken/missing photo doesn't hang the whole print job.
function waitForImages(root) {
  const imgs = Array.from(root.querySelectorAll('img'));
  return Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          })
    )
  );
}

// Chunks flat card-HTML strings into sheets of 10 (2 cols × 5 rows — the
// layout that fits exactly 10 real ID-1 cards, 85.6×53.98mm each, onto one
// A4 sheet in portrait with room left for the recess+gap below). Each card
// is wrapped in a slightly bigger .card-cell so the printed card sits
// recessed 1mm inside a dashed cut-guide line -- a scissor/cutter running a
// bit wide only clips blank paper, never the card's border/text/photo. Only
// the last sheet may end up partially empty (e.g. printing 13 students ->
// sheet 2 has 3 cards + 7 blank grid cells), which is fine to cut around.
const CARDS_PER_SHEET = 10;
function buildSheetsHtml(cardHtmls) {
  const sheets = [];
  for (let i = 0; i < cardHtmls.length; i += CARDS_PER_SHEET) {
    sheets.push(cardHtmls.slice(i, i + CARDS_PER_SHEET));
  }
  return sheets
    .map((sheetCards) => `<div class="sheet">${sheetCards.map((c) => `<div class="card-cell">${c}</div>`).join('')}</div>`)
    .join('');
}

// The card's own look (everything from .card down to .footer-rule) is
// shared between the print window (a fresh, isolated document -- safe to
// leave unscoped) and the offscreen capture container used for JPG/ZIP
// downloads (rendered inside the live app page, where bare names like
// .header or .body could collide with the app's own CSS -- must be scoped).
// One source of truth, optionally prefixed, so the two never drift apart.
function cardCss() {
  return `
    .card { position: relative; width: ${CARD_WIDTH_MM}mm; height: ${CARD_HEIGHT_MM}mm; border-radius: 3.18mm; overflow: hidden; background: linear-gradient(155deg, var(--bg-from) 0%, var(--bg-to) 60%, var(--bg-from) 100%); border: 0.28mm solid var(--accent-border); display: flex; flex-direction: column; }
    .glow-top { position: absolute; top: -14mm; right: -10mm; width: 34mm; height: 34mm; border-radius: 50%; background: radial-gradient(circle, var(--accent-faint) 0%, transparent 70%); }
    .glow-bottom { position: absolute; bottom: -16mm; left: -12mm; width: 30mm; height: 30mm; border-radius: 50%; background: radial-gradient(circle, var(--accent-faint) 0%, transparent 70%); }
    .header { position: relative; display: flex; align-items: center; gap: 1.6mm; padding: 2mm 2.6mm 1.6mm; border-bottom: 0.2mm solid var(--accent-soft); }
    .church-logo { width: 7mm; height: 7mm; object-fit: contain; flex-shrink: 0; }
    .header-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.3mm; }
    .church-name { font-size: 2.4mm; font-weight: 700; color: ${PAL.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .school-name { font-size: 2.9mm; font-weight: 800; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .school-badge { width: 9mm; height: 9mm; border-radius: 1.6mm; background: #fff; border: 0.22mm solid var(--accent-soft); display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
    .school-badge img { width: 100%; height: 100%; object-fit: cover; }
    .body { position: relative; flex: 1; display: flex; align-items: stretch; gap: 2mm; padding: 2mm 2.6mm; min-height: 0; }
    .photo-col { display: flex; flex-direction: column; align-items: center; gap: 1.3mm; flex-shrink: 0; }
    .photo-frame { width: 15mm; height: 18mm; border-radius: 2mm; border: 0.3mm solid var(--accent-soft); background: ${PAL.panel}; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .photo-frame img { width: 100%; height: 100%; object-fit: cover; }
    .initials { font-size: 5mm; font-weight: 800; color: var(--accent); }
    .code-chip { font-size: 1.9mm; font-weight: 700; color: ${PAL.text}; background: ${PAL.chipBg}; border: 0.18mm solid var(--accent-soft); border-radius: 1mm; padding: 0.6mm 1.4mm; white-space: nowrap; direction: ltr; }
    .info-col { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 1.6mm; }
    .name { font-size: 3.4mm; font-weight: 800; color: ${PAL.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; column-gap: 2.2mm; row-gap: 1.6mm; }
    .meta-item { display: flex; flex-direction: column; gap: 0.3mm; min-width: 0; }
    .meta-label { font-size: 2mm; font-weight: 600; color: ${PAL.subtext}; }
    .meta-value { font-size: 2.6mm; font-weight: 700; color: ${PAL.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .qr-col { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .qr-chip { width: 15mm; height: 15mm; background: #fff; border-radius: 1.4mm; border: 0.3mm solid var(--accent-soft); padding: 1.1mm; box-sizing: border-box; }
    .qr-chip img { width: 100%; height: 100%; display: block; }
    .footer-rule { height: 1.4mm; background: linear-gradient(90deg, transparent, var(--accent), transparent); opacity: 0.5; }
  `;
}

// Prefixes every rule above with `scope` (e.g. ".card-capture-scope") so it
// only ever applies inside that container. Each rule lives on its own line
// as ".selector { ... }", so prefixing the text before the first "{" on
// each line is enough -- no manual second copy of the CSS to keep in sync.
function scopedCardCss(scope) {
  const css = cardCss();
  if (!scope) return css;
  return css.replace(/^(\s*)(\.[^\n{]+)\{/gm, (_m, indent, selector) => `${indent}${scope} ${selector.trim()} {`);
}

function openPrintWindow(cardHtmls) {
  const w = window.open('', '_blank');
  w.document.write(`
    <!DOCTYPE html><html lang="ar" dir="rtl">
    <head><meta charset="UTF-8"><title>كارنيهات الطلاب</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />
    <style>
      /* A4 portrait, 5mm margin -- safe minimum for virtually all printers.
         Grid below (2 cols x 5 rows of 87.6x55.98mm cells, 3mm/1.5mm gaps)
         totals 178.2 x 285.9mm, fitting inside the 200x287mm printable area
         with margin to spare -- verified by hand, not eyeballed. */
      @page { size: A4; margin: 5mm; }
      * { box-sizing: border-box; }
      body { font-family: 'Cairo', 'Segoe UI', sans-serif; margin: 0; background: #fff; }
      .sheet {
        display: grid;
        grid-template-columns: repeat(2, ${CARD_WIDTH_MM + 2}mm);
        grid-template-rows: repeat(5, ${CARD_HEIGHT_MM + 2}mm);
        column-gap: 3mm; row-gap: 1.5mm;
        justify-content: center;
        page-break-after: always;
      }
      .sheet:last-child { page-break-after: auto; }
      .card-cell {
        width: ${CARD_WIDTH_MM + 2}mm; height: ${CARD_HEIGHT_MM + 2}mm;
        border: 0.15mm dashed #999;
        display: flex; align-items: center; justify-content: center;
      }
      ${scopedCardCss()}
    </style></head>
    <body>${buildSheetsHtml(cardHtmls)}</body></html>
  `);
  w.document.close();
  waitForImages(w.document).then(() => {
    w.focus();
    w.print();
  });
}

// Filesystem-safe filename for one student's card: code first (always
// unique, plain ASCII) so files sort/identify cleanly even if two students
// share a name; Arabic name kept for readability, just stripped of
// characters Windows/macOS reject in filenames.
function cardFileName(student) {
  const safeName = (student.fullName || 'طالب').replace(/[\\/:*?"<>|]/g, '').trim();
  return `${student.studentCode || student.id}_${safeName}.jpg`;
}

let captureStyleInjected = false;
function ensureCaptureStyle() {
  if (captureStyleInjected) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'card-capture-style';
  styleEl.textContent = scopedCardCss('.card-capture-scope');
  document.head.appendChild(styleEl);
  captureStyleInjected = true;
}

// Renders one student's card offscreen (in the live app page, not a popup --
// this is what lets "download" skip the print dialog entirely) and rasterizes
// it to a JPG blob via html2canvas. scale:3 gives ~300dpi-equivalent output
// so photos/text stay crisp if Bishoy resizes or edits the file afterwards.
//
// The student photo's <img> (see buildCardHtml) carries crossorigin="anonymous"
// from the moment it's created -- that's what lets html2canvas's useCORS read
// its pixels. An earlier version fetched each photo manually and swapped in a
// data: URL instead; that broke silently for every photo in production
// (print, which never touches html2canvas, kept working throughout, which is
// what pointed at this code path specifically). crossorigin has to be set
// before the browser's *first* request for that URL -- setting it only on a
// later re-fetch risks the browser reusing an already-cached, non-CORS
// response instead of revalidating with the right headers.
async function captureCardBlob(student) {
  ensureCaptureStyle();
  const cardHtml = await buildCardHtml(student, { cacheBust: true });
  const container = document.createElement('div');
  container.className = 'card-capture-scope';
  container.style.cssText = 'position:fixed; left:-99999px; top:0; z-index:-1;';
  container.innerHTML = cardHtml;
  document.body.appendChild(container);
  try {
    await waitForImages(container);
    const canvas = await html2canvas(container.querySelector('.card'), {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
    });
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  } finally {
    container.remove();
  }
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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
  const [downloading, setDownloading] = useState(false);

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
      const cardHtmls = await Promise.all(list.map(buildCardHtml));
      openPrintWindow(cardHtmls);
    } finally {
      setPrinting(false);
    }
  };

  // Separate from printing entirely -- no print dialog, no "Save as PDF"
  // detour. Each card comes out as its own JPG so it can be resized/edited
  // individually (Photoshop, etc.) afterwards. One student downloads
  // straight as a .jpg; more than one gets zipped so the browser doesn't
  // fire off a dozen simultaneous downloads.
  const downloadStudents = async (list) => {
    if (list.length === 0) return;
    setDownloading(true);
    try {
      if (list.length === 1) {
        const blob = await captureCardBlob(list[0]);
        triggerBlobDownload(blob, cardFileName(list[0]));
        return;
      }
      const zip = new JSZip();
      for (const student of list) {
        const blob = await captureCardBlob(student);
        zip.file(cardFileName(student), blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      triggerBlobDownload(zipBlob, 'كارنيهات الطلاب.zip');
    } finally {
      setDownloading(false);
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
          <button
            className="btn-secondary"
            style={{ width: 'auto', padding: '0.5rem 1.1rem' }}
            disabled={selected.size === 0 || downloading}
            onClick={() => downloadStudents(students.filter(s => selected.has(s.id)))}
          >
            تنزيل المحدد ({selected.size})
          </button>
          <button
            className="btn-secondary"
            style={{ width: 'auto', padding: '0.5rem 1.1rem' }}
            disabled={students.length === 0 || downloading}
            onClick={() => downloadStudents(students)}
          >
            تنزيل الكل ({students.length})
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))', gap: '1.25rem' }}>
          {students.map(s => (
            <div key={s.id} className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} />
                تحديد
              </label>

              <StudentIdCard student={s} />

              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <button
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  disabled={printing}
                  onClick={() => printStudents([s])}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle', marginLeft: '0.3rem' }}>print</span>
                  طباعة
                </button>
                <button
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  disabled={downloading}
                  onClick={() => downloadStudents([s])}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle', marginLeft: '0.3rem' }}>download</span>
                  تنزيل JPG
                </button>
              </div>
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
