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

    public async Task<List<Student>> GetAllAsync(int page, int pageSize, string? nameFilter = null, Guid? gradeId = null, Guid? stageId = null)
    {
        var query = _context.Students
            .Include(s => s.User)
            .Include(s => s.Grade).ThenInclude(g => g.Stage)
            .AsQueryable();

        if (gradeId.HasValue)
            query = query.Where(s => s.GradeId == gradeId.Value);
        else if (stageId.HasValue)
            query = query.Where(s => s.Grade.StageId == stageId.Value);

        if (!string.IsNullOrWhiteSpace(nameFilter))
        {
            var filter = nameFilter.Trim();
            query = query.Where(s =>
                s.User.FirstName.Contains(filter) || s.User.MiddleName.Contains(filter) ||
                s.User.ThirdName.Contains(filter) || s.User.LastName.Contains(filter) ||
                s.StudentCode.Contains(filter));
        }

        return await query.OrderByDescending(s => s.RegisteredDate)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
    }

    public async Task<int> GetFilteredCountAsync(string? nameFilter = null, Guid? gradeId = null, Guid? stageId = null)
    {
        var query = _context.Students.Include(s => s.User).Include(s => s.Grade).AsQueryable();

        if (gradeId.HasValue)
            query = query.Where(s => s.GradeId == gradeId.Value);
        else if (stageId.HasValue)
            query = query.Where(s => s.Grade.StageId == stageId.Value);

        if (!string.IsNullOrWhiteSpace(nameFilter))
        {
            var filter = nameFilter.Trim();
            query = query.Where(s =>
                s.User.FirstName.Contains(filter) || s.User.MiddleName.Contains(filter) ||
                s.User.ThirdName.Contains(filter) || s.User.LastName.Contains(filter) ||
                s.StudentCode.Contains(filter));
        }

        return await query.CountAsync();
    }

    public async Task<List<Grade>> GetAllGradesAsync()
    {
        return await _context.Grades
            .Include(g => g.Stage)
            .OrderBy(g => g.Stage.DisplayOrder)
            .ThenBy(g => g.Name)
            .ToListAsync();
    }

    public async Task<Student?> GetByIdWithIncludesAsync(Guid id)
    {
        return await _context.Students
            .Include(s => s.User)
            .Include(s => s.Grade)
                .ThenInclude(g => g.Stage)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<List<Student>> GetPendingAsync()
    {
        return await _context.Students
            .Include(s => s.User)
            .Include(s => s.Grade)
                .ThenInclude(g => g.Stage)
            .Where(s => !s.User.IsActive)
            .OrderByDescending(s => s.RegisteredDate)
            .ToListAsync();
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

    public async Task<(List<Student> Items, int TotalCount, int PaidCount, decimal TotalCollected)> GetPaymentReportAsync(
        string? nameFilter, Guid? stageId, Guid? gradeId, string? paymentStatus, DateTime? dateFrom, DateTime? dateTo)
    {
        var query = _context.Students
            .Include(s => s.User)
            .Include(s => s.Grade).ThenInclude(g => g.Stage)
            .AsQueryable();

        if (gradeId.HasValue)
            query = query.Where(s => s.GradeId == gradeId.Value);
        else if (stageId.HasValue)
            query = query.Where(s => s.Grade.StageId == stageId.Value);

        if (!string.IsNullOrWhiteSpace(nameFilter))
        {
            var filter = nameFilter.Trim();
            query = query.Where(s =>
                s.User.FirstName.Contains(filter) || s.User.MiddleName.Contains(filter) ||
                s.User.ThirdName.Contains(filter) || s.User.LastName.Contains(filter) ||
                s.StudentCode.Contains(filter));
        }

        if (dateFrom.HasValue)
            query = query.Where(s => s.RegisteredDate >= dateFrom.Value);
        if (dateTo.HasValue)
            query = query.Where(s => s.RegisteredDate <= dateTo.Value);

        var paidCount = await query.CountAsync(s => s.FeesPaid);
        var totalCollected = await query.Where(s => s.FeesPaid && s.PaidAmount.HasValue)
            .SumAsync(s => (decimal?)s.PaidAmount) ?? 0;

        if (!string.IsNullOrWhiteSpace(paymentStatus))
        {
            query = paymentStatus switch
            {
                "paid" => query.Where(s => s.FeesPaid),
                "not_paid" => query.Where(s => !s.FeesPaid),
                _ => query
            };
        }

        var items = await query.OrderByDescending(s => s.RegisteredDate).ToListAsync();
        var totalCount = items.Count;

        return (items, totalCount, paidCount, totalCollected);
    }
}
