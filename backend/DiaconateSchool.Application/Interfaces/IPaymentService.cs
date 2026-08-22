using DiaconateSchool.Application.DTOs;
using System;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces;

public interface IPaymentService
{
    Task<(bool Success, string? Error, StudentAccountDto? Result)> GetAccountAsync(Guid studentId);
    Task<StudentBalanceDto> GetMyBalanceAsync(Guid studentId);
    Task<(bool Success, string? Error, StudentAccountDto? Result)> SetTotalRequiredAsync(Guid studentId, SetTotalRequiredDto dto);
    Task<(bool Success, string? Error, StudentAccountDto? Result)> AddTransactionAsync(Guid studentId, CreateTransactionDto dto, Guid recordedByUserId);
    Task<(bool Success, string? Error, StudentAccountDto? Result)> UpdateTransactionAsync(Guid transactionId, UpdateTransactionDto dto);
    Task<(bool Success, string? Error, StudentAccountDto? Result)> VoidTransactionAsync(Guid transactionId, VoidTransactionDto dto, Guid voidedByUserId);
}
