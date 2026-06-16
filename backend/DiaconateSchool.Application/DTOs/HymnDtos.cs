using System;

namespace DiaconateSchool.Application.DTOs;

public class HymnListItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string DueDate { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public bool HasSubmitted { get; set; }
    public string? Feedback { get; set; }
    public int? Grade { get; set; }
}

public class HymnSubmissionDto
{
    public Guid Id { get; set; }
    public Guid HymnId { get; set; }
    public string HymnTitle { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public string AudioUrl { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int? Grade { get; set; }
    public string? Feedback { get; set; }
    public string SubmittedAt { get; set; } = string.Empty;
}

public class CreateHymnDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateOnly DueDate { get; set; }
    public Guid GradeId { get; set; }
}

public class HymnReviewDto
{
    public string Status { get; set; } = string.Empty;
    public int? Grade { get; set; }
    public string? Feedback { get; set; }
}
