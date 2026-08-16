import { useState, useEffect } from 'react';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';
import PhotoCaptureField from '../components/PhotoCaptureField';
import { BACKEND_URL } from '../config';
const toAbsUrl = (url) => (!url ? null : url.startsWith('http') ? url : `${BACKEND_URL}${url}`);

const STAGE_IDS = {
  childhood:   '00000000-0000-0000-0000-000000000001',
  primary:     '00000000-0000-0000-0001-000000000001',
  preparatory: '00000000-0000-0000-0002-000000000001',
  secondary:   '00000000-0000-0000-0003-000000000001',
  university:  '00000000-0000-0000-0004-000000000001',
  graduates:   '00000000-0000-0000-0005-000000000001',
  adults:      '00000000-0000-0000-0006-000000000001',
};

const STAGES = [
  {
    id: STAGE_IDS.childhood, label: 'طفولة', sublabel: '(KG1 و KG2)',
    hasGrade: true, fetchGrades: false,
    localGrades: [{ id: '00000000-0000-0000-0000-000000000011', name: 'KG1' }, { id: '00000000-0000-0000-0000-000000000012', name: 'KG2' }],
  },
  { id: STAGE_IDS.primary,     label: 'ابتدائي',      hasGrade: true,  fetchGrades: true },
  { id: STAGE_IDS.preparatory, label: 'إعدادي',       hasGrade: true,  fetchGrades: true },
  { id: STAGE_IDS.secondary,   label: 'ثانوي',        hasGrade: true,  fetchGrades: true },
  {
    id: STAGE_IDS.university, label: 'جامعة', sublabel: '/ معهد',
    hasGrade: true, fetchGrades: false, hidePicker: true, hasCollege: true,
    localGrades: [{ id: '00000000-0000-0000-0004-000000000011', name: 'جامعة' }],
  },
  { id: STAGE_IDS.graduates, label: 'خريجون', hasGrade: true, fetchGrades: false, hidePicker: true,
    localGrades: [{ id: '00000000-0000-0000-0005-000000000011', name: 'خريجون' }] },
  { id: STAGE_IDS.adults,    label: 'كبار',    hasGrade: true, fetchGrades: false, hidePicker: true,
    localGrades: [{ id: '00000000-0000-0000-0006-000000000011', name: 'كبار' }] },
];

