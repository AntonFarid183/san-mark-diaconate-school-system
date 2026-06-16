using System;

namespace DiaconateSchool.Domain.Entities;

public class ExamAnswer
{
    public Guid Id { get; set; }
    public Guid ExamAttemptId { get; set; }
    public ExamAttempt ExamAttempt { get; set; } = null!;
    public Guid QuestionId { get; set; }
    public ExamQuestion Question { get; set; } = null!;
    public string? SelectedOptionIndex { get; set; }
    public string? EssayAnswer { get; set; }
    public bool IsCorrect { get; set; }
    public int PointsAwarded { get; set; }
}
