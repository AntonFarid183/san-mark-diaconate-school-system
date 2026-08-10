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

// Same hex values as the app's --bg-primary/--accent-gold tokens in each
// theme (see index.css) — kept as a literal palette rather than CSS vars
// since this card is meant to print/export standalone, independent of
// whatever theme the surrounding admin page happens to be in.
const PALETTE = {
  dark: {
    bgFrom: '#0f172a', bgTo: '#111c34', text: '#f1f5f9', subtext: '#93a1b8',
    gold: '#fbbf24', goldSoft: 'rgba(251,191,36,0.35)', goldFaint: 'rgba(251,191,36,0.14)',
    panel: 'rgba(255,255,255,0.04)', panelBorder: 'rgba(251,191,36,0.22)',
    shadow: '0 1.2mm 3mm rgba(0,0,0,0.45)', chipBg: 'rgba(255,255,255,0.06)',
  },
  light: {
    bgFrom: '#f1f4f9', bgTo: '#e7ecf5', text: '#152238', subtext: '#5b6b85',
    gold: '#8a5f05', goldSoft: 'rgba(138,95,5,0.35)', goldFaint: 'rgba(138,95,5,0.10)',
    panel: 'rgba(15,23,42,0.03)', panelBorder: 'rgba(138,95,5,0.28)',
    shadow: '0 1mm 2.4mm rgba(21,34,56,0.18)', chipBg: 'rgba(15,23,42,0.04)',
  },
};

export default function StudentIdCard({ student, className = '', theme = 'dark' }) {
  const qrRef = useRef(null);
  const p = theme === 'light' ? PALETTE.light : PALETTE.dark;

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
          <div style={{ fontSize: '2.1mm', fontWeight: 600, color: p.subtext, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            كنيسة مارمرقس الرسول
          </div>
          <div style={{ fontSize: '2.6mm', fontWeight: 800, color: p.gold, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.1px' }}>
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
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.8mm' }}>
          <div style={{ fontSize: '3.4mm', fontWeight: 800, color: p.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }} title={name}>
            {name || '—'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '2mm', rowGap: '1.3mm' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3mm', minWidth: 0 }}>
              <span style={{ fontSize: '1.7mm', fontWeight: 600, color: p.subtext }}>المرحلة</span>
              <span style={{ fontSize: '2.1mm', fontWeight: 700, color: p.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.stageName || '—'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3mm', minWidth: 0 }}>
              <span style={{ fontSize: '1.7mm', fontWeight: 600, color: p.subtext }}>الصف</span>
              <span style={{ fontSize: '2.1mm', fontWeight: 700, color: p.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.gradeName || '—'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3mm', minWidth: 0 }}>
              <span style={{ fontSize: '1.7mm', fontWeight: 600, color: p.subtext }}>الفصل</span>
              <span style={{ fontSize: '2.1mm', fontWeight: 700, color: p.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.className || '—'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3mm', minWidth: 0 }}>
              <span style={{ fontSize: '1.7mm', fontWeight: 600, color: p.subtext }}>المستوى</span>
              <span style={{ fontSize: '2.1mm', fontWeight: 700, color: p.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{levelLabel(student.level) || '—'}</span>
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
      <div style={{ height: '1.4mm', background: `linear-gradient(90deg, transparent, ${p.gold}, transparent)`, opacity: theme === 'dark' ? 0.5 : 0.6 }} />
    </div>
  );
}
