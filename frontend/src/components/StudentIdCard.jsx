import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { BACKEND_URL as BACKEND } from '../config';

const toAbsUrl = (url) => (!url ? null : url.startsWith('http') ? url : `${BACKEND}${url}`);

// ── StudentIdCard ─────────────────────────────────────────────────────────
// Final visual design (Coptic School ID Card, from Claude Design project
// fa4039ff-08b3-4e35-b997-9d15d296b202 / "Student ID Card.dc.html"), ported
// to React. Props/API unchanged from the functional placeholder — nothing
// that renders <StudentIdCard student={student} /> needed to change.
//
// `student` accepts either shape the API already returns — the admin list
// item (StudentListItemDto) or a student's own profile (StudentDetailDto) —
// since both use the same field names (fullName/gradeName/stageName/level/
// className/studentCode/qrToken/profilePictureUrl). This is also what keeps
// a future "Student → My ID Card" screen a drop-in reuse of this component.
export const CARD_WIDTH_MM = 85.6;
export const CARD_HEIGHT_MM = 53.98;

// Mirrors DiaconateSchool.Domain.Enums.StudentLevel (Level1 = 1, Level2 = 2)
const LEVEL_LABELS = { 1: 'المستوى 1', 2: 'المستوى 2', Level1: 'المستوى 1', Level2: 'المستوى 2' };

function levelLabel(level) {
  if (level === null || level === undefined || level === '') return null;
  return LEVEL_LABELS[level] ?? String(level);
}

// Every stage's card is a plain white card now (per Bishoy: "keeping the
// exact same design... completely white background for every stage" — the
// reference card he sent has one fixed white body, only the frame/border
// color changes per stage). Same text/panel/chip values regardless of
// theme or grade — only the accent (gold family, in GRADE_ACCENTS below)
// varies. `theme` prop is kept for API compatibility but no longer changes
// the card's own colors (it never should have — this card always renders
// standalone, independent of the admin page's light/dark toggle).
const WHITE = {
  bgFrom: '#ffffff', bgTo: '#f8fafc', text: '#0f172a', subtext: '#475569',
  panel: 'rgba(15,23,42,0.04)', chipBg: 'rgba(15,23,42,0.06)',
  shadow: '0 1mm 2.4mm rgba(21,34,56,0.18)',
};
// Default accent (used by any grade/stage below with no entry of its own).
const DEFAULT_ACCENT = { gold: '#fbbf24', goldSoft: 'rgba(251,191,36,0.35)', goldFaint: 'rgba(251,191,36,0.14)', panelBorder: 'rgba(251,191,36,0.22)' };

