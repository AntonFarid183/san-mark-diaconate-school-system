using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Infrastructure.Repositories;

public class GradeHistoryRepository : IGradeHistoryRepository
{
    private readonly ApplicationDbContext _context;

    public GradeHistoryRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<GradeHistory>> GetByStudentAsync(Guid studentId)
    {
        return await _context.GradeHistories
            .Include(h => h.FromGrade)
            .Include(h => h.ToGrade)
            .Where(h => h.StudentId == studentId)
            .OrderByDescending(h => h.PromotedAt)
            .ToListAsync();
    }

    public async Task AddAsync(GradeHistory history)
    {
        await _context.GradeHistories.AddAsync(history);
    }
}
