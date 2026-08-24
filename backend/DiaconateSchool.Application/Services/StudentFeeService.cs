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

        await _paymentRepo.AddTransactionAsync(new PaymentTransaction
        {
            Id = Guid.NewGuid(),
            StudentAccountId = account.Id,
            Amount = amount,
            Kind = PaymentTransactionKind.Payment,
            Description = description,
            TransactionDate = DateTime.UtcNow,
            RecordedByUserId = recordedByUserId,
            CreatedAt = DateTime.UtcNow
        });
    }
}
