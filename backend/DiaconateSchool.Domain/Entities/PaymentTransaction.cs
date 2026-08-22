using System;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

public class PaymentTransaction
{
    public Guid Id { get; set; }

    public Guid StudentAccountId { get; set; }
    public StudentAccount StudentAccount { get; set; } = null!;

    public decimal Amount { get; set; }
    public PaymentTransactionKind Kind { get; set; } = PaymentTransactionKind.Payment;
    public required string Description { get; set; }
    public string? Notes { get; set; }

    public DateTime TransactionDate { get; set; }
    public Guid RecordedByUserId { get; set; }
    public ApplicationUser RecordedByUser { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsVoided { get; set; }
    public string? VoidReason { get; set; }
    public Guid? VoidedByUserId { get; set; }
    public ApplicationUser? VoidedByUser { get; set; }
    public DateTime? VoidedAt { get; set; }
}
