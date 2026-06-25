using System;

namespace DiaconateSchool.Application.DTOs;

public class PromoteStudentDto
{
    public Guid ToGradeId { get; set; }
    public string AcademicYear { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class GradeHistoryDto
{
    public Guid Id { get; set; }
    public string FromGradeName { get; set; } = string.Empty;
    public string ToGradeName { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime PromotedAt { get; set; }
}
