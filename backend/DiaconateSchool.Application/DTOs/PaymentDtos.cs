using System;
using System.Collections.Generic;

namespace DiaconateSchool.Application.DTOs;

public class StudentAccountDto
{
    public Guid StudentId { get; set; }
    public decimal TotalRequired { get; set; }
    public string? Description { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal RemainingBalance { get; set; }
    public string Status { get; set; } = string.Empty; // paid / partial / not_paid / no_balance
    public List<PaymentTransactionDto> Transactions { get; set; } = new();
}

public class PaymentTransactionDto
{
    public Guid Id { get; set; }
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime TransactionDate { get; set; }
    public string RecordedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsVoided { get; set; }
    public string? VoidReason { get; set; }
    public string? VoidedByName { get; set; }
    public DateTime? VoidedAt { get; set; }
}

public class SetTotalRequiredDto
{
    public decimal TotalRequired { get; set; }
    public string? Description { get; set; }
}

public class CreateTransactionDto
{
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime? TransactionDate { get; set; }
}

public class UpdateTransactionDto
{
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime TransactionDate { get; set; }
}

public class VoidTransactionDto
{
    public string Reason { get; set; } = string.Empty;
}
