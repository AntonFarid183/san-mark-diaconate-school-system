using System;

namespace DiaconateSchool.Application.DTOs;

public class CertificateDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentFullName { get; set; } = string.Empty;
    public string StudentCode { get; set; } = string.Empty;
    public string StageName { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
    public string ExamTitle { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public decimal TotalScore { get; set; }
    public decimal Percentage { get; set; }
    public string Classification { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; }
}
