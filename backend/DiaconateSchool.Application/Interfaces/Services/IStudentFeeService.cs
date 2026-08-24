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
    // Ensures a StudentAccount exists for the current academic year's TermFee
    // (never re-charges/overwrites an existing non-zero TotalRequired). Returns
    // null when there's no current year or its TermFee is 0.
    Task<StudentAccount?> ChargeTermFeeAsync(Guid studentId);

    // Records a Payment transaction for `explicitAmount`, or the account's
    // TotalRequired when not given, against `account`. No-op if the resolved
    // amount is null/zero or `account` is null.
    Task RecordPaymentAsync(StudentAccount? account, decimal? explicitAmount, Guid recordedByUserId, string description);
}
