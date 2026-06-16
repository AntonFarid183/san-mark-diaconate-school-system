using System;
using System.Collections.Generic;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

public class ExamAttempt
{
    public Guid Id { get; set; }
    public Guid ExamId { get; set; }
    public Exam Exam { get; set; } = null!;
    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;
    public ExamAttemptStatus Status { get; set; } = ExamAttemptStatus.InProgress;
    public int Score { get; set; }
    public int TotalPoints { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SubmittedAt { get; set; }

    public ICollection<ExamAnswer> Answers { get; set; } = new List<ExamAnswer>();
}
