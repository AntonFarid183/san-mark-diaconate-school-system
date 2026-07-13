using DiaconateSchool.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IPaymentRepository
{
    Task<StudentAccount?> GetAccountByStudentIdAsync(Guid studentId);
    Task AddAccountAsync(StudentAccount account);
    Task AddTransactionAsync(PaymentTransaction transaction);
    Task<PaymentTransaction?> GetTransactionByIdAsync(Guid transactionId);
    Task<bool> StudentExistsAsync(Guid studentId);
    Task<List<StudentAccount>> GetOutstandingAccountsAsync();
}
