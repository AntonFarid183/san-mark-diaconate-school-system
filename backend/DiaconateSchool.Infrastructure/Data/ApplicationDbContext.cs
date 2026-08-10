using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DiaconateSchool.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<ApplicationUser> Users => Set<ApplicationUser>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Grade> Grades => Set<Grade>();
    public DbSet<Stage> Stages => Set<Stage>();
    public DbSet<AcademicYear> AcademicYears => Set<AcademicYear>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<ContentItem> ContentItems => Set<ContentItem>();
    public DbSet<ContentAccess> ContentAccesses => Set<ContentAccess>();
    public DbSet<StudentProgressSummary> StudentProgressSummaries => Set<StudentProgressSummary>();
    public DbSet<Exam> Exams => Set<Exam>();
    public DbSet<ExamResult> ExamResults => Set<ExamResult>();
    public DbSet<Certificate> Certificates => Set<Certificate>();
    public DbSet<Announcement> Announcements => Set<Announcement>();
    public DbSet<GradeHistory> GradeHistories => Set<GradeHistory>();
    public DbSet<Curriculum> Curriculums => Set<Curriculum>();
    public DbSet<PublicFeedback> PublicFeedbacks => Set<PublicFeedback>();
    public DbSet<HymnLesson> HymnLessons => Set<HymnLesson>();
    public DbSet<HymnLessonProgress> HymnLessonProgresses => Set<HymnLessonProgress>();
    public DbSet<AttendanceSession> AttendanceSessions => Set<AttendanceSession>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<AttendanceAuditLog> AttendanceAuditLogs => Set<AttendanceAuditLog>();
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();
    public DbSet<SchoolClass> SchoolClasses => Set<SchoolClass>();
    public DbSet<StudentAccount> StudentAccounts => Set<StudentAccount>();
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();
    public DbSet<HymnSubmission> HymnSubmissions => Set<HymnSubmission>();
    public DbSet<HomeworkSubject> HomeworkSubjects => Set<HomeworkSubject>();
    public DbSet<Homework> Homeworks => Set<Homework>();
    public DbSet<HomeworkQuestion> HomeworkQuestions => Set<HomeworkQuestion>();
    public DbSet<HomeworkSubmission> HomeworkSubmissions => Set<HomeworkSubmission>();
    public DbSet<HomeworkAnswer> HomeworkAnswers => Set<HomeworkAnswer>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User <-> Student
        modelBuilder.Entity<ApplicationUser>()
            .HasOne(u => u.Student)
            .WithOne(s => s.User)
            .HasForeignKey<Student>(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Stage -> Grades
        modelBuilder.Entity<Grade>()
            .HasOne(g => g.Stage)
            .WithMany(s => s.Grades)
            .HasForeignKey(g => g.StageId)
            .OnDelete(DeleteBehavior.Restrict);

        // Grade -> Students
        modelBuilder.Entity<Student>()
            .HasOne(s => s.Grade)
            .WithMany(g => g.Students)
            .HasForeignKey(s => s.GradeId)
            .OnDelete(DeleteBehavior.Restrict);

        // Grade -> AcademicYear
        modelBuilder.Entity<Grade>()
            .HasOne(g => g.AcademicYear)
            .WithMany()
            .HasForeignKey(g => g.AcademicYearId)
            .OnDelete(DeleteBehavior.SetNull);

        // Lesson -> Stage, Grade
        modelBuilder.Entity<Lesson>()
            .HasOne(l => l.Stage)
            .WithMany()
            .HasForeignKey(l => l.StageId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Lesson>()
            .HasOne(l => l.Grade)
            .WithMany(g => g.Lessons)
            .HasForeignKey(l => l.GradeId)
            .OnDelete(DeleteBehavior.Restrict);

        // ContentItem -> Lesson
        modelBuilder.Entity<ContentItem>()
            .HasOne(ci => ci.Lesson)
            .WithMany(l => l.ContentItems)
            .HasForeignKey(ci => ci.LessonId)
            .OnDelete(DeleteBehavior.Cascade);

        // ContentAccess -> Student, ContentItem
        modelBuilder.Entity<ContentAccess>()
            .HasOne(ca => ca.Student)
            .WithMany()
            .HasForeignKey(ca => ca.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ContentAccess>()
            .HasOne(ca => ca.ContentItem)
            .WithMany()
            .HasForeignKey(ca => ca.ContentItemId)
            .OnDelete(DeleteBehavior.Restrict);

        // StudentProgressSummary -> Student
        modelBuilder.Entity<StudentProgressSummary>()
            .HasOne(sps => sps.Student)
            .WithMany()
            .HasForeignKey(sps => sps.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        // Exam -> Stage, Grade
        modelBuilder.Entity<Exam>()
            .HasOne(e => e.Stage)
            .WithMany()
            .HasForeignKey(e => e.StageId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Exam>()
            .HasOne(e => e.Grade)
            .WithMany()
            .HasForeignKey(e => e.GradeId)
            .OnDelete(DeleteBehavior.Restrict);

        // ExamResult -> Exam, Student
        modelBuilder.Entity<ExamResult>()
            .HasOne(er => er.Exam)
            .WithMany(e => e.Results)
            .HasForeignKey(er => er.ExamId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ExamResult>()
            .HasOne(er => er.Student)
            .WithMany()
            .HasForeignKey(er => er.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ExamResult>()
            .Property(er => er.Score).HasPrecision(5, 2);
        modelBuilder.Entity<ExamResult>()
            .Property(er => er.TotalScore).HasPrecision(5, 2);
        modelBuilder.Entity<ExamResult>()
            .Property(er => er.Percentage).HasPrecision(5, 2);

        // Certificate -> ExamResult, Student
        modelBuilder.Entity<Certificate>()
            .HasOne(c => c.ExamResult)
            .WithOne(er => er.Certificate)
            .HasForeignKey<Certificate>(c => c.ExamResultId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Certificate>()
            .HasOne(c => c.Student)
            .WithMany()
            .HasForeignKey(c => c.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Certificate>()
            .Property(c => c.Score).HasPrecision(5, 2);
        modelBuilder.Entity<Certificate>()
            .Property(c => c.TotalScore).HasPrecision(5, 2);
        modelBuilder.Entity<Certificate>()
            .Property(c => c.Percentage).HasPrecision(5, 2);

        // Announcement -> Stage (optional)
        modelBuilder.Entity<Announcement>()
            .HasOne(a => a.TargetStage)
            .WithMany()
            .HasForeignKey(a => a.TargetStageId)
            .OnDelete(DeleteBehavior.SetNull);

        // GradeHistory -> Student, FromGrade, ToGrade
        modelBuilder.Entity<GradeHistory>()
            .HasOne(gh => gh.Student)
            .WithMany()
            .HasForeignKey(gh => gh.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<GradeHistory>()
            .HasOne(gh => gh.FromGrade)
            .WithMany()
            .HasForeignKey(gh => gh.FromGradeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<GradeHistory>()
            .HasOne(gh => gh.ToGrade)
            .WithMany()
            .HasForeignKey(gh => gh.ToGradeId)
            .OnDelete(DeleteBehavior.Restrict);

        // Curriculum -> Stage
        modelBuilder.Entity<Curriculum>()
            .HasOne(c => c.Stage)
            .WithMany()
            .HasForeignKey(c => c.StageId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Curriculum>()
            .Property(c => c.Subject)
            .HasDefaultValue(Domain.Enums.CurriculumSubject.Rites);

        // HymnLesson -> Stage
        modelBuilder.Entity<HymnLesson>()
            .HasOne(hl => hl.Stage)
            .WithMany()
            .HasForeignKey(hl => hl.StageId)
            .OnDelete(DeleteBehavior.Restrict);

        // HymnLesson -> Grade (optional)
        modelBuilder.Entity<HymnLesson>()
            .HasOne(hl => hl.Grade)
            .WithMany()
            .HasForeignKey(hl => hl.GradeId)
            .OnDelete(DeleteBehavior.SetNull);

        // HymnLessonProgress -> Student, HymnLesson
        modelBuilder.Entity<HymnLessonProgress>()
            .HasOne(p => p.Student)
            .WithMany()
            .HasForeignKey(p => p.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<HymnLessonProgress>()
            .HasOne(p => p.HymnLesson)
            .WithMany()
            .HasForeignKey(p => p.HymnLessonId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<HymnLessonProgress>()
            .HasIndex(p => new { p.StudentId, p.HymnLessonId }).IsUnique();

        modelBuilder.Entity<HymnLessonProgress>()
            .Property(p => p.WatchedPercent).HasPrecision(5, 1);

        // Unique indexes
        modelBuilder.Entity<ApplicationUser>()
            .HasIndex(u => u.UserName).IsUnique();

        modelBuilder.Entity<ApplicationUser>()
            .HasIndex(u => new { u.FirstName, u.MiddleName, u.ThirdName, u.LastName })
            .IsUnique()
            .HasDatabaseName("IX_User_UniqueFullName");

        modelBuilder.Entity<Student>()
            .HasIndex(s => s.StudentCode).IsUnique();
        modelBuilder.Entity<Student>()
            .HasIndex(s => s.QrToken).IsUnique();
        modelBuilder.Entity<Student>()
            .Property(s => s.PaidAmount).HasPrecision(18, 2);

        modelBuilder.Entity<ContentAccess>()
            .HasIndex(ca => new { ca.StudentId, ca.ContentItemId }).IsUnique();

        modelBuilder.Entity<StudentProgressSummary>()
            .HasIndex(sps => sps.StudentId).IsUnique();


        modelBuilder.Entity<AttendanceSession>()
            .HasOne(s => s.Grade)
            .WithMany()
            .HasForeignKey(s => s.GradeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<AttendanceSession>()
            .HasOne(s => s.Class)
            .WithMany()
            .HasForeignKey(s => s.ClassId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<AttendanceSession>()
            .HasOne(s => s.CreatedByUser)
            .WithMany()
            .HasForeignKey(s => s.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<AttendanceSession>()
            .HasIndex(s => new { s.GradeId, s.StartsAt });

        modelBuilder.Entity<AttendanceSession>()
            .HasIndex(s => new { s.ClassId, s.StartsAt });

        modelBuilder.Entity<AttendanceRecord>()
            .HasOne(r => r.Session)
            .WithMany(s => s.Records)
            .HasForeignKey(r => r.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AttendanceRecord>()
            .HasOne(r => r.Student)
            .WithMany()
            .HasForeignKey(r => r.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<AttendanceRecord>()
            .HasOne(r => r.RecordedByUser)
            .WithMany()
            .HasForeignKey(r => r.RecordedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<AttendanceRecord>()
            .HasIndex(r => new { r.SessionId, r.StudentId }).IsUnique();

        modelBuilder.Entity<AttendanceAuditLog>()
            .HasOne(l => l.Record)
            .WithMany(r => r.AuditLogs)
            .HasForeignKey(l => l.RecordId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AttendanceAuditLog>()
            .HasOne(l => l.ChangedByUser)
            .WithMany()
            .HasForeignKey(l => l.ChangedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LeaveRequest>()
            .HasOne(l => l.Student)
            .WithMany()
            .HasForeignKey(l => l.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<LeaveRequest>()
            .HasOne(l => l.DecidedByUser)
            .WithMany()
            .HasForeignKey(l => l.DecidedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LeaveRequest>()
            .HasIndex(l => new { l.StudentId, l.FromDate, l.ToDate });

        // SchoolClass -> Grade
        modelBuilder.Entity<SchoolClass>()
            .HasOne(c => c.Grade)
            .WithMany()
            .HasForeignKey(c => c.GradeId)
            .OnDelete(DeleteBehavior.Restrict);

        // SchoolClass -> AcademicYear
        modelBuilder.Entity<SchoolClass>()
            .HasOne(c => c.AcademicYear)
            .WithMany()
            .HasForeignKey(c => c.AcademicYearId)
            .OnDelete(DeleteBehavior.Restrict);

        // SchoolClass unique: Name + GradeId + AcademicYearId + Level (each level has its own class set)
        modelBuilder.Entity<SchoolClass>()
            .HasIndex(c => new { c.GradeId, c.AcademicYearId, c.Level, c.Name }).IsUnique();

        // Existing rows (and any row that omits Level) default to Level1 — not the enum's
        // underlying 0, which has no corresponding StudentLevel value.
        modelBuilder.Entity<SchoolClass>()
            .Property(c => c.Level)
            .HasDefaultValue(StudentLevel.Level1);

        modelBuilder.Entity<Student>()
            .Property(s => s.Level)
            .HasDefaultValue(StudentLevel.Level1);

        // Student -> SchoolClass (optional)
        modelBuilder.Entity<Student>()
            .HasOne(s => s.Class)
            .WithMany(c => c.Students)
            .HasForeignKey(s => s.ClassId)
            .OnDelete(DeleteBehavior.SetNull);

        // StudentAccount -> Student (1:1)
        modelBuilder.Entity<StudentAccount>()
            .HasOne(a => a.Student)
            .WithOne()
            .HasForeignKey<StudentAccount>(a => a.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<StudentAccount>()
            .HasIndex(a => a.StudentId).IsUnique();

        modelBuilder.Entity<StudentAccount>()
            .Property(a => a.TotalRequired).HasPrecision(18, 2);

        // PaymentTransaction -> StudentAccount
        modelBuilder.Entity<PaymentTransaction>()
            .HasOne(t => t.StudentAccount)
            .WithMany(a => a.Transactions)
            .HasForeignKey(t => t.StudentAccountId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PaymentTransaction>()
            .HasOne(t => t.RecordedByUser)
            .WithMany()
            .HasForeignKey(t => t.RecordedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<PaymentTransaction>()
            .HasOne(t => t.VoidedByUser)
            .WithMany()
            .HasForeignKey(t => t.VoidedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<PaymentTransaction>()
            .Property(t => t.Amount).HasPrecision(18, 2);

        modelBuilder.Entity<PaymentTransaction>()
            .HasIndex(t => new { t.StudentAccountId, t.TransactionDate });

        // HymnSubmission -> HymnLesson, Student
        modelBuilder.Entity<HymnSubmission>()
            .HasOne(s => s.HymnLesson)
            .WithMany()
            .HasForeignKey(s => s.HymnLessonId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<HymnSubmission>()
            .HasOne(s => s.Student)
            .WithMany()
            .HasForeignKey(s => s.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<HymnSubmission>()
            .HasOne(s => s.ReviewedByUser)
            .WithMany()
            .HasForeignKey(s => s.ReviewedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<HymnSubmission>()
            .HasIndex(s => new { s.HymnLessonId, s.StudentId }).IsUnique();

        modelBuilder.Entity<HymnSubmission>()
            .Property(s => s.Score).HasPrecision(5, 2);

        // Homework -> Subject, Stage, Grade
        modelBuilder.Entity<Homework>()
            .HasOne(h => h.Subject)
            .WithMany()
            .HasForeignKey(h => h.SubjectId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Homework>()
            .HasOne(h => h.Stage)
            .WithMany()
            .HasForeignKey(h => h.StageId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Homework>()
            .HasOne(h => h.Grade)
            .WithMany()
            .HasForeignKey(h => h.GradeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Homework>()
            .Property(h => h.TotalMarks).HasPrecision(5, 2);

        // HomeworkQuestion -> Homework
        modelBuilder.Entity<HomeworkQuestion>()
            .HasOne(q => q.Homework)
            .WithMany(h => h.Questions)
            .HasForeignKey(q => q.HomeworkId)
            .OnDelete(DeleteBehavior.Cascade);

        // HomeworkSubmission -> Homework, Student
        modelBuilder.Entity<HomeworkSubmission>()
            .HasOne(s => s.Homework)
            .WithMany()
            .HasForeignKey(s => s.HomeworkId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<HomeworkSubmission>()
            .HasOne(s => s.Student)
            .WithMany()
            .HasForeignKey(s => s.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<HomeworkSubmission>()
            .HasIndex(s => new { s.HomeworkId, s.StudentId }).IsUnique();

        modelBuilder.Entity<HomeworkSubmission>()
            .Property(s => s.Score).HasPrecision(5, 2);

        // HomeworkAnswer -> HomeworkSubmission, HomeworkQuestion
        modelBuilder.Entity<HomeworkAnswer>()
            .HasOne(a => a.HomeworkSubmission)
            .WithMany(s => s.Answers)
            .HasForeignKey(a => a.HomeworkSubmissionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<HomeworkAnswer>()
            .HasOne(a => a.HomeworkQuestion)
            .WithMany()
            .HasForeignKey(a => a.HomeworkQuestionId)
            .OnDelete(DeleteBehavior.Restrict);

        // Seed homework subjects
        var subjectCopticId = Guid.Parse("00000000-0000-0000-0100-000000000001");
        var subjectLiturgicalId = Guid.Parse("00000000-0000-0000-0100-000000000002");
        var subjectMemorizationId = Guid.Parse("00000000-0000-0000-0100-000000000003");

        modelBuilder.Entity<HomeworkSubject>().HasData(
            new HomeworkSubject { Id = subjectCopticId, Name = "اللغة القبطية", DisplayOrder = 1 },
            new HomeworkSubject { Id = subjectLiturgicalId, Name = "الطقس الكنسي", DisplayOrder = 2 },
            new HomeworkSubject { Id = subjectMemorizationId, Name = "محفوظات", DisplayOrder = 3 }
        );

        // Notification -> User
        modelBuilder.Entity<Notification>()
            .HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Notification>()
            .HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt });

        SeedStagesAndGrades(modelBuilder);
    }

    private void SeedStagesAndGrades(ModelBuilder modelBuilder)
    {
        var childhoodId  = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var primaryId    = Guid.Parse("00000000-0000-0000-0001-000000000001");
        var prepId       = Guid.Parse("00000000-0000-0000-0002-000000000001");
        var secondaryId  = Guid.Parse("00000000-0000-0000-0003-000000000001");
        var universityId = Guid.Parse("00000000-0000-0000-0004-000000000001");
        var graduatesId  = Guid.Parse("00000000-0000-0000-0005-000000000001");
        var seniorsId    = Guid.Parse("00000000-0000-0000-0006-000000000001");

        var stages = new List<Stage>
        {
            new() { Id = childhoodId,  Name = "طفولة",   DisplayOrder = 0 },
            new() { Id = primaryId,    Name = "ابتدائي", DisplayOrder = 1 },
            new() { Id = prepId,       Name = "إعدادي",  DisplayOrder = 2 },
            new() { Id = secondaryId,  Name = "ثانوي",   DisplayOrder = 3 },
            new() { Id = universityId, Name = "جامعة",   DisplayOrder = 4 },
            new() { Id = graduatesId,  Name = "خريجون",  DisplayOrder = 5 },
            new() { Id = seniorsId,    Name = "كبار",    DisplayOrder = 6 },
        };

        modelBuilder.Entity<Stage>().HasData(stages);

        var grades = new List<Grade>();

        for (int i = 1; i <= 6; i++)
            grades.Add(new Grade
            {
                Id = Guid.Parse($"00000000-0000-0000-0001-{i:D12}"),
                Name = $"الصف {i} الابتدائي",
                Level = i,
                StageId = primaryId
            });

        for (int i = 1; i <= 3; i++)
            grades.Add(new Grade
            {
                Id = Guid.Parse($"00000000-0000-0000-0002-{i:D12}"),
                Name = $"الصف {i} الإعدادي",
                Level = i,
                StageId = prepId
            });

        for (int i = 1; i <= 3; i++)
            grades.Add(new Grade
            {
                Id = Guid.Parse($"00000000-0000-0000-0003-{i:D12}"),
                Name = $"الصف {i} الثانوي",
                Level = i,
                StageId = secondaryId
            });

        modelBuilder.Entity<Grade>().HasData(grades);
    }
}
