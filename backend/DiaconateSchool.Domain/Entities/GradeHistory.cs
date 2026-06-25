using System;

namespace DiaconateSchool.Domain.Entities;

public class GradeHistory
{
    public Guid Id { get; set; }

    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public Guid FromGradeId { get; set; }
    public Grade FromGrade { get; set; } = null!;

    public Guid ToGradeId { get; set; }
    public Grade ToGrade { get; set; } = null!;

    public string AcademicYear { get; set; } = string.Empty;
    public string? Notes { get; set; }

    public Guid PromotedByUserId { get; set; }
    public DateTime PromotedAt { get; set; } = DateTime.UtcNow;
}
