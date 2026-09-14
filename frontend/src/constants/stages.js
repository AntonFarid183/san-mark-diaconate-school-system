// Stage/grade picker config, shared by every screen that lets an admin (or a
// student) choose a stage: RegisterStudentScreen, SelfRegisterScreen and
// EditStudentScreen. It used to be copy-pasted per screen, which is how the
// edit screen ended up unable to offer stage/grade at all.
//
// The stage ids are the seeded Stage rows; `localGrades` are the seeded
// pseudo-grades for stages that have no real year picker (طفولة's KG1/KG2 and
// the single-grade جامعة/خريجون/كبار). Those ids must stay in sync with the
// SeedGradelessStagePseudoGrades / SeedMissingStages migrations -- sending an
// id with no matching Grade row is a foreign-key violation on insert.
export const STAGE_IDS = {
  childhood:   '00000000-0000-0000-0000-000000000001',
  primary:     '00000000-0000-0000-0001-000000000001',
  preparatory: '00000000-0000-0000-0002-000000000001',
  secondary:   '00000000-0000-0000-0003-000000000001',
  university:  '00000000-0000-0000-0004-000000000001',
  graduates:   '00000000-0000-0000-0005-000000000001',
  adults:      '00000000-0000-0000-0006-000000000001',
};

export const STAGES = [
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

// The API serializes Gender/DeaconRank as their *names* when reading a student
// (StudentDetailDto types them as string) but binds them as their numeric enum
// values when writing (UpdateStudentDto types them as the enums, and no
// JsonStringEnumConverter is registered). Editing a student has to cross that
// gap in both directions, hence these two maps.
export const GENDER_OPTIONS = [
  { value: 1, name: 'Male', label: 'ذكر' },
  { value: 2, name: 'Female', label: 'أنثى' },
];

export const DEACON_RANK_OPTIONS = [
  { value: 1, name: 'Epsaltos', label: 'إبصالتس (مرتل)' },
  { value: 2, name: 'Oghnostos', label: 'أغنسطس (قارئ)' },
  { value: 3, name: 'Epediakon', label: 'إيبدياكون (مساعد شماس)' },
  { value: 4, name: 'Diakon', label: 'دياكون (شماس كامل)' },
];

// "Male" -> 1 / "Epsaltos" -> 1, tolerating a value that's already numeric.
const toEnumValue = (options, raw) => {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number') return raw;
  const match = options.find(o => o.name === raw || String(o.value) === String(raw));
  return match ? match.value : null;
};

export const genderValue = (raw) => toEnumValue(GENDER_OPTIONS, raw);
export const deaconRankValue = (raw) => toEnumValue(DEACON_RANK_OPTIONS, raw);
