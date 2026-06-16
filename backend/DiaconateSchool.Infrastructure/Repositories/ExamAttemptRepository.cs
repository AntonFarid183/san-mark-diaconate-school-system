using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Infrastructure.Repositories;

public class ExamAttemptRepository : IExamAttemptRepository
{
    private readonly ApplicationDbContext _context;

    public ExamAttemptRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ExamAttempt?> GetByIdAsync(Guid id)
    {
        return await _context.Set<ExamAttempt>()
            .Include(a => a.Exam)
            .Include(a => a.Student).ThenInclude(s => s.User)
            .Include(a => a.Answers)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<ExamAttempt?> GetByExamAndStudentAsync(Guid examId, Guid studentId)
    {
        return await _context.Set<ExamAttempt>()
            .Include(a => a.Answers)
            .Where(a => a.ExamId == examId && a.StudentId == studentId)
            .OrderByDescending(a => a.StartedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<List<ExamAttempt>> GetByExamAsync(Guid examId)
    {
        return await _context.Set<ExamAttempt>()
            .Include(a => a.Student).ThenInclude(s => s.User)
            .Where(a => a.ExamId == examId)
            .OrderByDescending(a => a.SubmittedAt)
            .ToListAsync();
    }

    public async Task<List<ExamAttempt>> GetByStudentAsync(Guid studentId)
    {
        return await _context.Set<ExamAttempt>()
            .Include(a => a.Exam)
            .Where(a => a.StudentId == studentId)
            .OrderByDescending(a => a.StartedAt)
            .ToListAsync();
    }

    public async Task AddAsync(ExamAttempt attempt)
    {
        await _context.Set<ExamAttempt>().AddAsync(attempt);
    }

    public void Update(ExamAttempt attempt)
    {
        _context.Set<ExamAttempt>().Update(attempt);
    }
}
