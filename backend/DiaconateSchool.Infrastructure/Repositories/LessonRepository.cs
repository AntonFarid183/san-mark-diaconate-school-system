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

public class LessonRepository : ILessonRepository
{
    private readonly ApplicationDbContext _context;

    public LessonRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Lesson?> GetByIdAsync(Guid id)
    {
        return await _context.Lessons
            .Include(l => l.Stage)
            .Include(l => l.Grade)
            .Include(l => l.ContentItems.OrderBy(ci => ci.SortOrder))
            .FirstOrDefaultAsync(l => l.Id == id);
    }

    public async Task<List<Lesson>> GetByGradeAsync(Guid gradeId, bool includePublished = false)
    {
        var query = _context.Lessons
            .Include(l => l.Stage)
            .Include(l => l.Grade)
            .Where(l => l.GradeId == gradeId);

        if (includePublished)
            query = query.Where(l => l.Status == LessonStatus.Published);

        return await query
            .OrderBy(l => l.LessonNumber)
            .ToListAsync();
    }

    public async Task<List<Lesson>> GetFilteredAsync(Guid? stageId, Guid? gradeId, string? status, int skip, int take)
    {
        var query = _context.Lessons
            .Include(l => l.Stage)
            .Include(l => l.Grade)
            .AsQueryable();

        if (stageId.HasValue)
            query = query.Where(l => l.StageId == stageId.Value);
        if (gradeId.HasValue)
            query = query.Where(l => l.GradeId == gradeId.Value);
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<LessonStatus>(status, true, out var parsedStatus))
            query = query.Where(l => l.Status == parsedStatus);

        return await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();
    }

    public async Task<int> GetFilteredCountAsync(Guid? stageId, Guid? gradeId, string? status)
    {
        var query = _context.Lessons.AsQueryable();

        if (stageId.HasValue)
            query = query.Where(l => l.StageId == stageId.Value);
        if (gradeId.HasValue)
            query = query.Where(l => l.GradeId == gradeId.Value);
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<LessonStatus>(status, true, out var parsedStatus))
            query = query.Where(l => l.Status == parsedStatus);

        return await query.CountAsync();
    }

    public async Task AddAsync(Lesson lesson)
    {
        await _context.Lessons.AddAsync(lesson);
    }

    public void Update(Lesson lesson)
    {
        _context.Lessons.Update(lesson);
    }

    public void Remove(Lesson lesson)
    {
        _context.Lessons.Remove(lesson);
    }
}
