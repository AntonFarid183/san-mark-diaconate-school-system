using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace DiaconateSchool.Infrastructure.Repositories;

public class PaymentRepository : IPaymentRepository
{
    private readonly ApplicationDbContext _context;

    public PaymentRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<StudentAccount?> GetAccountByStudentIdAsync(Guid studentId)
        => await _context.StudentAccounts
            .Include(a => a.Transactions).ThenInclude(t => t.RecordedByUser)
            .FirstOrDefaultAsync(a => a.StudentId == studentId);

    public async Task AddAccountAsync(StudentAccount account)
        => await _context.StudentAccounts.AddAsync(account);

    public async Task AddTransactionAsync(PaymentTransaction transaction)
        => await _context.PaymentTransactions.AddAsync(transaction);

    public async Task<PaymentTransaction?> GetTransactionByIdAsync(Guid transactionId)
        => await _context.PaymentTransactions
            .Include(t => t.StudentAccount)
            .FirstOrDefaultAsync(t => t.Id == transactionId);

    public async Task<bool> StudentExistsAsync(Guid studentId)
        => await _context.Students.AnyAsync(s => s.Id == studentId);

    public async Task<int> GetOutstandingBalanceCountAsync()
        => await _context.StudentAccounts.CountAsync(a =>
            a.TotalRequired > 0 &&
            a.TotalRequired > a.Transactions.Where(t => !t.IsVoided).Sum(t => (decimal?)t.Amount ?? 0));
}
