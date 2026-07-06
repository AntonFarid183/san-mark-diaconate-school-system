using System;

namespace DiaconateSchool.Application.DTOs;

public class HymnSubmissionDto
{
    public Guid Id { get; set; }
    public Guid HymnLessonId { get; set; }
    public string HymnTitle { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // pending / approved / resubmission_requested
    public string RecordingUrl { get; set; } = string.Empty;
    public string? RecordingFileName { get; set; }
    public decimal? Score { get; set; }
    public string? Comments { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewedByName { get; set; }
}

public class SubmitHymnRecordingDto
{
    public string RecordingUrl { get; set; } = string.Empty;
    public string? RecordingFileName { get; set; }
}

public class ReviewHymnSubmissionDto
{
    public decimal? Score { get; set; }
    public string? Comments { get; set; }
    public bool Approve { get; set; } // true = Approved, false = ResubmissionRequested
}

public class HymnSubmissionRosterItemDto
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentCode { get; set; } = string.Empty;
    public string? ClassName { get; set; }

    public Guid? SubmissionId { get; set; }
    public string Status { get; set; } = "not_submitted";
    public string? RecordingUrl { get; set; }
    public string? RecordingFileName { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public decimal? Score { get; set; }
    public string? Comments { get; set; }
}
