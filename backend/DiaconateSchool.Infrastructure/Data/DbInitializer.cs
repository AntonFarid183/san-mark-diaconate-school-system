using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DiaconateSchool.Infrastructure.Data;

public static class DbInitializer
{
    private static readonly Guid PrimaryStageId = Guid.Parse("00000000-0000-0000-0001-000000000001");
    private static readonly Guid PrepStageId = Guid.Parse("00000000-0000-0000-0002-000000000001");
    private static readonly Guid SecondaryStageId = Guid.Parse("00000000-0000-0000-0003-000000000001");

    public static async Task SeedAsync(ApplicationDbContext context, IPasswordHasher? passwordHasher = null)
    {
        await context.Database.MigrateAsync();

        // Seed admin user on first run (before stages check since stages come from migration)
        if (passwordHasher != null && !await context.Users.AnyAsync())
        {
            var adminId = Guid.NewGuid();
            var admin = new ApplicationUser
            {
                Id = adminId,
                UserName = "admin",
                PasswordHash = passwordHasher.HashPassword("admin123"),
                Role = Role.Admin,
                MustChangePassword = false,
                FirstName = "مدير",
                MiddleName = "",
                ThirdName = "",
                LastName = "النظام",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(admin);
            await context.SaveChangesAsync();
        }

        // Stages and grades are already seeded by migration
        if (await context.Stages.AnyAsync()) return;

        var stages = new List<Stage>
        {
            new() { Id = PrimaryStageId, Name = "ابتدائي", DisplayOrder = 1 },
            new() { Id = PrepStageId, Name = "إعدادي", DisplayOrder = 2 },
            new() { Id = SecondaryStageId, Name = "ثانوي", DisplayOrder = 3 }
        };

        await context.Stages.AddRangeAsync(stages);

        var grades = new List<Grade>();

        for (int i = 1; i <= 6; i++)
        {
            grades.Add(new Grade
            {
                Id = Guid.NewGuid(),
                Name = $"الصف {i} الابتدائي",
                Level = i,
                StageId = PrimaryStageId
            });
        }

        for (int i = 1; i <= 3; i++)
        {
            grades.Add(new Grade
            {
                Id = Guid.NewGuid(),
                Name = $"الصف {i} الإعدادي",
                Level = i,
                StageId = PrepStageId
            });
        }

        for (int i = 1; i <= 3; i++)
        {
            grades.Add(new Grade
            {
                Id = Guid.NewGuid(),
                Name = $"الصف {i} الثانوي",
                Level = i,
                StageId = SecondaryStageId
            });
        }

        await context.Grades.AddRangeAsync(grades);
        await context.SaveChangesAsync();
    }
}
