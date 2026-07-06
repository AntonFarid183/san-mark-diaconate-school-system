using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Infrastructure.Repositories;

public class AcademicYearRepository : IAcademicYearRepository
{
    private readonly ApplicationDbContext _context;

    public AcademicYearRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<AcademicYear>> GetAllAsync()
        => await _context.AcademicYears
            .OrderByDescending(y => y.StartDate)
            .ToListAsync();

    public async Task<AcademicYear?> GetByIdAsync(Guid id)
        => await _context.AcademicYears.FindAsync(id);

    public async Task<AcademicYear?> GetCurrentAsync()
        => await _context.AcademicYears.FirstOrDefaultAsync(y => y.IsCurrent);

    public async Task AddAsync(AcademicYear year)
        => await _context.AcademicYears.AddAsync(year);

    public Task DeleteAsync(AcademicYear year)
    {
        _context.AcademicYears.Remove(year);
        return Task.CompletedTask;
    }

    public async Task<bool> NameExistsAsync(string name, Guid? excludeId = null)
        => await _context.AcademicYears.AnyAsync(y =>
            y.Name == name && (excludeId == null || y.Id != excludeId.Value));
}
