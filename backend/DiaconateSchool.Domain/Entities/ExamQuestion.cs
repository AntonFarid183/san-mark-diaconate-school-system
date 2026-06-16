using System;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

public class ExamQuestion
{
    public Guid Id { get; set; }
    public Guid ExamId { get; set; }
    public Exam Exam { get; set; } = null!;
    public required string Text { get; set; }
    public QuestionType Type { get; set; }
    public int Points { get; set; }
    public string? Options { get; set; }
    public int? CorrectAnswerIndex { get; set; }
    public int SortOrder { get; set; }
}
