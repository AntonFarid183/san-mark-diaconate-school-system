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
    public DbSet<HymnLesson> HymnLessons => Set<HymnLesson>();
    public DbSet<HymnLessonProgress> HymnLessonProgresses => Set<HymnLessonProgress>();
    public DbSet<AttendanceSession> AttendanceSessions => Set<AttendanceSession>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<AttendanceAuditLog> AttendanceAuditLogs => Set<AttendanceAuditLog>();
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();

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
            .HasOne(s => s.CreatedByUser)
            .WithMany()
            .HasForeignKey(s => s.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<AttendanceSession>()
            .HasIndex(s => new { s.GradeId, s.StartsAt });

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
