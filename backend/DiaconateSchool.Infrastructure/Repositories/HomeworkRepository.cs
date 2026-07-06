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

public class HomeworkRepository : IHomeworkRepository
{
    private readonly ApplicationDbContext _context;

    public HomeworkRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<HomeworkSubject>> GetSubjectsAsync()
        => await _context.HomeworkSubjects.OrderBy(s => s.DisplayOrder).ToListAsync();

    public async Task<List<Homework>> GetAllAsync(Guid? stageId, Guid? gradeId, Guid? subjectId, LessonStatus? status)
    {
        var query = _context.Homeworks
            .Include(h => h.Subject)
            .Include(h => h.Stage)
            .Include(h => h.Grade)
            .Include(h => h.Questions)
            .AsQueryable();

        if (stageId.HasValue) query = query.Where(h => h.StageId == stageId.Value);
        if (gradeId.HasValue) query = query.Where(h => h.GradeId == gradeId.Value);
        if (subjectId.HasValue) query = query.Where(h => h.SubjectId == subjectId.Value);
        if (status.HasValue) query = query.Where(h => h.Status == status.Value);

        return await query.OrderByDescending(h => h.CreatedAt).ToListAsync();
    }

    public async Task<Homework?> GetByIdAsync(Guid id)
        => await _context.Homeworks
            .Include(h => h.Subject)
            .Include(h => h.Stage)
            .Include(h => h.Grade)
            .Include(h => h.Questions.OrderBy(q => q.QuestionNumber))
            .FirstOrDefaultAsync(h => h.Id == id);

    public async Task AddAsync(Homework homework)
        => await _context.Homeworks.AddAsync(homework);

    public Task DeleteAsync(Homework homework)
    {
        _context.Homeworks.Remove(homework);
        return Task.CompletedTask;
    }

    public async Task<List<Homework>> GetPublishedForGradeAsync(Guid gradeId)
        => await _context.Homeworks
            .Include(h => h.Subject)
            .Include(h => h.Questions)
            .Where(h => h.GradeId == gradeId && h.Status == LessonStatus.Published)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync();

    public async Task<HomeworkSubmission?> GetSubmissionAsync(Guid homeworkId, Guid studentId)
        => await _context.HomeworkSubmissions
            .Include(s => s.Answers)
            .FirstOrDefaultAsync(s => s.HomeworkId == homeworkId && s.StudentId == studentId);

    public async Task AddSubmissionAsync(HomeworkSubmission submission)
        => await _context.HomeworkSubmissions.AddAsync(submission);

    public async Task<int> GetDraftCountAsync()
        => await _context.Homeworks.CountAsync(h => h.Status == LessonStatus.Draft);
}
