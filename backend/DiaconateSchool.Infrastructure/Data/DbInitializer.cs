using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // 1. Ensure the database is up to date and tables are created
        await context.Database.MigrateAsync();

        // 2. Check if grades table already has data
        if (await context.Grades.AnyAsync()) return;

        var grades = new List<Grade>();

        // Primary: 1 -> 6
        for (int i = 1; i <= 6; i++)
        {
            grades.Add(new Grade { 
                Id = Guid.NewGuid(), 
                Name = $"الصف {i} الابتدائي", 
                Level = i, 
                Stage = Stage.Primary 
            });
        }

        // Prep: 1 -> 3
        for (int i = 1; i <= 3; i++)
        {
            grades.Add(new Grade { 
                Id = Guid.NewGuid(), 
                Name = $"الصف {i} الإعدادي", 
                Level = i, 
                Stage = Stage.Preparatory 
            });
        }

        // Secondary: 1 -> 3
        for (int i = 1; i <= 3; i++)
        {
            grades.Add(new Grade { 
                Id = Guid.NewGuid(), 
                Name = $"الصف {i} الثانوي", 
                Level = i, 
                Stage = Stage.Secondary 
            });
        }

        await context.Grades.AddRangeAsync(grades);
        await context.SaveChangesAsync();
    }
}
