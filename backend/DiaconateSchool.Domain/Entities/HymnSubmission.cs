using System;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

public class HymnSubmission
{
    public Guid Id { get; set; }
    public Guid HymnId { get; set; }
    public Hymn Hymn { get; set; } = null!;
    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;
    public required string AudioUrl { get; set; }
    public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;
    public int? Grade { get; set; }
    public string? Feedback { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
}
