using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Services;

public class PaymentService : IPaymentService
{
    private readonly IPaymentRepository _repo;
    private readonly IStudentRepository _studentRepo;
    private readonly IUnitOfWork _uow;

    public PaymentService(IPaymentRepository repo, IStudentRepository studentRepo, IUnitOfWork uow)
    {
        _repo = repo;
        _studentRepo = studentRepo;
        _uow = uow;
    }

    public async Task<(bool Success, string? Error, StudentAccountDto? Result)> GetAccountAsync(Guid studentId)
    {
        var account = await GetOrCreateAccountAsync(studentId);
        if (account == null) return (false, "الطالب غير موجود.", null);

        return (true, null, Map(account));
    }

    public async Task<(bool Success, string? Error, StudentAccountDto? Result)> SetTotalRequiredAsync(Guid studentId, SetTotalRequiredDto dto)
    {
        if (dto.TotalRequired < 0)
            return (false, "المبلغ المطلوب لا يمكن أن يكون سالباً.", null);

        var account = await GetOrCreateAccountAsync(studentId);
        if (account == null) return (false, "الطالب غير موجود.", null);

        account.TotalRequired = dto.TotalRequired;
        account.Description = string.IsNullOrWhiteSpace(dto.Description) ? null : dto.Description.Trim();
        await _uow.SaveChangesAsync();

        return (true, null, Map(account));
    }

    public async Task<(bool Success, string? Error, StudentAccountDto? Result)> AddTransactionAsync(
        Guid studentId, CreateTransactionDto dto, Guid recordedByUserId)
    {
        if (dto.Amount <= 0)
            return (false, "المبلغ يجب أن يكون أكبر من صفر.", null);

        if (string.IsNullOrWhiteSpace(dto.Description))
            return (false, "الوصف مطلوب.", null);

        var account = await GetOrCreateAccountAsync(studentId);
        if (account == null) return (false, "الطالب غير موجود.", null);

        var transaction = new PaymentTransaction
        {
            Id = Guid.NewGuid(),
            StudentAccountId = account.Id,
            Amount = dto.Amount,
            Description = dto.Description.Trim(),
            Notes = dto.Notes,
            TransactionDate = dto.TransactionDate ?? DateTime.UtcNow,
            RecordedByUserId = recordedByUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _repo.AddTransactionAsync(transaction);
        await _uow.SaveChangesAsync();

        // Re-fetch to include the new transaction with navigation properties
        var refreshed = await _repo.GetAccountByStudentIdAsync(studentId);
        return (true, null, Map(refreshed!));
    }

    public async Task<(bool Success, string? Error, StudentAccountDto? Result)> UpdateTransactionAsync(
        Guid transactionId, UpdateTransactionDto dto)
    {
        if (dto.Amount <= 0)
            return (false, "المبلغ يجب أن يكون أكبر من صفر.", null);

        if (string.IsNullOrWhiteSpace(dto.Description))
            return (false, "الوصف مطلوب.", null);

        var transaction = await _repo.GetTransactionByIdAsync(transactionId);
        if (transaction == null) return (false, "الدفعة غير موجودة.", null);

        if (transaction.IsVoided)
            return (false, "لا يمكن تعديل دفعة ملغاة.", null);

        transaction.Amount = dto.Amount;
        transaction.Description = dto.Description.Trim();
        transaction.Notes = dto.Notes;
        transaction.TransactionDate = dto.TransactionDate;

        await _uow.SaveChangesAsync();

        var refreshed = await _repo.GetAccountByStudentIdAsync(transaction.StudentAccount.StudentId);
        return (true, null, Map(refreshed!));
    }

    public async Task<(bool Success, string? Error, StudentAccountDto? Result)> VoidTransactionAsync(
        Guid transactionId, VoidTransactionDto dto, Guid voidedByUserId)
    {
        if (string.IsNullOrWhiteSpace(dto.Reason))
            return (false, "سبب الإلغاء مطلوب.", null);

        var transaction = await _repo.GetTransactionByIdAsync(transactionId);
        if (transaction == null) return (false, "الدفعة غير موجودة.", null);

        if (transaction.IsVoided)
            return (false, "الدفعة ملغاة بالفعل.", null);

        transaction.IsVoided = true;
        transaction.VoidReason = dto.Reason.Trim();
        transaction.VoidedByUserId = voidedByUserId;
        transaction.VoidedAt = DateTime.UtcNow;

        await _uow.SaveChangesAsync();

        var refreshed = await _repo.GetAccountByStudentIdAsync(transaction.StudentAccount.StudentId);
        return (true, null, Map(refreshed!));
    }

    private async Task<StudentAccount?> GetOrCreateAccountAsync(Guid studentId)
    {
        var account = await _repo.GetAccountByStudentIdAsync(studentId);
        if (account != null) return account;

        var student = await _studentRepo.GetByIdWithIncludesAsync(studentId);
        if (student == null) return null;

        account = new StudentAccount
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            TotalRequired = 0
        };
        await _repo.AddAccountAsync(account);

        // Carry the amount paid at registration into the ledger so it isn't "lost"
        if (student.FeesPaid && student.PaidAmount is > 0)
        {
            await _repo.AddTransactionAsync(new PaymentTransaction
            {
                Id = Guid.NewGuid(),
                StudentAccountId = account.Id,
                Amount = student.PaidAmount.Value,
                Description = "رسوم التسجيل",
                Notes = "تم ترحيلها تلقائياً من بيانات تفعيل الحساب",
                TransactionDate = student.RegisteredDate,
                RecordedByUserId = student.RegisteredByUserId,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _uow.SaveChangesAsync();

        // Re-fetch with includes for consistent mapping
        return await _repo.GetAccountByStudentIdAsync(studentId);
    }

    private static StudentAccountDto Map(StudentAccount a)
    {
        var amountPaid = a.Transactions.Where(t => !t.IsVoided).Sum(t => t.Amount);
        var remaining = a.TotalRequired - amountPaid;

        string status;
        if (a.TotalRequired <= 0) status = "no_balance";
        else if (remaining <= 0) status = "paid";
        else if (amountPaid > 0) status = "partial";
        else status = "not_paid";

        return new StudentAccountDto
        {
            StudentId = a.StudentId,
            TotalRequired = a.TotalRequired,
            Description = a.Description,
            AmountPaid = amountPaid,
            RemainingBalance = Math.Max(0, remaining),
            Status = status,
            Transactions = a.Transactions
                .OrderByDescending(t => t.TransactionDate)
                .Select(t => new PaymentTransactionDto
                {
                    Id = t.Id,
                    Amount = t.Amount,
                    Description = t.Description,
                    Notes = t.Notes,
                    TransactionDate = t.TransactionDate,
                    RecordedByName = $"{t.RecordedByUser.FirstName} {t.RecordedByUser.LastName}".Trim(),
                    CreatedAt = t.CreatedAt,
                    IsVoided = t.IsVoided,
                    VoidReason = t.VoidReason,
                    VoidedByName = t.VoidedByUser != null ? $"{t.VoidedByUser.FirstName} {t.VoidedByUser.LastName}".Trim() : null,
                    VoidedAt = t.VoidedAt
                }).ToList()
        };
    }
}