// One accent color per grade — this is the only thing that varies card to
// card now (border/frame, header rule, photo-frame border, code chip,
// footer rule). KG1/KG2 and each primary grade (1st-6th) get their own;
// إعدادي (Middle) and ثانوي (High) are grouped -- every grade within either
// stage shares one accent rather than splitting further; جامعة (University)
// and كبار (Adult) each get one too. Kept in sync by hand with the identical
// map in StudentCardsScreen.jsx (print/download build the card as a plain
// HTML string, not through this component).
const GRADE_ACCENTS = {
  'KG1': { gold: '#e11d48', goldSoft: 'rgba(225,29,72,0.35)', goldFaint: 'rgba(225,29,72,0.14)', panelBorder: 'rgba(225,29,72,0.35)' },
  'KG2': { gold: '#ea580c', goldSoft: 'rgba(234,88,12,0.35)', goldFaint: 'rgba(234,88,12,0.14)', panelBorder: 'rgba(234,88,12,0.35)' },
  'الصف 1 الابتدائي': { gold: '#b45309', goldSoft: 'rgba(180,83,9,0.35)', goldFaint: 'rgba(180,83,9,0.14)', panelBorder: 'rgba(180,83,9,0.35)' },
  'الصف 2 الابتدائي': { gold: '#4d7c0f', goldSoft: 'rgba(77,124,15,0.35)', goldFaint: 'rgba(77,124,15,0.14)', panelBorder: 'rgba(77,124,15,0.35)' },
  'الصف 3 الابتدائي': { gold: '#047857', goldSoft: 'rgba(4,120,87,0.35)', goldFaint: 'rgba(4,120,87,0.14)', panelBorder: 'rgba(4,120,87,0.35)' },
  'الصف 4 الابتدائي': { gold: '#0f766e', goldSoft: 'rgba(15,118,110,0.35)', goldFaint: 'rgba(15,118,110,0.14)', panelBorder: 'rgba(15,118,110,0.35)' },
  'الصف 5 الابتدائي': { gold: '#0369a1', goldSoft: 'rgba(3,105,161,0.35)', goldFaint: 'rgba(3,105,161,0.14)', panelBorder: 'rgba(3,105,161,0.35)' },
  'الصف 6 الابتدائي': { gold: '#6d28d9', goldSoft: 'rgba(109,40,217,0.35)', goldFaint: 'rgba(109,40,217,0.14)', panelBorder: 'rgba(109,40,217,0.35)' },
  'إعدادي': { gold: '#92400e', goldSoft: 'rgba(146,64,14,0.35)', goldFaint: 'rgba(146,64,14,0.12)', panelBorder: 'rgba(146,64,14,0.35)' },
  // ثانوي intentionally has no entry -- falls through to DEFAULT_ACCENT.
  'جامعة': { gold: '#475569', goldSoft: 'rgba(71,85,105,0.35)', goldFaint: 'rgba(71,85,105,0.14)', panelBorder: 'rgba(71,85,105,0.35)' },
  'كبار': { gold: '#57534e', goldSoft: 'rgba(87,83,78,0.35)', goldFaint: 'rgba(87,83,78,0.14)', panelBorder: 'rgba(87,83,78,0.35)' },
};
// إعدادي/ثانوي are grouped by stage (ignore which of the 3 grades); every
// other stage has exactly one grade per student anyway, so keying by grade
// name works for all of them, including future grades this map hasn't seen.
function gradeColorKey(student) {
  if (student?.stageName === 'إعدادي' || student?.stageName === 'ثانوي') return student.stageName;
  return student?.gradeName || student?.stageName;
}

