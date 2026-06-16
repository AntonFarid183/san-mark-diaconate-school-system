using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Infrastructure.Repositories;

public class HymnRepository : IHymnRepository
{
    private readonly ApplicationDbContext _context;

    public HymnRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Hymn?> GetByIdAsync(Guid id)
    {
        return await _context.Set<Hymn>()
            .Include(h => h.Grade)
            .FirstOrDefaultAsync(h => h.Id == id);
    }

    public async Task<List<Hymn>> GetByGradeAsync(Guid gradeId)
    {
        return await _context.Set<Hymn>()
            .Include(h => h.Grade)
            .Where(h => h.GradeId == gradeId)
            .OrderBy(h => h.DueDate)
            .ToListAsync();
    }

    public async Task<List<Hymn>> GetAllAsync()
    {
        return await _context.Set<Hymn>()
            .Include(h => h.Grade)
            .OrderByDescending(h => h.CreatedAt)
            .ToListAsync();
    }

    public async Task AddAsync(Hymn hymn)
    {
        await _context.Set<Hymn>().AddAsync(hymn);
    }

    public void Update(Hymn hymn)
    {
        _context.Set<Hymn>().Update(hymn);
    }

    public void Remove(Hymn hymn)
    {
        _context.Set<Hymn>().Remove(hymn);
    }
}
