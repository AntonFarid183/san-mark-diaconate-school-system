using System;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

public class Hymn
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public DateOnly DueDate { get; set; }
    public Guid GradeId { get; set; }
    public Grade Grade { get; set; } = null!;
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<HymnSubmission> Submissions { get; set; } = new List<HymnSubmission>();
}
