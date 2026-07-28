using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Infrastructure.Repositories;

public class SchoolClassRepository : ISchoolClassRepository
{
    private readonly ApplicationDbContext _context;

    public SchoolClassRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<SchoolClass>> GetByGradeAndYearAsync(Guid gradeId, Guid academicYearId, StudentLevel level)
        => await _context.SchoolClasses
            .Include(c => c.Grade)
            .Include(c => c.AcademicYear)
            .Include(c => c.Students).ThenInclude(s => s.User)
            .Where(c => c.GradeId == gradeId && c.AcademicYearId == academicYearId && c.Level == level)
            .OrderBy(c => c.Name)
            .ToListAsync();

    public async Task<List<SchoolClass>> GetByAcademicYearIdAsync(Guid academicYearId)
        => await _context.SchoolClasses
            .Where(c => c.AcademicYearId == academicYearId)
            .ToListAsync();

    public async Task<SchoolClass?> GetByIdAsync(Guid id)
        => await _context.SchoolClasses
            .Include(c => c.Grade)
            .Include(c => c.AcademicYear)
            .Include(c => c.Students).ThenInclude(s => s.User)
            .FirstOrDefaultAsync(c => c.Id == id);

    public async Task<bool> NameExistsAsync(Guid gradeId, Guid academicYearId, StudentLevel level, string name, Guid? excludeId = null)
        => await _context.SchoolClasses.AnyAsync(c =>
            c.GradeId == gradeId &&
            c.AcademicYearId == academicYearId &&
            c.Level == level &&
            c.Name == name &&
            (excludeId == null || c.Id != excludeId.Value));

    public async Task AddRangeAsync(IEnumerable<SchoolClass> classes)
        => await _context.SchoolClasses.AddRangeAsync(classes);

    public Task DeleteRangeAsync(IEnumerable<SchoolClass> classes)
    {
        _context.SchoolClasses.RemoveRange(classes);
        return Task.CompletedTask;
    }

    public async Task<List<Student>> GetStudentsByGradeAsync(Guid gradeId, StudentLevel level)
        => await _context.Students
            .Include(s => s.User)
            .Where(s => s.GradeId == gradeId && s.Level == level && s.User.IsActive)
            .OrderBy(s => s.User.FirstName)
            .ThenBy(s => s.User.LastName)
            .ToListAsync();

    public async Task<List<Student>> GetStudentsByGradeForMoveAsync(IEnumerable<Guid> studentIds)
    {
        var ids = studentIds.ToList();
        return await _context.Students
            .Include(s => s.User)
            .Where(s => ids.Contains(s.Id))
            .ToListAsync();
    }
}