export default function StudentIdCard({ student, className = '', theme = 'dark' }) {
  const qrRef = useRef(null);
  const p = { ...WHITE, ...DEFAULT_ACCENT, ...GRADE_ACCENTS[gradeColorKey(student)] };

  useEffect(() => {
    const canvas = qrRef.current;
    if (canvas && student?.qrToken) {
      // toCanvas sets canvas.style.width/height to a literal "160px" as part
      // of drawing — it stomps the 100% CSS this canvas needs to fill its
      // (much smaller, mm-sized) box. Left alone, only the QR's top-left
      // finder-pattern corner stays visible inside the clipped container,
      // reading as a garbled/broken code. Reset the inline style right after.
      QRCode.toCanvas(canvas, student.qrToken, { width: 160, margin: 0 }, () => {
        canvas.style.width = '100%';
        canvas.style.height = '100%';
      });
    }
  }, [student?.qrToken]);

  if (!student) return null;

  const photoUrl = toAbsUrl(student.profilePictureUrl);
  const name = student.fullName || [student.firstName, student.secondName, student.thirdName, student.lastName].filter(Boolean).join(' ');
  const initials = (name || 'ط').trim().charAt(0);

  return (
    <div
      dir="rtl"
      lang="ar"
      className={`student-id-card ${className}`}
      style={{
        position: 'relative',
        width: `${CARD_WIDTH_MM}mm`,
        height: `${CARD_HEIGHT_MM}mm`,
        minWidth: `${CARD_WIDTH_MM}mm`,
        minHeight: `${CARD_HEIGHT_MM}mm`,
        borderRadius: '3.18mm',
        overflow: 'hidden',
        background: `linear-gradient(155deg, ${p.bgFrom} 0%, ${p.bgTo} 60%, ${p.bgFrom} 100%)`,
        border: `0.28mm solid ${p.panelBorder}`,
        boxShadow: p.shadow,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        fontFamily: "'Cairo', 'Segoe UI', sans-serif",
      }}
    >
      {/* Decorative glows */}
      <div style={{ position: 'absolute', top: '-14mm', insetInlineStart: '-10mm', width: '34mm', height: '34mm', borderRadius: '50%', background: `radial-gradient(circle, ${p.goldFaint} 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-16mm', insetInlineEnd: '-12mm', width: '30mm', height: '30mm', borderRadius: '50%', background: `radial-gradient(circle, ${p.goldFaint} 0%, transparent 70%)`, pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '1.6mm', padding: '2mm 2.6mm 1.6mm', borderBottom: `0.2mm solid ${p.goldSoft}` }}>
        <img src="/church logo.png" alt="شعار الكنيسة" style={{ width: '7mm', height: '7mm', objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.3mm' }}>
          <div style={{ fontSize: '2.4mm', fontWeight: 700, color: p.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            كنيسة مارمرقس الرسول
          </div>
          <div style={{ fontSize: '2.9mm', fontWeight: 800, color: p.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.1px' }}>
            مدرسة بي ثيؤريموس للألحان والتسبحة
          </div>
        </div>
        <div style={{ width: '9mm', height: '9mm', borderRadius: '1.6mm', background: '#fff', border: `0.22mm solid ${p.goldSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', boxShadow: '0 0.3mm 0.6mm rgba(0,0,0,0.2)' }}>
          <img src="/school logo.png" alt="شعار المدرسة" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      {/* Body */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'stretch', gap: '2mm', padding: '2mm 2.6mm', minHeight: 0 }}>
        {/* Photo + code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.3mm', flexShrink: 0 }}>
          <div style={{ width: '15mm', height: '18mm', borderRadius: '2mm', border: `0.3mm solid ${p.goldSoft}`, background: p.panel, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 0.15mm rgba(255,255,255,0.06)' }}>
            {photoUrl ? (
              <img src={photoUrl} alt="صورة الطالب" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '5mm', fontWeight: 800, color: p.gold }}>{initials}</span>
            )}
          </div>
          <div style={{ fontSize: '1.9mm', fontWeight: 700, color: p.text, background: p.chipBg, border: `0.18mm solid ${p.goldSoft}`, borderRadius: '1mm', padding: '0.6mm 1.4mm', letterSpacing: '0.3px', whiteSpace: 'nowrap', direction: 'ltr' }}>
            {student.studentCode}
          </div>
        </div>

        {/* Name + meta grid */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.6mm' }}>
          <div style={{ fontSize: '3.4mm', fontWeight: 800, color: p.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }} title={name}>
            {name || '—'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '2.2mm', rowGap: '1.6mm' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3mm', minWidth: 0 }}>
              <span style={{ fontSize: '2mm', fontWeight: 600, color: p.subtext }}>المرحلة</span>
              <span style={{ fontSize: '2.6mm', fontWeight: 700, color: p.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.stageName || '—'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3mm', minWidth: 0 }}>
              <span style={{ fontSize: '2mm', fontWeight: 600, color: p.subtext }}>الصف</span>
              <span style={{ fontSize: '2.6mm', fontWeight: 700, color: p.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.gradeName || '—'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3mm', minWidth: 0 }}>
              <span style={{ fontSize: '2mm', fontWeight: 600, color: p.subtext }}>الفصل</span>
              <span style={{ fontSize: '2.6mm', fontWeight: 700, color: p.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.className || '—'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3mm', minWidth: 0 }}>
              <span style={{ fontSize: '2mm', fontWeight: 600, color: p.subtext }}>المستوى</span>
              <span style={{ fontSize: '2.6mm', fontWeight: 700, color: p.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{levelLabel(student.level) || '—'}</span>
            </div>
          </div>
        </div>

        {/* QR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: '15mm', height: '15mm', background: '#ffffff', borderRadius: '1.4mm', border: `0.3mm solid ${p.goldSoft}`, padding: '1.1mm', boxSizing: 'border-box', boxShadow: '0 0.4mm 1mm rgba(0,0,0,0.15)' }}>
            <canvas ref={qrRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
        </div>
      </div>

      {/* Footer rule */}
      <div style={{ height: '1.4mm', background: `linear-gradient(90deg, transparent, ${p.gold}, transparent)`, opacity: 0.6 }} />
    </div>
  );
}
