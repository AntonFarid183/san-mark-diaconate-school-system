using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Infrastructure.Services;

public class StudentCodeGenerator : IStudentCodeGenerator
{
    private readonly ApplicationDbContext _context;

    public StudentCodeGenerator(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<string> GenerateNextAsync(int year)
    {
        var prefix = $"SM-{year}-";
        var lastStudent = await _context.Students
            .Where(s => s.StudentCode.StartsWith(prefix))
            .OrderByDescending(s => s.StudentCode)
            .FirstOrDefaultAsync();

        int nextSeq = 1;
        if (lastStudent != null)
        {
            var parts = lastStudent.StudentCode.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[2], out int lastSeq))
                nextSeq = lastSeq + 1;
        }

        return $"{prefix}{nextSeq:D4}";
    }
}
