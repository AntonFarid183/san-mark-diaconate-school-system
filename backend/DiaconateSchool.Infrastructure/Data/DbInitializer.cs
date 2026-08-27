using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

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

        // Seed a default current academic year if none exists
        if (!await context.AcademicYears.AnyAsync())
        {
            context.AcademicYears.Add(new AcademicYear
            {
                Id = Guid.NewGuid(),
                Name = "نيروز 1743",
                IsCurrent = true,
                CreatedAt = DateTime.UtcNow
            });
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

    /// <summary>
    /// Applies migrations and seeds, but only when the schema the compiled code
    /// expects differs from what was last applied.
    ///
    /// Why this gate exists: the App Service Free plan has no "Always On", so the
    /// process is unloaded and restarted repeatedly through the day. MigrateAsync
    /// plus the seed's existence checks are several queries, and any one of them
    /// wakes the serverless database -- which then stays billable for its entire
    /// auto-pause delay. Restarts alone can therefore burn through the free
    /// database allowance while nobody is using the site at all. With the gate
    /// closed, a normal restart never contacts the database.
    ///
    /// The marker is a small file on persistent storage holding a fingerprint of
    /// the migrations compiled into this build. A matching fingerprint means the
    /// schema is already current. A missing or differing marker -- fresh database,
    /// a deployment that added a migration, or wiped storage -- opens the gate.
    /// Both MigrateAsync and the seed are idempotent, so opening the gate
    /// unnecessarily is safe; it just is not free.
    ///
    /// If the schema is ever changed out of band and the marker goes stale, set
    /// ForceMigrationsOnStartup=true for one boot to force a full check.
    /// </summary>
    public static async Task SeedIfSchemaChangedAsync(
        ApplicationDbContext context,
        IPasswordHasher passwordHasher,
        string markerPath,
        bool force,
        ILogger logger)
    {
        // Reads the migrations compiled into the assembly. Unlike
        // GetAppliedMigrationsAsync, this does not contact the database.
        var migrations = context.Database.GetMigrations().ToList();
        var fingerprint = $"{migrations.Count}:{migrations.LastOrDefault() ?? "none"}";

        if (!force && ReadMarker(markerPath) == fingerprint)
        {
            logger.LogInformation(
                "Database schema already at {Fingerprint}. Skipping migration and seed, so this restart does not wake the database.",
                fingerprint);
            return;
        }

        logger.LogInformation(
            "Schema fingerprint is {Fingerprint}{Forced}. Applying migrations and seed.",
            fingerprint, force ? " (forced)" : "");

        await SeedAsync(context, passwordHasher);
        WriteMarker(markerPath, fingerprint, logger);
    }

    /// <summary>An unreadable marker is treated as a missing one: check again rather than assume.</summary>
    private static string? ReadMarker(string path)
    {
        try
        {
            return File.Exists(path) ? File.ReadAllText(path).Trim() : null;
        }
        catch
        {
            return null;
        }
    }

    private static void WriteMarker(string path, string fingerprint, ILogger logger)
    {
        try
        {
            var directory = Path.GetDirectoryName(path);
            if (!string.IsNullOrEmpty(directory))
                Directory.CreateDirectory(directory);

            File.WriteAllText(path, fingerprint);
        }
        catch (Exception ex)
        {
            // Not fatal: without a marker the next start simply re-checks, which
            // costs one database wake rather than breaking anything.
            logger.LogWarning(ex,
                "Could not write the migration marker to {Path}. Migrations will be re-checked on the next start.",
                path);
        }
    }
}
