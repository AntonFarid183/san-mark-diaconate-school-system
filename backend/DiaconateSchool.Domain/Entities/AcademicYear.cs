using System;

namespace DiaconateSchool.Domain.Entities;

public class AcademicYear
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool IsCurrent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
