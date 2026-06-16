using System;
using System.Collections.Generic;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

public class Exam
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public int DurationMinutes { get; set; }
    public int TotalPoints { get; set; }
    public int PassingScore { get; set; }
    public Guid GradeId { get; set; }
    public Grade Grade { get; set; } = null!;
    public Guid StageId { get; set; }
    public Stage Stage { get; set; } = null!;
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ExamQuestion> Questions { get; set; } = new List<ExamQuestion>();
    public ICollection<ExamAttempt> Attempts { get; set; } = new List<ExamAttempt>();
}
