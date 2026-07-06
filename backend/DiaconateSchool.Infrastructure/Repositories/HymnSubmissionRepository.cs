using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Infrastructure.Repositories;

public class HymnSubmissionRepository : IHymnSubmissionRepository
{
    private readonly ApplicationDbContext _context;

    public HymnSubmissionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<HymnSubmission?> GetByStudentAndLessonAsync(Guid studentId, Guid hymnLessonId)
        => await _context.HymnSubmissions
            .Include(s => s.HymnLesson)
            .Include(s => s.ReviewedByUser)
            .FirstOrDefaultAsync(s => s.StudentId == studentId && s.HymnLessonId == hymnLessonId);

    public async Task<HymnSubmission?> GetByIdAsync(Guid id)
        => await _context.HymnSubmissions
            .Include(s => s.HymnLesson)
            .Include(s => s.Student).ThenInclude(st => st.User)
            .Include(s => s.ReviewedByUser)
            .FirstOrDefaultAsync(s => s.Id == id);

    public async Task AddAsync(HymnSubmission submission)
        => await _context.HymnSubmissions.AddAsync(submission);

    public async Task<List<Student>> GetStudentsForRosterAsync(Guid gradeId, Guid? classId)
    {
        var query = _context.Students
            .Include(s => s.User)
            .Include(s => s.Class)
            .Where(s => s.GradeId == gradeId && s.User.IsActive)
            .AsQueryable();

        if (classId.HasValue)
            query = query.Where(s => s.ClassId == classId.Value);

        return await query
            .OrderBy(s => s.User.FirstName).ThenBy(s => s.User.LastName)
            .ToListAsync();
    }

    public async Task<List<HymnSubmission>> GetSubmissionsByLessonAsync(Guid hymnLessonId)
        => await _context.HymnSubmissions
            .Include(s => s.ReviewedByUser)
            .Where(s => s.HymnLessonId == hymnLessonId)
            .ToListAsync();

    public async Task<int> GetPendingCountAsync()
        => await _context.HymnSubmissions.CountAsync(s => s.Status == Domain.Enums.HymnSubmissionStatus.Pending);
}
