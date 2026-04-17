import { useState, useEffect } from 'react';
import apiClient from '../apiClient';

const RegisterStudentScreen = () => {
    const [formData, setFormData] = useState({
        firstName: '', secondName: '', thirdName: '', lastName: '',
        gender: 1, dateOfBirth: '', 
        stage: 2, // Used for UI filtering
        gradeId: '', // The actual Guid to be saved
        isDeacon: false, deaconRank: null, fatherOfConfession: '',
        fatherMobile: '', motherMobile: '', whatsAppNumber: '', landline: '',
        address: '', landmark: '', hasPaidFees: false
    });

    const [grades, setGrades] = useState([]); // List of grades fetched from API
    const [isGradesLoading, setIsGradesLoading] = useState(false);
    const [credentials, setCredentials] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch grades automatically whenever the Stage dropdown changes
    useEffect(() => {
        const fetchGrades = async () => {
            setIsGradesLoading(true);
            try {
                const response = await apiClient.get(`/students/grades/${formData.stage}`);
                setGrades(response.data);
                
                // Reset the gradeId to the first item in the new list
                if (response.data.length > 0) {
                    setFormData(prev => ({ ...prev, gradeId: response.data[0].id }));
                }
            } catch (err) {
                console.error("Failed to fetch grades", err);
                setGrades([]); // Clear if error
                setError("لم يتم العثور على سنوات دراسية لهذه المرحلة في قاعدة البيانات.");
            } finally {
                setIsGradesLoading(false);
            }
        };

        fetchGrades();
    }, [formData.stage]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        let parsedValue = type === 'checkbox' ? checked : value;
        // Convert Enum selects to integers
        if (name === 'gender' || name === 'stage' || name === 'deaconRank') {
            parsedValue = value ? parseInt(value) : null;
        }

        setFormData(prev => ({
            ...prev,
            [name]: parsedValue
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await apiClient.post('/students/register', formData);
            setCredentials({
                userName: response.data.userName,
                temporaryPassword: response.data.temporaryPassword
            });
        } catch (err) {
            console.error("API Error Response:", err.response?.data || err);
            
            let errorMsg = 'حدث خطأ. تأكد من أن الطالب غير مسجل مسبقاً.';
            
            if (err.response?.data?.Message) {
                // Our custom backend message
                errorMsg = err.response.data.Message;
            } else if (err.response?.data?.errors) {
                // ASP.NET Core automatic validation form errors
                const firstError = Object.values(err.response.data.errors)[0];
                errorMsg = `خطأ في البيانات: ${firstError}`;
            } else if (!err.response) {
                // Network error
                errorMsg = 'لا يمكن الاتصال بالخادم. يرجى التأكد من تشغيل الـ Backend.';
            }

            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    // --- SUCCESS VIEW ---
    if (credentials) {
        return (
            <div className="glass-card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
                <h1 style={{ color: 'var(--success)' }}>تم التسجيل بنجاح! 🎉</h1>
                <p>يرجى إعطاء هذه البيانات للطالب للقدرة على تسجيل الدخول.</p>
                
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', marginTop: '20px', borderRadius: '10px', border: '1px solid var(--accent-gold)' }}>
                    <h2 style={{ letterSpacing: '2px', marginBottom: '10px' }}>
                        اسم المستخدم: <br/><span style={{ color: 'var(--accent-gold)' }}>{credentials.userName}</span>
                    </h2>
                    <h2 style={{ letterSpacing: '2px' }}>
                        كلمة المرور: <br/><span style={{ color: 'var(--accent-gold)' }}>{credentials.temporaryPassword}</span>
                    </h2>
                </div>
                
                <button onClick={() => window.location.reload()} className="btn-primary" style={{ marginTop: '30px' }}>
                    تسجيل طالب آخر
                </button>
            </div>
        );
    }

    // --- REGISTRATION FORM VIEW ---
    return (
        <div className="glass-card" style={{ maxWidth: '900px', width: '100%', margin: '2rem 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ color: 'var(--accent-gold)' }}>تسجيل طالب جديد</h1>
                <p>يرجى تعبئة كافة البيانات بدقة</p>
            </div>

            {error && <div style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid var(--danger)', marginBottom: '20px' }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* 1. Core Profile */}
                <fieldset style={{ border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '10px' }}>
                    <legend style={{ padding: '0 10px', color: 'var(--accent-gold)', fontWeight: 'bold' }}>البيانات الأساسية</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div><label>الاسم الأول</label><input type="text" name="firstName" className="premium-input" required onChange={handleChange} value={formData.firstName} /></div>
                        <div><label>الاسم الثاني</label><input type="text" name="secondName" className="premium-input" required onChange={handleChange} value={formData.secondName} /></div>
                        <div><label>الاسم الثالث</label><input type="text" name="thirdName" className="premium-input" required onChange={handleChange} value={formData.thirdName} /></div>
                        <div><label>الاسم الأخير</label><input type="text" name="lastName" className="premium-input" required onChange={handleChange} value={formData.lastName} /></div>
                        
                        <div>
                            <label>النوع</label>
                            <select name="gender" className="premium-input" value={formData.gender} onChange={handleChange}>
                                <option value={1}>ذكر</option>
                                <option value={2}>أنثى</option>
                            </select>
                        </div>
                        <div><label>تاريخ الميلاد</label><input type="date" name="dateOfBirth" className="premium-input" required onChange={handleChange} value={formData.dateOfBirth} /></div>
                        <div>
                            <label>المرحلة الدراسية</label>
                            <select name="stage" className="premium-input" value={formData.stage} onChange={handleChange}>
                                <option value={2}>ابتدائي</option>
                                <option value={3}>إعدادي</option>
                                <option value={4}>ثانوي</option>
                            </select>
                        </div>
                        <div>
                            <label>السنة الدراسية</label>
                            <select name="gradeId" className="premium-input" value={formData.gradeId} onChange={handleChange} required disabled={isGradesLoading}>
                                {isGradesLoading ? (
                                    <option>جاري التحميل...</option>
                                ) : grades.length > 0 ? (
                                    grades.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))
                                ) : (
                                    <option value="">لا يوجد بيانات</option>
                                )}
                            </select>
                        </div>
                    </div>
                </fieldset>

                {/* 2. Church Info */}
                <fieldset style={{ border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '10px' }}>
                    <legend style={{ padding: '0 10px', color: 'var(--accent-gold)', fontWeight: 'bold' }}>البيانات الكنسية</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div><label>أب الاعتراف</label><input type="text" name="fatherOfConfession" className="premium-input" required onChange={handleChange} value={formData.fatherOfConfession} /></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input type="checkbox" name="isDeacon" checked={formData.isDeacon} onChange={handleChange} style={{ width: '20px', height: '20px' }}/>
                            <label style={{ margin: 0 }}>شماس؟</label>
                        </div>
                        {formData.isDeacon && (
                            <div>
                                <label>رتبة الشماسية</label>
                                <select name="deaconRank" className="premium-input" required onChange={handleChange}>
                                    <option value="">اختر الرتبة</option>
                                    <option value={1}>إبصالتس (مرتل)</option>
                                    <option value={2}>أغنسطس (قارئ)</option>
                                    <option value={3}>إيبدياكون (مساعد شماس)</option>
                                    <option value={4}>دياكون (شماس كامل)</option>
                                </select>
                            </div>
                        )}
                    </div>
                </fieldset>

                {/* 3. Contact & Address */}
                <fieldset style={{ border: '1px solid var(--glass-border)', padding: '1.5rem', borderRadius: '10px' }}>
                    <legend style={{ padding: '0 10px', color: 'var(--accent-gold)', fontWeight: 'bold' }}>التواصل والأسرة</legend>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div><label>موبايل الأب</label><input type="tel" name="fatherMobile" className="premium-input" required onChange={handleChange} value={formData.fatherMobile} /></div>
                        <div><label>موبايل الأم</label><input type="tel" name="motherMobile" className="premium-input" required onChange={handleChange} value={formData.motherMobile} /></div>
                        <div><label>رقم الواتساب</label><input type="tel" name="whatsAppNumber" className="premium-input" required onChange={handleChange} value={formData.whatsAppNumber} /></div>
                        <div><label>التليفون الأرضي</label><input type="tel" name="landline" className="premium-input" onChange={handleChange} placeholder="اختياري" value={formData.landline} /></div>
                        <div style={{ gridColumn: '1 / -1' }}><label>العنوان بالكامل</label><input type="text" name="address" className="premium-input" required onChange={handleChange} value={formData.address} /></div>
                        <div style={{ gridColumn: '1 / -1' }}><label>أقرب علامة مميزة</label><input type="text" name="landmark" className="premium-input" onChange={handleChange} placeholder="اختياري" value={formData.landmark} /></div>
                    </div>
                </fieldset>

                {/* Submit */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                    <input type="checkbox" name="hasPaidFees" checked={formData.hasPaidFees} onChange={handleChange} style={{ width: '20px', height: '20px' }}/>
                    <label style={{ margin: 0, fontWeight: 'bold' }}>تم دفع الاشتراك؟</label>
                </div>

                <button type="submit" className="btn-primary" disabled={isLoading} style={{ padding: '1rem', fontSize: '1.2rem' }}>
                    {isLoading ? 'جاري إنشاء الحساب...' : 'تسجيل واستخراج البيانات'}
                </button>
            </form>
        </div>
    );
};

export default RegisterStudentScreen;
