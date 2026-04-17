using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DiaconateSchool.Infrastructure.Data;

/// <summary>
/// The main database context for the application.
/// </summary>
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) 
        : base(options)
    {
    }

    public DbSet<ApplicationUser> Users { get; set; }
    public DbSet<Student> Students { get; set; }
    public DbSet<Grade> Grades { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. One-to-One: User <-> Student
        modelBuilder.Entity<ApplicationUser>()
            .HasOne(u => u.Student)
            .WithOne(s => s.User)
            .HasForeignKey<Student>(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // 2. One-to-Many: Grade <-> Students
        // One Grade can have many Students. If a Grade is deleted (rare), 
        // we Restrict deletion if students are still assigned to it for safety.
        modelBuilder.Entity<Student>()
            .HasOne(s => s.Grade)
            .WithMany(g => g.Students)
            .HasForeignKey(s => s.GradeId)
            .OnDelete(DeleteBehavior.Restrict);

        // 3. Enforce Business Rule: No Duplicate Students
        modelBuilder.Entity<Student>()
            .HasIndex(s => new { s.FirstName, s.SecondName, s.ThirdName, s.LastName, s.DateOfBirth })
            .IsUnique()
            .HasDatabaseName("IX_Student_UniqueNameAndDob");
            
        // 4. Ensure UserName is unique for login
        modelBuilder.Entity<ApplicationUser>()
            .HasIndex(u => u.UserName)
            .IsUnique();

        // 5. Seed Initial Grade Data
        SeedGrades(modelBuilder);
    }

    private void SeedGrades(ModelBuilder modelBuilder)
    {
        var grades = new List<Grade>();

        // Primary: 1 -> 6
        for (int i = 1; i <= 6; i++)
        {
            grades.Add(new Grade { 
                Id = Guid.Parse($"00000000-0000-0000-0001-00000000000{i}"), 
                Name = $"الصف {i} الابتدائي", 
                Level = i, 
                Stage = Stage.Primary 
            });
        }

        // Prep: 1 -> 3
        for (int i = 1; i <= 3; i++)
        {
            grades.Add(new Grade { 
                Id = Guid.Parse($"00000000-0000-0000-0002-00000000000{i}"), 
                Name = $"الصف {i} الإعدادي", 
                Level = i, 
                Stage = Stage.Preparatory 
            });
        }

        // Secondary: 1 -> 3
        for (int i = 1; i <= 3; i++)
        {
            grades.Add(new Grade { 
                Id = Guid.Parse($"00000000-0000-0000-0003-00000000000{i}"), 
                Name = $"الصف {i} الثانوي", 
                Level = i, 
                Stage = Stage.Secondary 
            });
        }

        modelBuilder.Entity<Grade>().HasData(grades);
    }
}
