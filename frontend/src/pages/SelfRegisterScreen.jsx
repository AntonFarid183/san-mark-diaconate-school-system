import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import SchoolLogo from '../components/SchoolLogo';
import ThemeToggle from '../components/ThemeToggle';
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
  { id: STAGE_IDS.childhood,   label: 'طفولة',   sublabel: '(KG1 و KG2)', hasGrade: true,  fetchGrades: false,
    localGrades: [{ id: '00000000-0000-0000-0000-000000000011', name: 'KG1' }, { id: '00000000-0000-0000-0000-000000000012', name: 'KG2' }] },
  { id: STAGE_IDS.primary,     label: 'ابتدائي',  hasGrade: true,  fetchGrades: true },
  { id: STAGE_IDS.preparatory, label: 'إعدادي',   hasGrade: true,  fetchGrades: true },
  { id: STAGE_IDS.secondary,   label: 'ثانوي',    hasGrade: true,  fetchGrades: true },
  { id: STAGE_IDS.university,  label: 'جامعة',    sublabel: '/ معهد', hasGrade: true, fetchGrades: false, hidePicker: true, hasCollege: true,
    localGrades: [{ id: '00000000-0000-0000-0004-000000000011', name: 'جامعة' }] },
  { id: STAGE_IDS.graduates,   label: 'خريجون',   hasGrade: true,  fetchGrades: false, hidePicker: true,
    localGrades: [{ id: '00000000-0000-0000-0005-000000000011', name: 'خريجون' }] },
  { id: STAGE_IDS.adults,      label: 'كبار',     hasGrade: true,  fetchGrades: false, hidePicker: true,
    localGrades: [{ id: '00000000-0000-0000-0006-000000000011', name: 'كبار' }] },
];

