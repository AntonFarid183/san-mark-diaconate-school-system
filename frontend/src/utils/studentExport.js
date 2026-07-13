// Shared Excel export config for student data — used by StudentListScreen and
// ClassDistributionScreen (per-class export) so both stay in sync.
export const STUDENT_EXPORT_COLUMNS = [
  { key: 'studentCode', label: 'الكود' },
  { key: 'userName', label: 'اسم المستخدم' },
  { key: 'fullName', label: 'الاسم الكامل' },
  { key: 'gender', label: 'النوع' },
  { key: 'stageName', label: 'المرحلة' },
  { key: 'gradeName', label: 'السنة الدراسية' },
  { key: 'className', label: 'الفصل' },
  { key: 'status', label: 'الحالة' },
  { key: 'isActive', label: 'الحساب مفعّل' },
  { key: 'dateOfBirth', label: 'تاريخ الميلاد' },
  { key: 'isDeacon', label: 'شماس' },
  { key: 'deaconRank', label: 'الرتبة الشماسية' },
  { key: 'fatherOfConfession', label: 'أب الاعتراف' },
  { key: 'fatherMobile', label: 'موبايل الأب' },
  { key: 'motherMobile', label: 'موبايل الأم' },
  { key: 'studentMobile', label: 'موبايل الطالب' },
  { key: 'whatsAppNumber', label: 'واتساب' },
  { key: 'landline', label: 'تليفون أرضي' },
  { key: 'address', label: 'العنوان' },
  { key: 'landmark', label: 'أقرب علامة مميزة' },
  { key: 'feesPaid', label: 'حالة السداد' },
  { key: 'paidAmount', label: 'المبلغ المدفوع' },
  { key: 'registeredDate', label: 'تاريخ التسجيل' },
];

const GENDER_LABELS = { Male: 'ذكر', Female: 'أنثى' };
const DEACON_RANK_LABELS = {
  Epsaltos: 'إبصالتس (مرتل)',
  Oghnostos: 'أغنسطس (قارئ)',
  Epediakon: 'إيبدياكون (مساعد شماس)',
  Diakon: 'دياكون (شماس كامل)',
};
const STATUS_LABELS = {
  Pending: 'قيد المراجعة',
  Active: 'نشط',
  Suspended: 'موقوف',
  Withdrawn: 'منسحب',
  Transferred: 'منقول',
  Graduated: 'متخرج',
};

// Raw API values (booleans/enums) → friendly Arabic text for the Excel export
export const formatStudentForExport = (s) => ({
  ...s,
  gender: GENDER_LABELS[s.gender] || s.gender,
  status: STATUS_LABELS[s.status] || s.status,
  isActive: s.isActive ? 'مفعّل' : 'غير مفعّل',
  isDeacon: s.isDeacon ? 'نعم' : 'لا',
  deaconRank: s.isDeacon ? (DEACON_RANK_LABELS[s.deaconRank] || s.deaconRank || '') : '',
  feesPaid: s.feesPaid ? 'مدفوع' : 'غير مدفوع',
  paidAmount: s.paidAmount ?? '',
  className: s.className || 'بانتظار التوزيع',
  dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('ar-EG') : '',
  registeredDate: s.registeredDate ? new Date(s.registeredDate).toLocaleDateString('ar-EG') : '',
});
