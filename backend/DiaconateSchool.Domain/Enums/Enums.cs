namespace DiaconateSchool.Domain.Enums;

public enum Role
{
    Admin = 1,
    Servant = 2,
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

public enum QuestionType
{
    MultipleChoice = 0,
    Essay = 1
}

public enum ExamAttemptStatus
{
    InProgress = 0,
    Submitted = 1,
    Graded = 2
}
