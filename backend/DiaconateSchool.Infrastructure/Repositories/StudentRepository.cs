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

        return await query
            .OrderBy(s => s.User.FirstName).ThenBy(s => s.User.MiddleName).ThenBy(s => s.User.ThirdName).ThenBy(s => s.User.LastName)
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
            .Include(s => s.Class)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<List<Student>> GetPendingAsync()
    {
        return await _context.Students
            .Include(s => s.User)
            .Include(s => s.Grade)
                .ThenInclude(g => g.Stage)
            .Where(s => !s.User.IsActive)
            .OrderBy(s => s.User.FirstName).ThenBy(s => s.User.MiddleName).ThenBy(s => s.User.ThirdName).ThenBy(s => s.User.LastName)
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

    public async Task<List<Student>> GetActiveStudentsWithBirthMonthIncludesAsync()
    {
        return await _context.Students
            .Include(s => s.User)
            .Include(s => s.Grade).ThenInclude(g => g.Stage)
            .Include(s => s.Class)
            .Where(s => s.User.IsActive)
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

    public async Task<Student?> GetByQrTokenAsync(string qrToken)
    {
        return await _context.Students
            .Include(s => s.User)
            .Include(s => s.Grade)
                .ThenInclude(g => g.Stage)
            .Include(s => s.Class)
            .FirstOrDefaultAsync(s => s.QrToken == qrToken);
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

    public async Task<(List<Student> Items, int TotalCount, int PaidCount, int NotPaidCount, int ExemptedCount, int DiscountCount, decimal TotalCollected, decimal TotalDiscounted, Dictionary<Guid, (decimal PaidAmount, decimal DiscountAmount, string Status)> Payments)> GetPaymentReportAsync(
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

        var matching = await query
            .OrderBy(s => s.User.FirstName).ThenBy(s => s.User.MiddleName).ThenBy(s => s.User.ThirdName).ThenBy(s => s.User.LastName)
            .ToListAsync();
        var studentIds = matching.Select(s => s.Id).ToList();

        var accountsByStudent = await _context.StudentAccounts
            .Include(a => a.Transactions)
            .Where(a => studentIds.Contains(a.StudentId))
            .ToDictionaryAsync(a => a.StudentId);

        var payments = new Dictionary<Guid, (decimal PaidAmount, decimal DiscountAmount, string Status)>();
        foreach (var s in matching)
        {
            decimal paid = 0;
            decimal discount = 0;
            var status = "exempted"; // no fee obligation recorded for this student
            if (accountsByStudent.TryGetValue(s.Id, out var account))
            {
                var live = account.Transactions.Where(t => !t.IsVoided).ToList();
                // Only Payment lines are money the school received. Discounts settle the
                // balance too, so they count toward "paid" status, but they must stay out
                // of `paid` itself -- that figure is summed into TotalCollected below.
                paid = live.Where(t => t.Kind == PaymentTransactionKind.Payment).Sum(t => t.Amount);
                discount = live.Where(t => t.Kind == PaymentTransactionKind.Discount).Sum(t => t.Amount);
                var settled = paid + discount;
                if (account.TotalRequired > 0)
                    status = settled >= account.TotalRequired ? "paid" : "not_paid";
            }
            payments[s.Id] = (paid, discount, status);
        }

        var paidCount = payments.Values.Count(p => p.Status == "paid");
        var notPaidCount = payments.Values.Count(p => p.Status == "not_paid");
        var exemptedCount = payments.Values.Count(p => p.Status == "exempted");
        var discountCount = payments.Values.Count(p => p.DiscountAmount > 0);
        var totalCollected = payments.Values.Sum(p => p.PaidAmount);
        var totalDiscounted = payments.Values.Sum(p => p.DiscountAmount);

        var items = matching;
        if (!string.IsNullOrWhiteSpace(paymentStatus))
            items = items.Where(s => payments[s.Id].Status == paymentStatus).ToList();

        return (items, items.Count, paidCount, notPaidCount, exemptedCount, discountCount, totalCollected, totalDiscounted, payments);
    }

    // Deletes in leaf-to-root order inside one transaction. Bulk
    // ExecuteDeleteAsync issues its own SQL immediately (doesn't batch
    // through SaveChanges), so the transaction is what makes this atomic --
    // without it, a failure partway through would leave the student's
    // history half-deleted instead of either fully gone or untouched.
    //
    // Must run through CreateExecutionStrategy() rather than a bare
    // BeginTransactionAsync: the DbContext is configured with
    // EnableRetryOnFailure (for Azure SQL serverless cold-start resilience,
    // see Program.cs), and SqlServerRetryingExecutionStrategy refuses a
    // user-initiated transaction it doesn't own -- it needs to be able to
    // retry the *whole* unit (including BEGIN/COMMIT) on a transient error,
    // not just individual statements inside a transaction it can't see.
    public async Task DeleteAsync(Guid studentId)
    {
        var student = await _context.Students.FindAsync(studentId)
            ?? throw new InvalidOperationException("الطالب غير موجود.");
        var userId = student.UserId;

        var strategy = _context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await _context.Database.BeginTransactionAsync();

            await _context.HomeworkAnswers.Where(a => a.HomeworkSubmission.StudentId == studentId).ExecuteDeleteAsync();
            await _context.HomeworkSubmissions.Where(s => s.StudentId == studentId).ExecuteDeleteAsync();
            await _context.PaymentTransactions.Where(t => t.StudentAccount.StudentId == studentId).ExecuteDeleteAsync();
            await _context.StudentAccounts.Where(a => a.StudentId == studentId).ExecuteDeleteAsync();
            await _context.HymnSubmissions.Where(s => s.StudentId == studentId).ExecuteDeleteAsync();
            await _context.HymnLessonProgresses.Where(p => p.StudentId == studentId).ExecuteDeleteAsync();
            await _context.LeaveRequests.Where(l => l.StudentId == studentId).ExecuteDeleteAsync();
            // AttendanceAuditLogs cascade from AttendanceRecords at the DB level
            // (FK OnDelete: Cascade) -- no separate delete needed for those.
            await _context.AttendanceRecords.Where(r => r.StudentId == studentId).ExecuteDeleteAsync();
            await _context.GradeHistories.Where(g => g.StudentId == studentId).ExecuteDeleteAsync();
            await _context.Certificates.Where(c => c.StudentId == studentId).ExecuteDeleteAsync();
            await _context.ExamResults.Where(e => e.StudentId == studentId).ExecuteDeleteAsync();
            await _context.StudentProgressSummaries.Where(p => p.StudentId == studentId).ExecuteDeleteAsync();
            await _context.ContentAccesses.Where(c => c.StudentId == studentId).ExecuteDeleteAsync();

            await _context.Students.Where(s => s.Id == studentId).ExecuteDeleteAsync();
            // The student's own login account -- not RegisteredByUserId (the
            // admin who registered them), that user is untouched.
            await _context.Users.Where(u => u.Id == userId).ExecuteDeleteAsync();

            await tx.CommitAsync();
        });
    }
}
