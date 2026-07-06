using DiaconateSchool.Domain.Enums;
using System;

namespace DiaconateSchool.Domain.Entities;

public class HymnSubmission
{
    public Guid Id { get; set; }

    public Guid HymnLessonId { get; set; }
    public HymnLesson HymnLesson { get; set; } = null!;

    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public required string RecordingUrl { get; set; }
    public string? RecordingFileName { get; set; }

    public HymnSubmissionStatus Status { get; set; } = HymnSubmissionStatus.Pending;

    public decimal? Score { get; set; }
    public string? Comments { get; set; }

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public ApplicationUser? ReviewedByUser { get; set; }
}
