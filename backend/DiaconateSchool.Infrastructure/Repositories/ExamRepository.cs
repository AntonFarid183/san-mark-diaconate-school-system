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

    public async Task<Exam?> GetByIdAsync(Guid id)
    {
        return await _context.Set<Exam>()
            .Include(e => e.Grade)
            .Include(e => e.Stage)
            .Include(e => e.Questions.OrderBy(q => q.SortOrder))
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<List<Exam>> GetByGradeAsync(Guid gradeId)
    {
        return await _context.Set<Exam>()
            .Include(e => e.Grade)
            .Include(e => e.Stage)
            .Where(e => e.GradeId == gradeId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Exam>> GetAllAsync()
    {
        return await _context.Set<Exam>()
            .Include(e => e.Grade)
            .Include(e => e.Stage)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task AddAsync(Exam exam)
    {
        await _context.Set<Exam>().AddAsync(exam);
    }

    public void Update(Exam exam)
    {
        _context.Set<Exam>().Update(exam);
    }

    public void Remove(Exam exam)
    {
        _context.Set<Exam>().Remove(exam);
    }
}
