namespace DiaconateSchool.Domain.Enums;

public enum Role
{
    Admin = 1,
    Student = 3
}

public enum Gender
{
    Male = 1,
    Female = 2
}

public enum DeaconRank
{
    Epsaltos = 1,
    Oghnostos = 2,
    Epediakon = 3,
    Diakon = 4
}

// Internal educational grouping within a Grade — orthogonal to Class. Not admin-managed
// (no CRUD): every Grade implicitly has both levels available, defaulting to Level1.
public enum StudentLevel
{
    Level1 = 1,
    Level2 = 2
}

public enum StudentStatus
{
    Pending = 0,
    Active = 1,
    Suspended = 2,
    Withdrawn = 3,
    Transferred = 4,
    Graduated = 5
}

public enum ContentType
{
    Pdf = 0,
    Video = 1,
    Audio = 2,
    Image = 3
}

public enum AccessType
{
    View = 0,
    Download = 1,
    Listen = 2,
    Watch = 3
}

public enum LessonStatus
{
    Draft = 0,
    Published = 1,
    Archived = 2
}

public enum SubmissionStatus
{
    Pending = 0,
    Submitted = 1,
    Approved = 2,
    Rejected = 3
}

public enum CurriculumStatus
{
    Draft = 0,
    Published = 1,
    Archived = 2
}

// Drives the public Curriculum Browser's subject dropdown (الطقس/الألحان/القبطي).
public enum CurriculumSubject
{
    Rites = 1,
    Hymns = 2,
    Coptic = 3
}

public enum HymnVideoType
{
    None = 0,
    UploadedFile = 1,
    YouTubeUrl = 2
}

public enum HymnLyricsType
{
    None = 0,
    Pdf = 1,
    Image = 2,
    Both = 3
}

public enum QuestionType
{
    MultipleChoice = 0,
    Essay = 1
}

public enum ExamResultStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

public enum ExamPeriod
{
    Midterm = 0,
    Final = 1,
    Supplementary = 2
}

public enum CertificateStatus
{
    Active = 0,
    Revoked = 1
}

public enum AttendanceSessionStatus
{
    Scheduled = 0,
    Open = 1,
    Closed = 2
}

public enum AttendanceStatus
{
    Present = 0,
    Absent = 1
}

public enum AttendanceMethod
{
    Manual = 0,
    Pin = 1
}

public enum LeaveStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

public enum HymnSubmissionStatus
{
    Pending = 0,
    Approved = 1,
    ResubmissionRequested = 2
}

public enum HomeworkMaterialType
{
    Pdf = 0,
    Image = 1
}

public enum NotificationType
{
    AccountActivated = 0,
    HomeworkPublished = 1,
    HymnReviewed = 2,
    AnnouncementPosted = 3,
    CurriculumPublished = 4,
    HymnLessonPublished = 5
}
