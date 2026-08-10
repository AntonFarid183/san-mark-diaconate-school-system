import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { BACKEND_URL as BACKEND } from '../config';

const toAbsUrl = (url) => (!url ? null : url.startsWith('http') ? url : `${BACKEND}${url}`);

// ── StudentIdCard ─────────────────────────────────────────────────────────
// FUNCTIONAL PLACEHOLDER ONLY — no visual design work has gone into this.
// It exists to prove the data/QR/print pipeline end to end. The final
// Figma design replaces the markup below; the props stay the same, so
// nothing that renders <StudentIdCard student={student} /> needs to change
// when that happens.
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

export default function StudentIdCard({ student, className = '' }) {
  const qrRef = useRef(null);

  useEffect(() => {
    if (qrRef.current && student?.qrToken) {
      QRCode.toCanvas(qrRef.current, student.qrToken, { width: 96, margin: 0 }, () => {});
    }
  }, [student?.qrToken]);

  if (!student) return null;

  const photoUrl = toAbsUrl(student.profilePictureUrl);
  const name = student.fullName || [student.firstName, student.secondName, student.thirdName, student.lastName].filter(Boolean).join(' ');

  return (
    <div
      className={`student-id-card ${className}`}
      style={{
        width: `${CARD_WIDTH_MM}mm`,
        height: `${CARD_HEIGHT_MM}mm`,
        boxSizing: 'border-box',
        border: '1px solid #999',
        borderRadius: '3mm',
        padding: '3mm',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5mm',
        background: '#fff',
        color: '#111',
        fontFamily: 'inherit',
        overflow: 'hidden',
        direction: 'rtl',
      }}
    >
      <div style={{ fontSize: '2.6mm', fontWeight: 700, textAlign: 'center', borderBottom: '0.3mm solid #ccc', paddingBottom: '1mm' }}>
        مدرسة بي ثيؤريموس للألحان والتسبحة
      </div>

      <div style={{ flex: 1, display: 'flex', gap: '2mm', alignItems: 'center' }}>
        <div style={{ width: '16mm', height: '16mm', flexShrink: 0, borderRadius: '2mm', overflow: 'hidden', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.2mm solid #ccc' }}>
          {photoUrl ? (
            <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '2mm', color: '#999' }}>لا توجد صورة</span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.5mm' }}>
          <div style={{ fontSize: '2.8mm', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={name}>
            {name || '—'}
          </div>
          <div style={{ fontSize: '2.1mm', color: '#333' }}>{student.stageName || '—'}</div>
          <div style={{ fontSize: '2.1mm', color: '#333' }}>{student.gradeName || '—'}</div>
          {student.className && <div style={{ fontSize: '2.1mm', color: '#333' }}>فصل {student.className}</div>}
          {levelLabel(student.level) && <div style={{ fontSize: '2.1mm', color: '#333' }}>{levelLabel(student.level)}</div>}
        </div>

        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5mm' }}>
          <canvas ref={qrRef} style={{ width: '16mm', height: '16mm' }} />
          <div style={{ fontSize: '1.8mm', color: '#333', direction: 'ltr' }}>{student.studentCode}</div>
        </div>
      </div>
    </div>
  );
}
