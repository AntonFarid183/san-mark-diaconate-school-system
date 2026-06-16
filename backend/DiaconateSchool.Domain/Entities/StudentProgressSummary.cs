using System;

namespace DiaconateSchool.Domain.Entities;

public class StudentProgressSummary
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;
    public Guid StageId { get; set; }
    public Guid GradeId { get; set; }
    public int TotalLessons { get; set; }
    public int CompletedLessons { get; set; }
    public int TotalContentItems { get; set; }
    public int CompletedContentItems { get; set; }
    public double? AverageScore { get; set; }
    public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
}
