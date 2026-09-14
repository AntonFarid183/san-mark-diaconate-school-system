import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import { toAbsoluteBackendUrl } from '../config';
import { usePageTitle } from '../context/PageTitleContext';
import PhotoCaptureField from '../components/PhotoCaptureField';
import { STAGES, GENDER_OPTIONS, DEACON_RANK_OPTIONS, genderValue, deaconRankValue } from '../constants/stages';

// Every field the admin fills in at registration is editable here, matching
// RegisterStudentScreen section for section. The one exception is the fee
// status: it isn't a plain field, it's a ledger entry (charge + payment +
// discount rows), so it's managed from the student's payments section rather
// than being toggled behind the ledger's back.
const CONTACT_FIELDS = [
  ['موبايل الطالب', 'studentMobile'],
  ['موبايل الأب', 'fatherMobile'],
  ['موبايل الأم', 'motherMobile'],
  ['واتساب', 'whatsAppNumber'],
  ['تليفون أرضي', 'landline'],
  ['العنوان', 'address'],
  ['أقرب علامة مميزة', 'landmark'],
];

const CHURCH_FIELDS = [
  ['أب الاعتراف', 'fatherOfConfession'],
];

// Free-text inputs only -- the name (one field, split on save) and the
// pickers below (gender/date/stage/grade/deacon) each have their own control
// and their own entry in `form`.
const TEXT_KEYS = [...CONTACT_FIELDS, ...CHURCH_FIELDS].map(([, key]) => key);

// One "الاسم الرباعي" box like the registration form, rather than four
// separate inputs -- the API still stores the parts separately, so the split
// happens on save (and the join on load), exactly how registration does it.
const splitName = (fullName) => {
  const parts = fullName.trim().split(/\s+/);
  return { firstName: parts[0] || '', secondName: parts[1] || '', thirdName: parts[2] || '', lastName: parts[3] || '' };
};

const emptyForm = () => ({
  ...Object.fromEntries(TEXT_KEYS.map(key => [key, ''])),
  fullName: '',
  gender: 1,
  dateOfBirth: '',
  stage: '',
  gradeId: '',
  isDeacon: false,
  deaconRank: null,
});

