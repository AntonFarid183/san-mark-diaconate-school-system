using System;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

public class Certificate
{
    public Guid Id { get; set; }

    public Guid ExamResultId { get; set; }
    public ExamResult ExamResult { get; set; } = null!;

    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public string StudentFullName { get; set; } = string.Empty;
    public string StageName { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
    public string ExamTitle { get; set; } = string.Empty;
    public ExamPeriod Period { get; set; }

    public decimal Score { get; set; }
    public decimal TotalScore { get; set; }
    public decimal Percentage { get; set; }
    public string Classification { get; set; } = string.Empty;

    public CertificateStatus Status { get; set; } = CertificateStatus.Active;

    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public Guid IssuedByUserId { get; set; }
}