const RegisterStudentScreen = () => {
  usePageTitle('تسجيل طالب جديد');
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 1, dateOfBirth: '',
    stage: STAGE_IDS.primary,
    gradeId: '',
    college: '',
    isDeacon: false, deaconRank: null, fatherOfConfession: '',
    studentMobile: '', fatherMobile: '', motherMobile: '', whatsAppNumber: '', landline: '',
    address: '', landmark: '', hasPaidFees: false, paidAmount: '',
    profilePictureUrl: '',
  });

  const [grades, setGrades] = useState([]);
  const [isGradesLoading, setIsGradesLoading] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const formSections = [
    { key: 'basic',   icon: 'person',        title: 'البيانات الأساسية' },
    { key: 'church',  icon: 'church',        title: 'البيانات الكنسية' },
    { key: 'contact', icon: 'contact_phone', title: 'بيانات التواصل والعنوان' },
  ];

  const currentStage = STAGES.find(s => s.id === formData.stage) || STAGES[1];

  useEffect(() => {
    setFormData(prev => ({ ...prev, gradeId: '', college: '' }));
    setGrades([]);

    if (!currentStage.hasGrade) return;

    if (!currentStage.fetchGrades) {
      setGrades(currentStage.localGrades);
      setFormData(prev => ({ ...prev, gradeId: currentStage.localGrades[0]?.id || '' }));
      return;
    }

    const fetchGrades = async () => {
      setIsGradesLoading(true);
      try {
        const response = await apiClient.get(`/students/grades/${formData.stage}`);
        setGrades(response.data);
        if (response.data.length > 0)
          setFormData(prev => ({ ...prev, gradeId: response.data[0].id }));
      } catch {
        setGrades([]);
        setError('لم يتم العثور على سنوات دراسية لهذه المرحلة في قاعدة البيانات.');
      } finally {
        setIsGradesLoading(false);
      }
    };
    fetchGrades();
  }, [formData.stage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Admin is logged in, so this goes straight through the authenticated
  // upload endpoint — no separate anonymous path needed here (that's only
  // for self-registration, before any account/token exists).
  const uploadPhoto = async (blob) => {
    const form = new FormData();
    form.append('file', blob, 'profile.jpg');
    const res = await apiClient.post('/file/upload?category=profiles', form, { headers: { 'Content-Type': undefined } });
    return res.data.url || res.data.Url;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let parsedValue = type === 'checkbox' ? checked : value;
    if (name === 'gender' || name === 'deaconRank') parsedValue = value ? parseInt(value) : null;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const parts = formData.fullName.trim().split(/\s+/);
      const paidAmount = formData.hasPaidFees && formData.paidAmount ? parseFloat(formData.paidAmount) : null;
      const payload = {
        ...formData,
        firstName:  parts[0] || '',
        secondName: parts[1] || '',
        thirdName:  parts[2] || '',
        lastName:   parts[3] || '',
        gradeId: currentStage.hasGrade ? formData.gradeId : null,
        paidAmount: paidAmount && paidAmount > 0 ? paidAmount : null,
      };
      const response = await apiClient.post('/students/register', payload);
      setCredentials({ userName: response.data.userName, temporaryPassword: response.data.temporaryPassword });
    } catch (err) {
      let errorMsg = 'حدث خطأ. تأكد من أن الطالب غير مسجل مسبقاً.';
      // Backend serializes as camelCase ("message") by ASP.NET Core's default
      // -- .Message (capital) was silently always undefined, hiding the real
      // server error behind this generic fallback every single time.
      const serverMsg = err.response?.data?.message || err.response?.data?.Message;
      if (serverMsg) errorMsg = serverMsg;
      else if (err.response?.data?.errors) errorMsg = `خطأ في البيانات: ${Object.values(err.response.data.errors)[0]}`;
      else if (!err.response) errorMsg = 'لا يمكن الاتصال بالخادم. يرجى التأكد من تشغيل الـ Backend.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- SUCCESS VIEW ---
  if (credentials) {
    return (
      <div className="glass-card" style={{ maxWidth: '500px', margin: '2rem auto', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '56px', color: 'var(--success)', marginBottom: '1rem' }}>check_circle</span>
        <h1 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>تم التسجيل بنجاح!</h1>
        <p>تمت إضافة بيانات الطالب إلى قاعدة البيانات.</p>
        <div style={{ padding: '20px', background: 'var(--surface-2)', marginTop: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-gold)' }}>
          <h2 style={{ letterSpacing: '2px', marginBottom: '15px' }}>
            اسم المستخدم:<br /><span style={{ color: 'var(--accent-gold)' }}>{credentials.userName}</span>
          </h2>
          <h2 style={{ letterSpacing: '2px' }}>
            كلمة المرور:<br /><span style={{ color: 'var(--accent-gold)' }}>{credentials.temporaryPassword}</span>
          </h2>
        </div>
        <button onClick={() => window.location.reload()} className="btn-primary" style={{ marginTop: '30px', width: 'auto', padding: '0.75rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          تسجيل طالب آخر
        </button>
      </div>
    );
  }

  // --- REGISTRATION FORM VIEW ---
  return (
    <>
      <p style={{ marginBottom: '1.5rem', fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
        أدخل بيانات الطالب الجديد بدقة لضمان دمج البيانات في نظام المدرسة والسجلات الأكاديمية.
      </p>

      {/* Stepper */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {formSections.map((section, i) => (
          <div key={section.key} onClick={() => setCurrentStep(i)} style={{
            flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
            background: i === currentStep ? 'var(--gold-tint)' : 'var(--glass-bg)',
            border: i === currentStep ? '1px solid var(--accent-gold)' : '1px solid var(--glass-border)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', display: 'block', marginBottom: '0.25rem', color: i === currentStep ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>
              {i < currentStep ? 'check_circle' : section.icon}
            </span>
            <div style={{ fontSize: '0.75rem', color: i === currentStep ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>
              {section.title}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="glass-card" style={{ maxWidth: '900px', margin: '0 auto 2rem' }}>
          {error && <div className="error-box" style={{ marginBottom: '1.5rem' }}>{error}</div>}

          {/* Step 1: Basic Info */}
          {currentStep === 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--accent-gold)' }}>person</span>
                <h2 style={{ color: 'var(--accent-gold)', fontSize: '1.2rem' }}>البيانات الأساسية</h2>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <PhotoCaptureField
                  photoUrl={toAbsUrl(formData.profilePictureUrl)}
                  uploadFn={uploadPhoto}
                  onUploaded={url => setFormData(prev => ({ ...prev, profilePictureUrl: url }))}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>الاسم الرباعي</label>
                <input type="text" name="fullName" className="premium-input" placeholder="مثال: مارك أنطون جرجس يوسف" required onChange={handleChange} value={formData.fullName} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>تاريخ الميلاد</label>
                  <input type="date" name="dateOfBirth" className="premium-input" required onChange={handleChange} value={formData.dateOfBirth} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>النوع</label>
                  <div style={{ display: 'flex', gap: '1.5rem', padding: '0.75rem 0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem' }}>
                      <input type="radio" name="gender" value={1} checked={formData.gender === 1} onChange={handleChange} style={{ accentColor: 'var(--accent-gold)' }} /> ذكر
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem' }}>
                      <input type="radio" name="gender" value={2} checked={formData.gender === 2} onChange={handleChange} style={{ accentColor: 'var(--accent-gold)' }} /> أنثى
                    </label>
                  </div>
                </div>
              </div>

              {/* Stage selector */}
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>المرحلة الدراسية</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {STAGES.map(s => (
                    <button key={s.id} type="button" onClick={() => setFormData(prev => ({ ...prev, stage: s.id }))}
                      style={{
                        padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.88rem', transition: 'all 0.2s',
                        background: formData.stage === s.id ? 'rgba(251,191,36,0.12)' : 'var(--track-inset)',
                        border: formData.stage === s.id ? '1px solid var(--accent-gold)' : '1px solid var(--divider-strong)',
                        color: formData.stage === s.id ? 'var(--accent-gold)' : 'var(--text-secondary)',
                        fontWeight: formData.stage === s.id ? 700 : 400,
                      }}>
                      {s.label}{s.sublabel && <span style={{ marginRight: '0.25rem' }}>{s.sublabel}</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grade / year — shown only for stages that have a year picker */}
              {currentStage.hasGrade && !currentStage.hidePicker && (
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                    السنة الدراسية (الترم)
                  </label>
                  <select name="gradeId" className="premium-input" value={formData.gradeId} onChange={handleChange} required disabled={isGradesLoading}>
                    {isGradesLoading ? (
                      <option>جاري التحميل...</option>
                    ) : grades.length > 0 ? (
                      grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)
                    ) : (
                      <option value="">لا يوجد بيانات</option>
                    )}
                  </select>
                </div>
              )}

              {/* College / institute — shown for جامعة (appears after choosing the stage) */}
              {currentStage.hasCollege && (
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>الكلية أو المعهد</label>
                  <input type="text" name="college" className="premium-input" placeholder="مثال: كلية الهندسة، معهد الفنون..." onChange={handleChange} value={formData.college} />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Church Info */}
          {currentStep === 1 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--accent-gold)' }}>church</span>
                <h2 style={{ color: 'var(--accent-gold)', fontSize: '1.2rem' }}>البيانات الكنسية</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>أب الاعتراف</label>
                  <input type="text" name="fatherOfConfession" className="premium-input" required onChange={handleChange} value={formData.fatherOfConfession} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>الرتبة الشماسية (إن وجد)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <input type="checkbox" name="isDeacon" checked={formData.isDeacon} onChange={handleChange} style={{ accentColor: 'var(--accent-gold)', width: '18px', height: '18px' }} />
                    <label style={{ fontSize: '0.9rem' }}>شماس؟</label>
                  </div>
                  {formData.isDeacon && (
                    <select name="deaconRank" className="premium-input" required onChange={handleChange} value={formData.deaconRank || ''}>
                      <option value="">اختر الرتبة</option>
                      <option value={1}>إبصالتس (مرتل)</option>
                      <option value={2}>أغنسطس (قارئ)</option>
                      <option value={3}>إيبدياكون (مساعد شماس)</option>
                      <option value={4}>دياكون (شماس كامل)</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contact */}
          {currentStep === 2 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--accent-gold)' }}>contact_phone</span>
                <h2 style={{ color: 'var(--accent-gold)', fontSize: '1.2rem' }}>بيانات التواصل والعنوان</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>موبايل الطالب / العضو</label>
                  <input type="tel" name="studentMobile" className="premium-input" placeholder="اختياري" onChange={handleChange} value={formData.studentMobile} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>موبايل الأب</label>
                  <input type="tel" name="fatherMobile" className="premium-input" placeholder="اختياري" onChange={handleChange} value={formData.fatherMobile} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>موبايل الأم</label>
                  <input type="tel" name="motherMobile" className="premium-input" placeholder="اختياري" onChange={handleChange} value={formData.motherMobile} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>رقم الواتساب</label>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '18px', pointerEvents: 'none' }}>chat</span>
                    <input type="tel" name="whatsAppNumber" className="premium-input" placeholder="اختياري" onChange={handleChange} value={formData.whatsAppNumber} style={{ paddingRight: '40px' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>التليفون الأرضي</label>
                  <input type="tel" name="landline" className="premium-input" placeholder="اختياري" onChange={handleChange} value={formData.landline} />
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>العنوان بالتفصيل</label>
                <input type="text" name="address" className="premium-input" required onChange={handleChange} value={formData.address} />
              </div>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>أقرب علامة مميزة</label>
                <input type="text" name="landmark" className="premium-input" onChange={handleChange} placeholder="اختياري" value={formData.landmark} />
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input type="checkbox" name="hasPaidFees" checked={formData.hasPaidFees} onChange={handleChange} style={{ accentColor: 'var(--accent-gold)', width: '18px', height: '18px' }} />
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>تم سداد المصاريف الإدارية للترم الحالي</label>
              </div>
              {formData.hasPaidFees && (
                <div style={{ marginTop: '0.75rem', marginRight: '2rem' }}>
                  <div style={{ position: 'relative', maxWidth: '250px' }}>
                    <input type="number" name="paidAmount" className="premium-input" placeholder="المبلغ المدفوع" step="0.01" min="0"
                      onChange={handleChange} value={formData.paidAmount} style={{ textAlign: 'center', fontWeight: 700, padding: '0.65rem 1rem' }} />
                    <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>ج.م</span>
                  </div>
                </div>
              )}
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginRight: '2rem' }}>تأكد من استلام الوصل قبل التحديد</p>
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
            <div>
              {currentStep > 0 && (
                <button type="button" onClick={() => setCurrentStep(s => s - 1)} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                  السابق
                </button>
              )}
            </div>
            <div>
              {currentStep < formSections.length - 1 ? (
                <button type="button" onClick={() => setCurrentStep(s => s + 1)} className="btn-primary" style={{ width: 'auto', padding: '0.75rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  التالي
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
                </button>
              ) : (
                <button type="submit" className="btn-primary" disabled={isLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '0.75rem 2rem' }}>
                  {isLoading ? 'جاري إنشاء الحساب...' : 'تسجيل الطالب'}
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', padding: '0.75rem', background: 'rgba(251,191,36,0.05)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--accent-gold)' }}>info</span>
            بمجرد الحفظ، سيتم إنشاء ملف أكاديمي للطالب فوراً.
          </div>
        </div>
      </form>
    </>
  );
};

export default RegisterStudentScreen;