const labelStyle = { fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' };

const resetPasswordButtonStyle = {
  background: 'rgba(251,191,36,0.1)',
  border: '1px solid var(--accent-gold)',
  color: 'var(--accent-gold)',
  borderRadius: '8px',
  padding: '0.6rem 1rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
};

const EditStudentScreen = () => {
  usePageTitle('تعديل بيانات الطالب');
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [grades, setGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  // The stage/grade effect below resets gradeId whenever the stage changes,
  // which would wipe the student's saved grade the moment their data lands.
  // This carries it across that first run, then clears itself so a real stage
  // change by the admin still resets the picker.
  const [pendingGradeId, setPendingGradeId] = useState(null);

  const currentStage = STAGES.find(s => s.id === form.stage) || null;

  useEffect(() => {
    const loadStudent = async () => {
      try {
        const { data } = await apiClient.get(`/students/${id}`);
        setStudent(data);
        setPhotoUrl(data.profilePictureUrl || null);
        setPendingGradeId(data.gradeId || null);
        setForm({
          ...Object.fromEntries(TEXT_KEYS.map(key => [key, data[key] || ''])),
          // Joined from the parts rather than using data.fullName: that one is
          // a computed "first second third last" with the blanks left in, so a
          // student missing a middle part comes back with double spaces.
          fullName: [data.firstName, data.secondName, data.thirdName, data.lastName].filter(Boolean).join(' '),
          gender: genderValue(data.gender) ?? 1,
          // DateOnly serializes as "YYYY-MM-DD", which is exactly what <input type="date"> wants.
          dateOfBirth: data.dateOfBirth || '',
          stage: data.stageId || '',
          gradeId: data.gradeId || '',
          isDeacon: !!data.isDeacon,
          deaconRank: deaconRankValue(data.deaconRank),
        });
      } catch (e) {
        setMsg({ type: 'error', text: e.response?.data?.message || 'تعذر تحميل بيانات الطالب.' });
      } finally {
        setLoading(false);
      }
    };
    loadStudent();
  }, [id]);

  // Stage -> grade options, same rules as the registration form: some stages
  // have their year list in the database, others carry a fixed pseudo-grade.
  useEffect(() => {
    if (!form.stage) return;
    const stage = STAGES.find(s => s.id === form.stage);
    if (!stage) { setGrades([]); return; }

    const applyGrades = (list) => {
      setGrades(list);
      setForm(prev => {
        const keep = pendingGradeId && list.some(g => g.id === pendingGradeId) ? pendingGradeId : null;
        return { ...prev, gradeId: keep || list[0]?.id || '' };
      });
      setPendingGradeId(null);
    };

    if (!stage.fetchGrades) { applyGrades(stage.localGrades || []); return; }

    let cancelled = false;
    setGradesLoading(true);
    apiClient.get(`/students/grades/${form.stage}`)
      .then(res => { if (!cancelled) applyGrades(res.data); })
      .catch(() => { if (!cancelled) { setGrades([]); setMsg({ type: 'error', text: 'تعذر تحميل السنوات الدراسية لهذه المرحلة.' }); } })
      .finally(() => { if (!cancelled) setGradesLoading(false); });
    return () => { cancelled = true; };
  }, [form.stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    // The name parts build FullName everywhere else in the app, and the API only skips a
    // field when it is null — an empty string is a real value and overwrites the stored name.
    // Without this the admin can blank a student out of every roster and search result.
    if (!form.fullName.trim()) {
      setMsg({ type: 'error', text: 'يجب إدخال اسم الطالب.' });
      return;
    }
    if (!form.gradeId) {
      setMsg({ type: 'error', text: 'يجب اختيار الصف الدراسي.' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...Object.fromEntries(TEXT_KEYS.map(key => [key, form[key].trim()])),
        ...splitName(form.fullName),
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || null,
        gradeId: form.gradeId,
        isDeacon: form.isDeacon,
        // Sent as null when he isn't a deacon so the backend clears any rank
        // left over from before the checkbox was unticked.
        deaconRank: form.isDeacon ? form.deaconRank : null,
      };
      await apiClient.put(`/students/${id}`, payload);
      setMsg({ type: 'success', text: 'تم حفظ التعديلات.' });
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل الحفظ.' });
    } finally { setSaving(false); }
  };

  // Same authenticated upload endpoint the other photo screens use; PhotoCaptureField owns
  // the camera and crop steps and hands back the cropped Blob.
  const uploadPhoto = async (blob) => {
    const body = new FormData();
    body.append('file', blob, 'profile.jpg');
    const res = await apiClient.post('/file/upload?category=profiles', body, { headers: { 'Content-Type': undefined } });
    return res.data.url || res.data.Url;
  };

  // Persisted on its own rather than waiting for the save button: the admin already confirmed
  // the crop, so the picture is a finished action. UpdateStudentDto ignores null fields, so
  // sending only this one leaves every other field untouched.
  // Handles its own errors rather than throwing: PhotoCaptureField calls onUploaded without
  // awaiting it, so a rejection here would escape its try/catch as an unhandled rejection.
  const persistPhoto = async (url) => {
    try {
      await apiClient.put(`/students/${id}`, { profilePictureUrl: url });
      setPhotoUrl(url);
      setMsg({ type: 'success', text: 'تم تحديث الصورة الشخصية.' });
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'تم رفع الصورة لكن فشل حفظها على الطالب.' });
    }
  };

  // For "I forgot to give the student their login at registration" -- generates a
  // fresh one instead of making the admin think one up. Shown once; it isn't stored
  // anywhere retrievable after this, so the admin needs to copy/write it down now.
  const regeneratePassword = async () => {
    try {
      const res = await apiClient.post(`/students/${id}/regenerate-password`);
      setGeneratedPassword(res.data.newPassword);
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل توليد كلمة مرور جديدة.' });
    }
  };

  const resetPassword = async () => {
    if (newPassword.length < 8) { setMsg({ type: 'error', text: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' }); return; }
    try {
      await apiClient.post(`/students/${id}/reset-password`, { newPassword });
      setMsg({ type: 'success', text: 'تم إعادة تعيين كلمة المرور.' });
      setShowReset(false);
      setNewPassword('');
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل إعادة التعيين.' });
    }
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>;

  const renderField = ([label, key]) => (
    <div key={key}>
      <label style={labelStyle}>{label}</label>
      <input className="premium-input" type="text" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

  return (
    <>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button className="btn-secondary" style={{ width: 'auto', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={() => navigate(`/students/${id}`)}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          رجوع
        </button>
      </div>

      {msg && (
        <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: 'var(--radius-sm)', background: msg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          {msg.text}
          <span style={{ cursor: 'pointer' }} onClick={() => setMsg(null)}>✕</span>
        </div>
      )}

      <div className="edit-student-layout">
        <div className="glass-card" style={{ padding: 'clamp(1.25rem, 3vw, 2rem)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
            <PhotoCaptureField photoUrl={toAbsoluteBackendUrl(photoUrl)} uploadFn={uploadPhoto} onUploaded={persistPhoto} size={96} />
            <div style={{ flex: '1 1 200px' }}>
              <h3 style={{ color: 'var(--accent-gold)' }}>الصورة الشخصية</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                اضغط على أيقونة الكاميرا لالتقاط صورة أو اختيارها من الجهاز — تُحفظ فور تأكيد القص.
              </p>
            </div>
          </div>

          <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>البيانات الشخصية</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle}>الاسم الرباعي</label>
            <input className="premium-input" type="text" placeholder="مثال: مارك أنطون جرجس يوسف"
              value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>تاريخ الميلاد</label>
              <input className="premium-input" type="date" value={form.dateOfBirth}
                onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>النوع</label>
              <div style={{ display: 'flex', gap: '1.5rem', padding: '0.75rem 0' }}>
                {GENDER_OPTIONS.map(opt => (
                  <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem' }}>
                    <input type="radio" name="gender" value={opt.value} checked={form.gender === opt.value}
                      onChange={() => setForm({ ...form, gender: opt.value })} style={{ accentColor: 'var(--accent-gold)' }} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <h3 style={{ color: 'var(--accent-gold)', margin: '1.5rem 0 1rem' }}>المرحلة والصف</h3>
          <div>
            <label style={labelStyle}>المرحلة الدراسية</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {STAGES.map(s => (
                <button key={s.id} type="button" onClick={() => setForm({ ...form, stage: s.id })}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem', transition: 'all 0.2s',
                    background: form.stage === s.id ? 'rgba(251,191,36,0.12)' : 'var(--track-inset)',
                    border: form.stage === s.id ? '1px solid var(--accent-gold)' : '1px solid var(--divider-strong)',
                    color: form.stage === s.id ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    fontWeight: form.stage === s.id ? 700 : 400,
                  }}>
                  {s.label}{s.sublabel && <span style={{ marginRight: '0.25rem' }}>{s.sublabel}</span>}
                </button>
              ))}
            </div>
          </div>
          {currentStage && !currentStage.hidePicker && (
            <div style={{ marginTop: '1rem' }}>
              <label style={labelStyle}>السنة الدراسية (الترم)</label>
              <select className="premium-input" value={form.gradeId} disabled={gradesLoading}
                onChange={e => setForm({ ...form, gradeId: e.target.value })}>
                {gradesLoading ? (
                  <option>جاري التحميل...</option>
                ) : grades.length > 0 ? (
                  grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)
                ) : (
                  <option value="">لا يوجد بيانات</option>
                )}
              </select>
            </div>
          )}

          <h3 style={{ color: 'var(--accent-gold)', margin: '1.5rem 0 1rem' }}>البيانات الكنسية</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '1rem' }}>
            {CHURCH_FIELDS.map(renderField)}
            <div>
              <label style={labelStyle}>الرتبة الشماسية (إن وجد)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <input type="checkbox" checked={form.isDeacon}
                  onChange={e => setForm({ ...form, isDeacon: e.target.checked, deaconRank: e.target.checked ? form.deaconRank : null })}
                  style={{ accentColor: 'var(--accent-gold)', width: '18px', height: '18px' }} />
                <label style={{ fontSize: '0.9rem' }}>شماس؟</label>
              </div>
              {form.isDeacon && (
                <select className="premium-input" value={form.deaconRank || ''}
                  onChange={e => setForm({ ...form, deaconRank: e.target.value ? parseInt(e.target.value, 10) : null })}>
                  <option value="">اختر الرتبة</option>
                  {DEACON_RANK_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              )}
            </div>
          </div>

          <h3 style={{ color: 'var(--accent-gold)', margin: '1.5rem 0 1rem' }}>معلومات التواصل</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: '1rem' }}>
            {CONTACT_FIELDS.map(renderField)}
          </div>

          <button className="btn-primary" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            onClick={save} disabled={saving}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>save</span>
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }}>إجراءات الحساب</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={() => setShowReset(true)} style={resetPasswordButtonStyle}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock_reset</span>
                إعادة تعيين كلمة المرور
              </button>
              <button onClick={regeneratePassword} style={resetPasswordButtonStyle}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>autorenew</span>
                توليد كلمة مرور جديدة (نسيت إعطاء الطالب بياناته)
              </button>
            </div>
          </div>

          {student && (
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>كود الطالب</div>
              <div style={{ fontWeight: 600, direction: 'ltr', textAlign: 'right', marginTop: '0.25rem' }}>{student.studentCode}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>الحالة</div>
              <span style={{ display: 'inline-block', marginTop: '0.25rem', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem', background: student.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: student.isActive ? 'var(--success)' : 'var(--danger)' }}>
                {student.isActive ? 'فعّال' : 'موقوف'}
              </span>
            </div>
          )}
        </div>
      </div>

      {showReset && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '400px', direction: 'rtl' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>إعادة تعيين كلمة المرور</h3>
            <input className="premium-input" type="password" placeholder="كلمة المرور الجديدة (8 أحرف على الأقل)" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={resetPassword} disabled={newPassword.length < 8}>تعيين</button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowReset(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {generatedPassword && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div className="glass-card" style={{ padding: '2rem', width: '100%', maxWidth: '400px', direction: 'rtl', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>كلمة المرور الجديدة</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              انسخها الآن أو اكتبها للطالب — لن تظهر مرة أخرى بعد إغلاق هذه النافذة.
            </p>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '0.15em', direction: 'ltr', padding: '0.9rem', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>
              {generatedPassword}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => {
                navigator.clipboard?.writeText(generatedPassword);
                setMsg({ type: 'success', text: 'تم نسخ كلمة المرور.' });
              }}>نسخ</button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setGeneratedPassword('')}>تم</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditStudentScreen;
