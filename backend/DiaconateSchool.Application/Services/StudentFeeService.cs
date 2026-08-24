using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Application.Interfaces.Services;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using System;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Services;

public class StudentFeeService : IStudentFeeService
{
    private readonly IAcademicYearRepository _academicYearRepo;
    private readonly IPaymentRepository _paymentRepo;

    public StudentFeeService(IAcademicYearRepository academicYearRepo, IPaymentRepository paymentRepo)
    {
        _academicYearRepo = academicYearRepo;
        _paymentRepo = paymentRepo;
    }

    public async Task<StudentAccount?> ChargeTermFeeAsync(Guid studentId)
    {
        var year = await _academicYearRepo.GetCurrentAsync();
        if (year is null || year.TermFee <= 0) return null;

        var account = await _paymentRepo.GetAccountByStudentIdAsync(studentId);
        if (account is null)
        {
            account = new StudentAccount
            {
                Id = Guid.NewGuid(),
                StudentId = studentId,
                TotalRequired = year.TermFee,
                Description = $"اشتراك {year.Name}"
            };
            await _paymentRepo.AddAccountAsync(account);
            return account;
        }

        if (account.TotalRequired <= 0)
        {
            account.TotalRequired = year.TermFee;
            account.Description ??= $"اشتراك {year.Name}";
        }

        return account;
    }

    public async Task RecordPaymentAsync(StudentAccount? account, decimal? explicitAmount, Guid recordedByUserId, string description)
    {
        if (account is null) return;

        var amount = explicitAmount ?? account.TotalRequired;
        if (amount <= 0) return;

        await AddTransactionAsync(account, amount, PaymentTransactionKind.Payment, recordedByUserId, description);
    }

    public async Task RecordDiscountAsync(StudentAccount? account, decimal amount, Guid recordedByUserId, string description)
    {
        if (account is null || amount <= 0) return;

        // Never waive more than what's actually still owed on this account.
        var owing = account.TotalRequired - account.Transactions.Where(t => !t.IsVoided).Sum(t => t.Amount);
        var capped = Math.Min(amount, Math.Max(owing, 0));
        if (capped <= 0) return;

        await AddTransactionAsync(account, capped, PaymentTransactionKind.Discount, recordedByUserId, description);
    }

    private async Task AddTransactionAsync(StudentAccount account, decimal amount, PaymentTransactionKind kind, Guid recordedByUserId, string description)
    {
        await _paymentRepo.AddTransactionAsync(new PaymentTransaction
        {
            Id = Guid.NewGuid(),
            StudentAccountId = account.Id,
            Amount = amount,
            Kind = kind,
            Description = description,
            TransactionDate = DateTime.UtcNow,
            RecordedByUserId = recordedByUserId,
            CreatedAt = DateTime.UtcNow
        });
    }
}
