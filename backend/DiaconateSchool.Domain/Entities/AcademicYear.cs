using System;

namespace DiaconateSchool.Domain.Entities;

public class AcademicYear
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public bool IsCurrent { get; set; }

    // Standard subscription fee for this year, charged to each student when their
    // account is activated. Lives on the year (not a global setting) so raising it
    // next year leaves last year's records showing what was actually charged then.
    public decimal TermFee { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
