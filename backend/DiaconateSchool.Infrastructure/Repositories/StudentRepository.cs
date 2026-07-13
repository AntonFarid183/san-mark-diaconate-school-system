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

    public async Task<List<Student>> GetAllAsync(int page, int pageSize, string? nameFilter = null, Guid? gradeId = null, Guid? stageId = null, Guid? classId = null, StudentLevel? level = null)
    {
        var query = _context.Students
            .Include(s => s.User)
            .Include(s => s.Grade).ThenInclude(g => g.Stage)
            .Include(s => s.Class)
            .AsQueryable();

        if (classId.HasValue)
            query = query.Where(s => s.ClassId == classId.Value);
        else if (gradeId.HasValue)
            query = query.Where(s => s.GradeId == gradeId.Value);
        else if (stageId.HasValue)
            query = query.Where(s => s.Grade.StageId == stageId.Value);

        if (level.HasValue)
            query = query.Where(s => s.Level == level.Value);

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

    public async Task<int> GetFilteredCountAsync(string? nameFilter = null, Guid? gradeId = null, Guid? stageId = null, Guid? classId = null, StudentLevel? level = null)
    {
        var query = _context.Students.Include(s => s.User).Include(s => s.Grade).AsQueryable();

        if (classId.HasValue)
            query = query.Where(s => s.ClassId == classId.Value);
        else if (gradeId.HasValue)
            query = query.Where(s => s.GradeId == gradeId.Value);
        else if (stageId.HasValue)
            query = query.Where(s => s.Grade.StageId == stageId.Value);

        if (level.HasValue)
            query = query.Where(s => s.Level == level.Value);

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

    // Fan-out target list for notifications: by grade, by stage, or everyone (both null)
    public async Task<List<Student>> GetActiveStudentsForNotificationAsync(Guid? stageId, Guid? gradeId)
    {
        var query = _context.Students
            .Include(s => s.User)
            .Where(s => s.User.IsActive)
            .AsQueryable();

        if (gradeId.HasValue) query = query.Where(s => s.GradeId == gradeId.Value);
        else if (stageId.HasValue) query = query.Where(s => s.Grade.StageId == stageId.Value);

        return await query.ToListAsync();
    }

    public async Task<Student?> GetByUserIdAsync(Guid userId)
    {
        return await _context.Students
            .Include(s => s.User)
            .Include(s => s.Grade)
                .ThenInclude(g => g.Stage)
            .FirstOrDefaultAsync(s => s.UserId == userId);
    }

    public async Task<List<Student>> GetByIdsAsync(IEnumerable<Guid> ids)
    {
        var idList = ids.ToList();
        return await _context.Students
            .Where(s => idList.Contains(s.Id))
            .ToListAsync();
    }

    public Task UpdateAsync(Student student)
    {
        _context.Students.Update(student);
        return Task.CompletedTask;
    }

    public async Task<(List<Student> Items, int TotalCount, int PaidCount, decimal TotalCollected, Dictionary<Guid, (decimal PaidAmount, string Status)> Payments)> GetPaymentReportAsync(
        string? nameFilter, Guid? stageId, Guid? gradeId, string? paymentStatus, DateTime? dateFrom, DateTime? dateTo)
    {
        // Payment status/amounts come from the ledger (StudentAccount/PaymentTransaction) — the
        // source of truth the "المدفوعات" modal actually writes to — not the legacy
        // Student.FeesPaid/PaidAmount fields, which are only ever set once at registration/activation
        // and go stale the moment a payment is recorded afterward.
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

        var matching = await query.OrderByDescending(s => s.RegisteredDate).ToListAsync();
        var studentIds = matching.Select(s => s.Id).ToList();

        var accountsByStudent = await _context.StudentAccounts
            .Include(a => a.Transactions)
            .Where(a => studentIds.Contains(a.StudentId))
            .ToDictionaryAsync(a => a.StudentId);

        var payments = new Dictionary<Guid, (decimal PaidAmount, string Status)>();
        foreach (var s in matching)
        {
            decimal paid = 0;
            var status = "exempted"; // no fee obligation recorded for this student
            if (accountsByStudent.TryGetValue(s.Id, out var account))
            {
                paid = account.Transactions.Where(t => !t.IsVoided).Sum(t => t.Amount);
                if (account.TotalRequired > 0)
                    status = paid >= account.TotalRequired ? "paid" : "not_paid";
            }
            payments[s.Id] = (paid, status);
        }

        var paidCount = payments.Values.Count(p => p.Status == "paid");
        var totalCollected = payments.Values.Sum(p => p.PaidAmount);

        var items = matching;
        if (!string.IsNullOrWhiteSpace(paymentStatus))
            items = items.Where(s => payments[s.Id].Status == paymentStatus).ToList();

        return (items, items.Count, paidCount, totalCollected, payments);
    }
}
