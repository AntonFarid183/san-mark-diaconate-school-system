using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Infrastructure.Repositories;

public class StudentRepository : IStudentRepository
{
    private readonly ApplicationDbContext _context;

    public StudentRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Student student)
    {
        await _context.Students.AddAsync(student);
    }

    public async Task<bool> ExistsAsync(string firstName, string middleName, string thirdName, string lastName, DateOnly dateOfBirth)
    {
        return await _context.Students.AnyAsync(s =>
            s.User.FirstName == firstName &&
            s.User.MiddleName == middleName &&
            s.User.ThirdName == thirdName &&
            s.User.LastName == lastName &&
            s.DateOfBirth == dateOfBirth);
    }

    public async Task<int> GetTotalCountAsync()
    {
        return await _context.Students.CountAsync();
    }

    public async Task<IEnumerable<Grade>> GetGradesByStageAsync(Guid stageId)
    {
        return await _context.Grades
            .Where(g => g.StageId == stageId)
            .OrderBy(g => g.Level)
            .ToListAsync();
    }

    public async Task<IEnumerable<Stage>> GetAllStagesAsync()
    {
        return await _context.Stages
            .OrderBy(s => s.DisplayOrder)
            .ToListAsync();
    }

    public async Task<List<Student>> GetAllAsync(int page, int pageSize, string? nameFilter = null)
    {
        var query = _context.Students
            .Include(s => s.User)
            .Include(s => s.Grade)
                .ThenInclude(g => g.Stage)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(nameFilter))
        {
            var filter = nameFilter.Trim();
            query = query.Where(s =>
                s.User.FirstName.Contains(filter) ||
                s.User.MiddleName.Contains(filter) ||
                s.User.ThirdName.Contains(filter) ||
                s.User.LastName.Contains(filter) ||
                s.StudentCode.Contains(filter));
        }

        return await query
            .OrderByDescending(s => s.RegisteredDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetFilteredCountAsync(string? nameFilter = null)
    {
        var query = _context.Students.Include(s => s.User).AsQueryable();

        if (!string.IsNullOrWhiteSpace(nameFilter))
        {
            var filter = nameFilter.Trim();
            query = query.Where(s =>
                s.User.FirstName.Contains(filter) ||
                s.User.MiddleName.Contains(filter) ||
                s.User.ThirdName.Contains(filter) ||
                s.User.LastName.Contains(filter) ||
                s.StudentCode.Contains(filter));
        }

        return await query.CountAsync();
    }

    public async Task<Student?> GetByIdWithIncludesAsync(Guid id)
    {
        return await _context.Students
            .Include(s => s.User)
            .Include(s => s.Grade)
                .ThenInclude(g => g.Stage)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<Student?> GetByUserIdAsync(Guid userId)
    {
        return await _context.Students
            .Include(s => s.User)
            .Include(s => s.Grade)
                .ThenInclude(g => g.Stage)
            .FirstOrDefaultAsync(s => s.UserId == userId);
    }

    public Task UpdateAsync(Student student)
    {
        _context.Students.Update(student);
        return Task.CompletedTask;
    }
}