export default function SelfRegisterScreen() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    gender: 1, dateOfBirth: '',
    stage: STAGE_IDS.primary,
    gradeId: '',
    college: '',
    isDeacon: false, deaconRank: null, fatherOfConfession: '',
    studentMobile: '', fatherMobile: '', motherMobile: '', whatsAppNumber: '', landline: '',
    address: '', landmark: '', hasPaidFees: false,
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
    const stageId = formData.stage;
    const stage = STAGES.find(s => s.id === stageId) || STAGES[1];
    setFormData(prev => ({ ...prev, gradeId: '', college: '' }));
    setGrades([]);
    if (!stage.hasGrade) return;
    if (!stage.fetchGrades) {
      setGrades(stage.localGrades);
      setFormData(prev => ({ ...prev, gradeId: stage.localGrades[0]?.id || '' }));
      return;
    }
    const controller = new AbortController();
    const fetchGrades = async () => {
      setIsGradesLoading(true);
      try {
        const response = await apiClient.get(`/students/grades/${stageId}`, { signal: controller.signal });
        setGrades(response.data);
        if (response.data.length > 0)
          setFormData(prev => ({ ...prev, gradeId: response.data[0].id }));
      } catch (err) {
        if (!controller.signal.aborted) setGrades([]);
      } finally {
        if (!controller.signal.aborted) setIsGradesLoading(false);
      }
    };
    fetchGrades();
    return () => controller.abort();
  }, [formData.stage]); // eslint-disable-line react-hooks/exhaustive-deps

  // No account/token exists yet at this point in the flow, so this goes
  // through the dedicated anonymous endpoint (image-only, size-capped, saves
  // to the same /profiles category the authenticated one uses).
  const uploadPhoto = async (blob) => {
    const form = new FormData();
    form.append('file', blob, 'profile.jpg');
    const res = await apiClient.post('/file/upload-registration-photo', form, { headers: { 'Content-Type': undefined } });
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
      const payload = {
        ...formData,
        firstName:  parts[0] || '',
        secondName: parts[1] || '',
        thirdName:  parts[2] || '',
        lastName:   parts[3] || '',
        gradeId: currentStage.hasGrade ? formData.gradeId : null,
        selfRegistered: true,
      };
      const response = await apiClient.post('/students/register', payload);
      setCredentials({ userName: response.data.userName, temporaryPassword: response.data.temporaryPassword });
    } catch (err) {
      let errorMsg = 'حدث خطأ. تأكد من أن بياناتك صحيحة.';
      if (err.response?.data?.Message) errorMsg = err.response.data.Message;
      else if (!err.response) errorMsg = 'لا يمكن الاتصال بالخادم. حاول مرة أخرى لاحقاً.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- SUCCESS VIEW ---
  if (credentials) {
    return (
      <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: '2rem' }}>
        <div className="auth-theme-toggle"><ThemeToggle size={36} /></div>
        <div className="glass-card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '56px', color: 'var(--success)', marginBottom: '1rem', display: 'block' }}>check_circle</span>
          <h1 style={{ color: 'var(--success)', marginBottom: '0.5rem', fontSize: '1.3rem' }}>تم التسجيل بنجاح!</h1>
          <p style={{ marginBottom: '1.5rem' }}>احتفظ ببيانات الدخول الخاصة بك</p>

          <div style={{ padding: '1.5rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-gold)', marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>اسم المستخدم</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-gold)', letterSpacing: '2px' }}>{credentials.userName}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>كلمة المرور المؤقتة</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-gold)', letterSpacing: '2px' }}>{credentials.temporaryPassword}</div>
            </div>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            ستُطلب منك تغيير كلمة المرور عند أول تسجيل دخول
          </p>

          <button onClick={() => navigate('/login')} className="btn-primary">
            تسجيل الدخول الآن
          </button>
        </div>
      </div>
    );
  }

  // --- FORM VIEW ---
  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div className="auth-theme-toggle"><ThemeToggle size={36} /></div>
      <div style={{ maxWidth: '700px', width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <SchoolLogo size={84} className="auth-logo" />
          <h1 style={{ color: 'var(--accent-gold)', fontSize: '1.15rem', lineHeight: 1.4, marginBottom: '0.25rem' }}>مدرسة بي ثيؤريموس للألحان والتسبحة</h1>
          <p style={{ fontSize: '0.8rem' }}>كنيسة العذراء القديسة مريم والقديس مارمرقس - النزهة 2</p>
          <h2 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.75rem', fontWeight: 600 }}>تسجيل عضو جديد</h2>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {formSections.map((section, i) => (
            <div key={section.key} onClick={() => setCurrentStep(i)} style={{
              flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
              background: i === currentStep ? 'var(--gold-tint)' : 'var(--glass-bg)',
              border: i === currentStep ? '1px solid var(--accent-gold)' : '1px solid var(--glass-border)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', display: 'block', marginBottom: '0.2rem', color: i === currentStep ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>
                {i < currentStep ? 'check_circle' : section.icon}
              </span>
              <div style={{ fontSize: '0.7rem', color: i === currentStep ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>{section.title}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            {error && <div className="error-box" style={{ marginBottom: '1.5rem' }}>{error}</div>}

            {/* Step 1 */}
            {currentStep === 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--accent-gold)' }}>person</span>
                  <h2 style={{ color: 'var(--accent-gold)', fontSize: '1.1rem' }}>البيانات الأساسية</h2>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>تاريخ الميلاد</label>
                    <input type="date" name="dateOfBirth" className="premium-input" required onChange={handleChange} value={formData.dateOfBirth} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>النوع</label>
                    <div style={{ display: 'flex', gap: '1.5rem', padding: '0.75rem 0' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="radio" name="gender" value={1} checked={formData.gender === 1} onChange={handleChange} style={{ accentColor: 'var(--accent-gold)' }} /> ذكر
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="radio" name="gender" value={2} checked={formData.gender === 2} onChange={handleChange} style={{ accentColor: 'var(--accent-gold)' }} /> أنثى
                      </label>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>المرحلة الدراسية</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {STAGES.map(s => (
                      <button key={s.id} type="button" onClick={() => setFormData(prev => ({ ...prev, stage: s.id }))}
                        style={{
                          padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', transition: 'all 0.2s',
                          background: formData.stage === s.id ? 'rgba(251,191,36,0.12)' : 'var(--track-inset)',
                          border: formData.stage === s.id ? '1px solid var(--accent-gold)' : '1px solid var(--divider-strong)',
                          color: formData.stage === s.id ? 'var(--accent-gold)' : 'var(--text-secondary)',
                          fontWeight: formData.stage === s.id ? 700 : 400,
                        }}>
                        {s.label}{s.sublabel && <span style={{ marginRight: '0.2rem' }}>{s.sublabel}</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {currentStage.hasGrade && !currentStage.hidePicker && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>السنة الدراسية</label>
                    <select name="gradeId" className="premium-input" value={formData.gradeId} onChange={handleChange} required disabled={isGradesLoading}>
                      {isGradesLoading ? (
                        <option>جاري التحميل...</option>
                      ) : grades.length > 0 ? (
                        grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)
                      ) : (
                        <option value="">اختر السنة الدراسية</option>
                      )}
                    </select>
                  </div>
                )}

                {/* College / institute — shown for جامعة (appears after choosing the stage) */}
                {currentStage.hasCollege && (
                  <div style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>الكلية أو المعهد</label>
                    <input type="text" name="college" className="premium-input" placeholder="مثال: كلية الهندسة..." onChange={handleChange} value={formData.college} />
                  </div>
                )}
              </div>
            )}

            {/* Step 2 */}
            {currentStep === 1 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--accent-gold)' }}>church</span>
                  <h2 style={{ color: 'var(--accent-gold)', fontSize: '1.1rem' }}>البيانات الكنسية</h2>
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

            {/* Step 3 */}
            {currentStep === 2 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--accent-gold)' }}>contact_phone</span>
                  <h2 style={{ color: 'var(--accent-gold)', fontSize: '1.1rem' }}>بيانات التواصل والعنوان</h2>
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
                    <input type="tel" name="whatsAppNumber" className="premium-input" placeholder="اختياري" onChange={handleChange} value={formData.whatsAppNumber} />
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>أقرب علامة مميزة (اختياري)</label>
                  <input type="text" name="landmark" className="premium-input" onChange={handleChange} value={formData.landmark} />
                </div>
              </div>
            )}

            {/* Navigation */}
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
                  <button type="submit" className="btn-primary" disabled={isLoading} style={{ width: 'auto', padding: '0.75rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isLoading ? 'جاري التسجيل...' : 'إرسال طلب التسجيل'}
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit' }}>
            لديك حساب بالفعل؟ <span style={{ color: 'var(--accent-gold)' }}>تسجيل الدخول</span>
          </button>
        </div>
      </div>
    </div>
  );
}
