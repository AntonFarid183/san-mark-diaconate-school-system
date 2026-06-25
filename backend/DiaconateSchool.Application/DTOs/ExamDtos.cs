using System;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Application.DTOs;

public class ExamListItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string GradeName { get; set; } = string.Empty;
    public string StageName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int ResultCount { get; set; }
}

public class ExamDetailDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid GradeId { get; set; }
    public string GradeName { get; set; } = string.Empty;
    public Guid StageId { get; set; }
    public string StageName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateExamDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid GradeId { get; set; }
    public Guid StageId { get; set; }
}

public class UpdateExamDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
}

public class EnterExamResultDto
{
    public Guid StudentId { get; set; }
    public string AcademicYear { get; set; } = string.Empty;
    public ExamPeriod Period { get; set; }
    public decimal Score { get; set; }
    public decimal TotalScore { get; set; }
    public string? Notes { get; set; }
}

public class ExamResultDto
{
    public Guid Id { get; set; }
    public Guid ExamId { get; set; }
    public string ExamTitle { get; set; } = string.Empty;
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentCode { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
    public string Period { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public decimal TotalScore { get; set; }
    public decimal Percentage { get; set; }
    public string? Notes { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime EnteredAt { get; set; }
    public Guid? CertificateId { get; set; }
}

public class ApproveExamResultDto
{
    public bool Approve { get; set; }
    public string? Notes { get; set; }
}
