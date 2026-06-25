using System;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

public class ExamResult
{
    public Guid Id { get; set; }

    public Guid ExamId { get; set; }
    public Exam Exam { get; set; } = null!;

    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public string AcademicYear { get; set; } = string.Empty;
    public ExamPeriod Period { get; set; }

    public decimal Score { get; set; }
    public decimal TotalScore { get; set; }
    public decimal Percentage { get; set; }

    public string? Notes { get; set; }

    public ExamResultStatus Status { get; set; } = ExamResultStatus.Pending;

    public Guid EnteredByUserId { get; set; }
    public DateTime EnteredAt { get; set; } = DateTime.UtcNow;

    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAt { get; set; }

    public Certificate? Certificate { get; set; }
}
