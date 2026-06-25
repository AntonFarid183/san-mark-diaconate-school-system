using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DiaconateSchool.Infrastructure.Repositories;

public class HymnLessonProgressRepository : IHymnLessonProgressRepository
{
    private readonly ApplicationDbContext _context;

    public HymnLessonProgressRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<HymnLessonProgress?> GetAsync(Guid studentId, Guid hymnLessonId)
        => await _context.HymnLessonProgresses
            .FirstOrDefaultAsync(p => p.StudentId == studentId && p.HymnLessonId == hymnLessonId);

    public async Task<List<HymnLessonProgress>> GetByStudentAsync(Guid studentId)
        => await _context.HymnLessonProgresses
            .Include(p => p.HymnLesson).ThenInclude(hl => hl.Stage)
            .Where(p => p.StudentId == studentId)
            .OrderByDescending(p => p.LastViewedAt)
            .ToListAsync();

    public async Task<List<HymnLessonProgress>> GetByLessonAsync(Guid hymnLessonId)
        => await _context.HymnLessonProgresses
            .Include(p => p.Student).ThenInclude(s => s.User)
            .Where(p => p.HymnLessonId == hymnLessonId)
            .ToListAsync();

    public async Task UpsertAsync(HymnLessonProgress progress)
    {
        var existing = await _context.HymnLessonProgresses
            .FirstOrDefaultAsync(p => p.StudentId == progress.StudentId && p.HymnLessonId == progress.HymnLessonId);

        if (existing == null)
            await _context.HymnLessonProgresses.AddAsync(progress);
        else
        {
            existing.MaxReachedPosition = progress.MaxReachedPosition;
            existing.LastPosition       = progress.LastPosition;
            existing.TotalDuration      = progress.TotalDuration;
            existing.WatchedPercent     = progress.WatchedPercent;
            existing.IsCompleted        = progress.IsCompleted;
            existing.CompletedAt        = progress.CompletedAt;
            existing.LastViewedAt       = progress.LastViewedAt;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<HymnLessonProgressStats> GetLessonStatsAsync(Guid hymnLessonId)
    {
        var lesson = await _context.HymnLessons.FindAsync(hymnLessonId);
        if (lesson == null) return new HymnLessonProgressStats();

        var totalStudents = await _context.Students
            .Where(s => s.Grade != null && s.Grade.StageId == lesson.StageId)
            .CountAsync();

        var progresses = await _context.HymnLessonProgresses
            .Where(p => p.HymnLessonId == hymnLessonId)
            .ToListAsync();

        var started   = progresses.Count;
        var completed = progresses.Count(p => p.IsCompleted);
        var avg       = started > 0 ? progresses.Average(p => (double)p.WatchedPercent) : 0;

        return new HymnLessonProgressStats
        {
            TotalStudents  = totalStudents,
            Started        = started,
            Completed      = completed,
            NeverStarted   = Math.Max(0, totalStudents - started),
            AveragePercent = (decimal)Math.Round(avg, 1),
            CompletionRate = totalStudents > 0 ? Math.Round((decimal)completed / totalStudents * 100, 1) : 0,
        };
    }
}
