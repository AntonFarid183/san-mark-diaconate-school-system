using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Infrastructure.Repositories;

public class ExamRepository : IExamRepository
{
    private readonly ApplicationDbContext _context;

    public ExamRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Exam>> GetAllAsync(Guid? gradeId = null, Guid? stageId = null)
    {
        var query = _context.Exams
            .Include(e => e.Grade)
            .Include(e => e.Stage)
            .Include(e => e.Results)
            .AsQueryable();

        if (gradeId.HasValue) query = query.Where(e => e.GradeId == gradeId.Value);
        if (stageId.HasValue) query = query.Where(e => e.StageId == stageId.Value);

        return await query.OrderByDescending(e => e.CreatedAt).ToListAsync();
    }

    public async Task<Exam?> GetByIdAsync(Guid id)
    {
        return await _context.Exams
            .Include(e => e.Grade)
            .Include(e => e.Stage)
            .Include(e => e.Results)
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task AddAsync(Exam exam)
    {
        await _context.Exams.AddAsync(exam);
    }

    public Task UpdateAsync(Exam exam)
    {
        _context.Exams.Update(exam);
        return Task.CompletedTask;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var exam = await _context.Exams.FindAsync(id);
        if (exam == null) return false;
        _context.Exams.Remove(exam);
        return true;
    }
}

public class ExamResultRepository : IExamResultRepository
{
    private readonly ApplicationDbContext _context;

    public ExamResultRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<ExamResult>> GetByExamAsync(Guid examId)
    {
        return await _context.ExamResults
            .Include(r => r.Exam)
            .Include(r => r.Student).ThenInclude(s => s.User)
            .Include(r => r.Certificate)
            .Where(r => r.ExamId == examId)
            .OrderByDescending(r => r.EnteredAt)
            .ToListAsync();
    }

    public async Task<List<ExamResult>> GetByStudentAsync(Guid studentId)
    {
        return await _context.ExamResults
            .Include(r => r.Exam).ThenInclude(e => e.Grade).ThenInclude(g => g.Stage)
            .Include(r => r.Student).ThenInclude(s => s.User)
            .Include(r => r.Certificate)
            .Where(r => r.StudentId == studentId)
            .OrderByDescending(r => r.EnteredAt)
            .ToListAsync();
    }

    public async Task<ExamResult?> GetByIdAsync(Guid id)
    {
        return await _context.ExamResults
            .Include(r => r.Exam)
            .Include(r => r.Student).ThenInclude(s => s.User)
            .Include(r => r.Student).ThenInclude(s => s.Grade).ThenInclude(g => g.Stage)
            .Include(r => r.Certificate)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task AddAsync(ExamResult result)
    {
        await _context.ExamResults.AddAsync(result);
    }

    public Task UpdateAsync(ExamResult result)
    {
        _context.ExamResults.Update(result);
        return Task.CompletedTask;
    }
}
