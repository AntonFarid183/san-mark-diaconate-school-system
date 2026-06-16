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
    public DbSet<Servant> Servants => Set<Servant>();
    public DbSet<AcademicYear> AcademicYears => Set<AcademicYear>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<ContentItem> ContentItems => Set<ContentItem>();
    public DbSet<ContentAccess> ContentAccesses => Set<ContentAccess>();
    public DbSet<StudentProgressSummary> StudentProgressSummaries => Set<StudentProgressSummary>();
    public DbSet<Hymn> Hymns => Set<Hymn>();
    public DbSet<HymnSubmission> HymnSubmissions => Set<HymnSubmission>();
    public DbSet<Exam> Exams => Set<Exam>();
    public DbSet<ExamQuestion> ExamQuestions => Set<ExamQuestion>();
    public DbSet<ExamAttempt> ExamAttempts => Set<ExamAttempt>();
    public DbSet<ExamAnswer> ExamAnswers => Set<ExamAnswer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. One-to-One: User <-> Student
        modelBuilder.Entity<ApplicationUser>()
            .HasOne(u => u.Student)
            .WithOne(s => s.User)
            .HasForeignKey<Student>(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // 2. One-to-One: User <-> Servant
        modelBuilder.Entity<ApplicationUser>()
            .HasOne<Servant>()
            .WithOne(s => s.User)
            .HasForeignKey<Servant>(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // 3. One-to-Many: Stage -> Grades
        modelBuilder.Entity<Grade>()
            .HasOne(g => g.Stage)
            .WithMany(s => s.Grades)
            .HasForeignKey(g => g.StageId)
            .OnDelete(DeleteBehavior.Restrict);

        // 4. One-to-Many: Grade -> Students
        modelBuilder.Entity<Student>()
            .HasOne(s => s.Grade)
            .WithMany(g => g.Students)
            .HasForeignKey(s => s.GradeId)
            .OnDelete(DeleteBehavior.Restrict);

        // 5. Grade -> AcademicYear (optional)
        modelBuilder.Entity<Grade>()
            .HasOne(g => g.AcademicYear)
            .WithMany()
            .HasForeignKey(g => g.AcademicYearId)
            .OnDelete(DeleteBehavior.SetNull);

        // 6. Lesson -> Stage, Grade
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

        // 7. ContentItem -> Lesson
        modelBuilder.Entity<ContentItem>()
            .HasOne(ci => ci.Lesson)
            .WithMany(l => l.ContentItems)
            .HasForeignKey(ci => ci.LessonId)
            .OnDelete(DeleteBehavior.Cascade);

        // 8. ContentAccess -> Student, ContentItem
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

        // 9. StudentProgressSummary -> Student
        modelBuilder.Entity<StudentProgressSummary>()
            .HasOne(sps => sps.Student)
            .WithMany()
            .HasForeignKey(sps => sps.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        // 10. Hymn -> Grade
        modelBuilder.Entity<Hymn>()
            .HasOne(h => h.Grade)
            .WithMany()
            .HasForeignKey(h => h.GradeId)
            .OnDelete(DeleteBehavior.Restrict);

        // 11. HymnSubmission -> Hymn, Student
        modelBuilder.Entity<HymnSubmission>()
            .HasOne(hs => hs.Hymn)
            .WithMany(h => h.Submissions)
            .HasForeignKey(hs => hs.HymnId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<HymnSubmission>()
            .HasOne(hs => hs.Student)
            .WithMany()
            .HasForeignKey(hs => hs.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<HymnSubmission>()
            .HasIndex(hs => new { hs.HymnId, hs.StudentId })
            .IsUnique();

        // 12. Exam -> Stage, Grade
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

        // 13. ExamQuestion -> Exam
        modelBuilder.Entity<ExamQuestion>()
            .HasOne(eq => eq.Exam)
            .WithMany(e => e.Questions)
            .HasForeignKey(eq => eq.ExamId)
            .OnDelete(DeleteBehavior.Cascade);

        // 14. ExamAttempt -> Exam, Student
        modelBuilder.Entity<ExamAttempt>()
            .HasOne(ea => ea.Exam)
            .WithMany(e => e.Attempts)
            .HasForeignKey(ea => ea.ExamId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ExamAttempt>()
            .HasOne(ea => ea.Student)
            .WithMany()
            .HasForeignKey(ea => ea.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        // 15. ExamAnswer -> ExamAttempt, ExamQuestion
        modelBuilder.Entity<ExamAnswer>()
            .HasOne(ea => ea.ExamAttempt)
            .WithMany(a => a.Answers)
            .HasForeignKey(ea => ea.ExamAttemptId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ExamAnswer>()
            .HasOne(ea => ea.Question)
            .WithMany()
            .HasForeignKey(ea => ea.QuestionId)
            .OnDelete(DeleteBehavior.Restrict);

        // 16. Unique Indexes
        modelBuilder.Entity<ApplicationUser>()
            .HasIndex(u => u.UserName)
            .IsUnique();

        modelBuilder.Entity<ApplicationUser>()
            .HasIndex(u => new { u.FirstName, u.MiddleName, u.ThirdName, u.LastName })
            .IsUnique()
            .HasDatabaseName("IX_User_UniqueFullName");

        modelBuilder.Entity<Student>()
            .HasIndex(s => s.StudentCode)
            .IsUnique();

        modelBuilder.Entity<ContentAccess>()
            .HasIndex(ca => new { ca.StudentId, ca.ContentItemId })
            .IsUnique();

        modelBuilder.Entity<StudentProgressSummary>()
            .HasIndex(sps => sps.StudentId)
            .IsUnique();

        // 11. Seed Data
        SeedStagesAndGrades(modelBuilder);
    }

    private void SeedStagesAndGrades(ModelBuilder modelBuilder)
    {
        var primaryId = Guid.Parse("00000000-0000-0000-0001-000000000001");
        var prepId = Guid.Parse("00000000-0000-0000-0002-000000000001");
        var secondaryId = Guid.Parse("00000000-0000-0000-0003-000000000001");

        var stages = new List<Stage>
        {
            new() { Id = primaryId, Name = "ابتدائي", DisplayOrder = 1 },
            new() { Id = prepId, Name = "إعدادي", DisplayOrder = 2 },
            new() { Id = secondaryId, Name = "ثانوي", DisplayOrder = 3 }
        };

        modelBuilder.Entity<Stage>().HasData(stages);

        var grades = new List<Grade>();
        int gradeCounter = 0;

        for (int i = 1; i <= 6; i++)
        {
            gradeCounter++;
            grades.Add(new Grade
            {
                Id = Guid.Parse($"00000000-0000-0000-0001-{i:D12}"),
                Name = $"الصف {i} الابتدائي",
                Level = i,
                StageId = primaryId
            });
        }

        for (int i = 1; i <= 3; i++)
        {
            gradeCounter++;
            grades.Add(new Grade
            {
                Id = Guid.Parse($"00000000-0000-0000-0002-{i:D12}"),
                Name = $"الصف {i} الإعدادي",
                Level = i,
                StageId = prepId
            });
        }

        for (int i = 1; i <= 3; i++)
        {
            gradeCounter++;
            grades.Add(new Grade
            {
                Id = Guid.Parse($"00000000-0000-0000-0003-{i:D12}"),
                Name = $"الصف {i} الثانوي",
                Level = i,
                StageId = secondaryId
            });
        }

        modelBuilder.Entity<Grade>().HasData(grades);
    }
}
