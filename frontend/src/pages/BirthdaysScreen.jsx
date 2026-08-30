import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import { usePageTitle } from '../context/PageTitleContext';
import { BACKEND_URL } from '../config';

const MONTH_DAY_LABEL = (isoDate) => new Date(isoDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' });
const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const labelStyle = {
  display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600,
};

// Full admin birthdays page -- separate from the dashboard's "birthdays today"
// widget (that one stays untouched). This one lists every active student
// matching the chosen filters (stage/grade/class + a specific month and/or
// day), with no filters at all just listing everyone sorted by month/day --
// a full-year birthday calendar rather than "today" or "this month" only.
const BirthdaysScreen = () => {
  usePageTitle('أعياد الميلاد');
  const navigate = useNavigate();

  const [stages, setStages] = useState([]);
  const [grades, setGrades] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);

  const [stageId, setStageId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [classId, setClassId] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  const [birthdays, setBirthdays] = useState(null); // null = loading
  const [error, setError] = useState(null);

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

  const fetchBirthdays = async () => {
    setBirthdays(null);
    setError(null);
    try {
      const params = {};
      if (month !== '') params.month = month;
      if (day !== '') params.day = day;
      if (classId) params.classId = classId;
      else if (gradeId) params.gradeId = gradeId;
      else if (stageId) params.stageId = stageId;
      const res = await apiClient.get('/students/birthdays', { params });
      setBirthdays(res.data);
    } catch {
      setBirthdays([]);
      setError('تعذّر تحميل أعياد الميلاد.');
    }
  };

  useEffect(() => { fetchBirthdays(); }, [stageId, gradeId, classId, month, day]); // eslint-disable-line react-hooks/exhaustive-deps

  const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

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
          <label style={labelStyle}>الشهر</label>
          <select className="premium-input" value={month} onChange={e => setMonth(e.target.value)}>
            <option value="">كل الشهور</option>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div style={{ minWidth: '120px' }}>
          <label style={labelStyle}>اليوم</label>
          <select className="premium-input" value={day} onChange={e => setDay(e.target.value)}>
            <option value="">كل الأيام</option>
            {dayOptions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        {birthdays ? `${birthdays.length} طالب` : ''}
      </div>

      {/* List */}
      {birthdays === null ? (
        <p style={{ textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>
      ) : error ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>error</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>{error}</p>
        </div>
      ) : birthdays.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)' }}>cake</span>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>لا يوجد طلاب مطابقين لهذا الفلتر</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {birthdays.map(b => (
            <div
              key={b.id}
              onClick={() => navigate(`/students/${b.id}`)}
              className="card-hover"
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: b.isToday ? 'rgba(251,191,36,0.08)' : 'var(--surface-1)' }}
            >
              {b.profilePictureUrl ? (
                <img src={b.profilePictureUrl.startsWith('http') ? b.profilePictureUrl : `${BACKEND_URL}${b.profilePictureUrl}`} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-gold)', flexShrink: 0 }} />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: '38px', color: 'var(--accent-gold)', flexShrink: 0 }}>account_circle</span>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {b.fullName}
                  {b.isToday && <span title="عيد ميلاده اليوم">🎉</span>}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {b.stageName} — {b.gradeName}{b.className ? ` — فصل ${b.className}` : ''}
                </div>
              </div>
              <div style={{ fontSize: '0.82rem', color: b.isToday ? 'var(--accent-gold)' : 'var(--text-secondary)', fontWeight: b.isToday ? 700 : 400, flexShrink: 0 }}>
                {MONTH_DAY_LABEL(b.dateOfBirth)}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default BirthdaysScreen;
