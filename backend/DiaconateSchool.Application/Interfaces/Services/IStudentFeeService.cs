using DiaconateSchool.Domain.Entities;
using System;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Services;

// Single place that charges the current year's term fee onto a student's
// ledger and, when told the fee was actually collected, records the matching
// PaymentTransaction — shared by every path that can bring a student to
// Active (pending-approval activation, direct admin registration, ...) so
// none of them can drift out of sync with what the payment report reads.
public interface IStudentFeeService
{
    // Ensures a StudentAccount exists for `customAmount` (a specific amount an
    // admin typed for "سداد لاحقاً"), or the current academic year's TermFee
    // when not given (never re-charges/overwrites an existing non-zero
    // TotalRequired). Returns null when there's no customAmount, no current
    // year, or the year's TermFee is 0.
    Task<StudentAccount?> ChargeTermFeeAsync(Guid studentId, decimal? customAmount = null);

    // Records a Payment transaction for `explicitAmount`, or the account's
    // TotalRequired when not given, against `account`. No-op if the resolved
    // amount is null/zero or `account` is null.
    Task RecordPaymentAsync(StudentAccount? account, decimal? explicitAmount, Guid recordedByUserId, string description);

    // Records a Discount transaction — the gap between what was actually
    // collected and the full fee. No-op if `account` is null or `amount` is
    // not positive; clamped so a discount can never exceed what's still owed.
    Task RecordDiscountAsync(StudentAccount? account, decimal amount, Guid recordedByUserId, string description);
}
